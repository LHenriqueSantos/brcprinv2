import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import fs from "fs";
import path from "path";
// @ts-ignore
import NodeStl from "node-stl";
import { calculateCosts } from "@/lib/pricing";
import { calculateShipping } from "@/lib/shipping";
import crypto from "crypto";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = searchParams.get("limit") || "50";
    const [rows] = await pool.query(
      `SELECT qr.*, c.name AS client_name, c.email AS client_email
       FROM quote_requests qr
       LEFT JOIN clients c ON qr.client_id = c.id
       ORDER BY qr.created_at DESC LIMIT ?`,
      [parseInt(limit)]
    );
    return NextResponse.json(rows);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email || !(session?.user as any).id) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const client_id = (session.user as any).id;
    const body = await req.json();
    const {
      title, items, notes, client_zipcode, coupon_code, upsells, action,
      client_address, client_address_number, client_address_comp,
      client_neighborhood, client_city, client_state, client_document, client_name, delivery_method
    } = body;

    // Legacy fallback bindings
    let payloadItems = items;
    if (!payloadItems || !Array.isArray(payloadItems) || payloadItems.length === 0) {
      // Support legacy web-to-print requests
      const { file_url, file_urls, material_preference, color_preference, infill_percentage, quantity } = body;
      const urlsToProcess = file_urls && Array.isArray(file_urls) ? file_urls : (file_url ? [file_url] : []);

      if (urlsToProcess.length === 0) {
        return NextResponse.json({ error: "O aquivo 3D (STL/OBJ) é obrigatório." }, { status: 400 });
      }

      payloadItems = urlsToProcess.map(url => ({
        file_url: url,
        name: url.split('/').pop(),
        material: material_preference || "PLA",
        color: color_preference || "",
        infill: Number(infill_percentage) || 20,
        quantity: Number(quantity) || 1
      }));
    }

    const primary_url = payloadItems[0].file_url;
    const legacy_file_urls = payloadItems.map((i: any) => i.file_url);
    const legacy_material = payloadItems[0].material;
    const legacy_infill = payloadItems[0].infill;
    const legacy_quantity = payloadItems.reduce((acc: number, curr: any) => acc + (curr.quantity || 1), 0);

    // Process Coupon First
    let couponId = null;
    let couponValue = 0;
    let couponType = 'percentage';
    let discountAmount = 0;

    if (coupon_code) {
      const [cRows] = await pool.query(
        "SELECT id, type, value, active, usage_limit, times_used, expires_at FROM coupons WHERE code = ?",
        [String(coupon_code).toUpperCase()]
      );
      const coupon = (cRows as any[])[0];
      if (coupon && coupon.active) {
        let isValid = true;
        if (coupon.usage_limit && coupon.times_used >= coupon.usage_limit) isValid = false;
        if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) isValid = false;

        if (isValid) {
          couponId = coupon.id;
          couponValue = Number(coupon.value);
          couponType = coupon.type;
        }
      }
    }

    // Include items payload in DB (Migration 52)
    const [result] = await pool.query(
      `INSERT INTO quote_requests (
          title, client_id, file_url, file_urls, material_preference, color_preference, infill_percentage, quantity, notes, client_zipcode, coupon_id, items,
          client_address, client_address_number, client_address_comp, client_neighborhood, client_city, client_state, client_document, client_name
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title || null, client_id, primary_url, JSON.stringify(legacy_file_urls), legacy_material, '', legacy_infill, legacy_quantity, notes, client_zipcode || null, couponId, JSON.stringify(payloadItems),
        client_address || null, client_address_number || null, client_address_comp || null, client_neighborhood || null, client_city || null, client_state || null, client_document || null, client_name || null
      ]
    );

    const requestId = (result as any).insertId;

    // --- INSTANT QUOTING LOGIC (PER-ITEM ASSEMBLY CALCULATION) ---
    try {
      // Global Data Fetch
      const [cRows] = await pool.query("SELECT * FROM business_config WHERE id = 1");
      const config = (cRows as any[])[0];

      const [clientRows] = await pool.query(
        `SELECT c.discount_margin_pct, c.subscription_status,
                sp.filament_type as b2b_filament, sp.b2b_filament_cost
         FROM clients c
         LEFT JOIN subscription_plans sp ON c.subscription_plan_id = sp.id
         WHERE c.id = ?`, [client_id]
      );
      const client = (clientRows as any[])[0];
      const discountMarginPct = client?.discount_margin_pct ? Number(client.discount_margin_pct) : 0;
      const effectiveProfitMargin = Math.max(0, Number(config.default_profit_margin_pct) - discountMarginPct);

      if (config && config.enable_auto_quoting && action !== 'review') {

        // --- BATCH PROCESSING & NESTING LOGIC (Phase 59) ---
        // 1. Group items by Material & Printer Type (Nesting only works for items on the same bed)
        const groups: Record<string, { items: any[], type: 'FDM' | 'SLA' }> = {};

        for (const item of payloadItems) {
          const isSLA = String(item.material || '').toUpperCase().includes('SLA') ||
            String(item.material || '').toUpperCase().includes('RESINA');
          const groupKey = `${item.material || 'PLA'}_${isSLA ? 'SLA' : 'FDM'}`;

          if (!groups[groupKey]) {
            groups[groupKey] = { items: [], type: isSLA ? 'SLA' : 'FDM' };
          }
          groups[groupKey].items.push(item);
        }

        // Shared aggregators across all material groups
        let totalPrintTime = 0;
        let totalWeightGrams = 0;
        let totalSetupHours = 0;
        let totalCostFilament = 0;
        let totalCostEnergy = 0;
        let totalCostDepreciation = 0;
        let totalCostMaintenance = 0;
        let totalCostLabor = 0;
        let totalCostLosses = 0;
        let totalCostSpareParts = 0;
        let totalCostProduction = 0;
        let totalCalculatedProfit = 0;
        let totalBaseFinalPrice = 0;
        let validFilesCount = 0;

        let globalPrinterId = null;
        let globalFilamentId = null;

        for (const groupKey in groups) {
          const group = groups[groupKey];
          const materialName = group.items[0].material || 'PLA';

          let groupWeightG = 0;
          let groupTimeH = 0;
          let groupSlicerSuccess = false;

          // Try Batch Slicing for this material group
          try {
            const formData = new FormData();
            const quantitiesMap: Record<string, number> = {};
            const scalesMap: Record<string, number> = {};
            let attachedFiles = 0;

            for (const item of group.items) {
              const fileName = item.file_url.split('/').pop();
              if (!fileName) continue;
              const filePath = path.join(process.cwd(), "public", "uploads", fileName);

              if (fs.existsSync(filePath)) {
                const fileBuffer = fs.readFileSync(filePath);
                const fileBlob = new Blob([fileBuffer]);
                formData.append('files', fileBlob, fileName);
                quantitiesMap[fileName] = (quantitiesMap[fileName] || 0) + (item.quantity || 1);
                // Apply scale from item payload (scale_pct is percentage, slicer expects ratio 0..N)
                scalesMap[fileName] = (item.scale_pct || 100) / 100;
                attachedFiles++;
              }
            }

            if (attachedFiles > 0) {
              formData.append('quantities', JSON.stringify(quantitiesMap));
              formData.append('scales', JSON.stringify(scalesMap));
              formData.append('infill', String(group.items[0].infill || 20));

              console.log(`[QUOTER] Requesting BATCH slicing for group ${groupKey} (${attachedFiles} files)...`);
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 60000); // 1 minute timeout for batch

              const res = await fetch("http://slicer:3005/slice", {
                method: "POST",
                body: formData,
                signal: controller.signal
              });
              clearTimeout(timeoutId);

              if (res.ok) {
                const data = await res.json();
                if (data.success) {
                  groupSlicerSuccess = true;
                  groupWeightG = data.weight_g;
                  groupTimeH = data.print_time_hours;
                  validFilesCount += group.items.length;

                  if (data.gcode_url) {
                    group.items[0].gcode_url = data.gcode_url;
                  }
                  console.log(`[QUOTER] Batch Slicer Success: ${groupWeightG}g in ${groupTimeH}h`);
                }
              }
            }
          } catch (batchErr) {
            console.error(`[QUOTER] Batch Slicer failed for ${groupKey}, falling back to individual estimation:`, batchErr);
          }

          // 2. Cost Calculation for the Group
          const [fRows] = await pool.query("SELECT * FROM filaments WHERE type LIKE ? LIMIT 1", [`%${materialName}%`]);
          let filament = (fRows as any[])[0] || (await pool.query("SELECT * FROM filaments LIMIT 1").then((r: any) => r[0][0]));

          // Overwrite B2B filament cost if applicable
          if (
            client?.subscription_status === 'active' &&
            client?.b2b_filament_cost > 0 &&
            (client.b2b_filament && filament.type.toUpperCase().includes(client.b2b_filament.toUpperCase()))
          ) {
            filament.cost_per_kg = client.b2b_filament_cost;
            console.log(`[QUOTER] B2B VIP Discount applied! Filament cost changed to R$${client.b2b_filament_cost}/kg`);
          }

          const [pRows] = await pool.query("SELECT * FROM printers WHERE active = 1 AND type = ? LIMIT 1", [group.type]);
          let printer = (pRows as any[])[0] || (await pool.query("SELECT * FROM printers LIMIT 1").then((r: any) => r[0][0]));

          if (filament) globalFilamentId = filament.id;
          if (printer) globalPrinterId = printer.id;

          if (printer && filament) {
            let finalGroupTime = 0;
            let finalGroupWeight = 0;
            let finalGroupSetup = 0;

            if (groupSlicerSuccess) {
              finalGroupTime = groupTimeH;
              finalGroupWeight = groupWeightG;
              finalGroupSetup = (printer.type === 'SLA') ? 0.5 : 0.25;
            } else {
              // Individual fallback
              for (const item of group.items) {
                const fileName = item.file_url.split('/').pop();
                if (!fileName) continue;
                const filePath = path.join(process.cwd(), "public", "uploads", fileName);
                const stl = new NodeStl(filePath, { density: 1.0 });
                const vol = stl.volume || 0;
                const qty = item.quantity || 1;
                validFilesCount++;

                if (printer.type === 'SLA') {
                  const maxZ = stl.boundingBox ? stl.boundingBox[2] : 10;
                  finalGroupTime += (maxZ / 20.0) * qty;
                  finalGroupWeight += vol * 1.15 * Number(filament.density_g_cm3 || 1.1) * qty;
                  finalGroupSetup += 0.5 * qty;
                } else {
                  const actualVol = vol * (0.3 + (0.7 * (item.infill / 100)));
                  const w = actualVol * Number(filament.density_g_cm3 || 1.25);
                  finalGroupTime += (w / 10.0) * qty;
                  finalGroupWeight += w * qty;
                  finalGroupSetup += 0.25 * qty;
                }
              }
            }

            // Apply AMS/MMU Multicolor Penalties
            if (payloadItems[0]?.is_multicolor && config.enable_multicolor) {
              const wasteG = Number(config.multicolor_waste_g) || 50;
              const hoursAdd = Number(config.multicolor_hours_added) || 1.5;
              finalGroupWeight += wasteG;
              finalGroupTime += hoursAdd;
              console.log(`[QUOTER] Applied Multi-color penalties: +${wasteG}g, +${hoursAdd}h`);
            }

            // Track bounding box for dynamic shipping
            let maxDimX = 0, maxDimY = 0, maxDimZ = 0;
            // Best effort global dimensions
            try {
              for (const item of group.items) {
                const fileName = item.file_url.split('/').pop();
                if (!fileName) continue;
                const filePath = path.join(process.cwd(), "public", "uploads", fileName);
                const stl = new NodeStl(filePath, { density: 1.0 });
                if (stl.boundingBox) {
                  if (stl.boundingBox[0] > maxDimX) maxDimX = stl.boundingBox[0];
                  if (stl.boundingBox[1] > maxDimY) maxDimY = stl.boundingBox[1];
                  if (stl.boundingBox[2] > maxDimZ) maxDimZ = stl.boundingBox[2];
                }
              }
            } catch (e) { }

            const costs = calculateCosts({
              print_time_hours: finalGroupTime,
              filament_used_g: finalGroupWeight,
              setup_time_hours: finalGroupSetup,
              post_process_hours: 0,
              quantity: 1,
              energy_kwh_price: Number(config.energy_kwh_price),
              labor_hourly_rate: Number(config.labor_hourly_rate),
              profit_margin_pct: effectiveProfitMargin,
              loss_pct: Number(config.default_loss_pct),
              spare_parts_pct: Number(config.spare_parts_reserve_pct),
              power_watts: Number(printer.power_watts),
              purchase_price: Number(printer.purchase_price),
              lifespan_hours: Number(printer.lifespan_hours),
              maintenance_reserve_pct: Number(printer.maintenance_reserve_pct),
              cost_per_kg: Number(filament.cost_per_kg),
              packaging_cost: 0 // Will be added globally based on dimension fit
            });

            // Store dimensions in group object for shipping stage
            (group as any).maxDimX = maxDimX;
            (group as any).maxDimY = maxDimY;
            (group as any).maxDimZ = maxDimZ;
            totalPrintTime += finalGroupTime;
            totalWeightGrams += finalGroupWeight;
            totalSetupHours += finalGroupSetup;
            totalCostFilament += costs.cost_filament;
            totalCostEnergy += costs.cost_energy;
            totalCostDepreciation += costs.cost_depreciation;
            totalCostMaintenance += costs.cost_maintenance;
            totalCostLabor += costs.cost_labor;
            totalCostLosses += costs.cost_losses;
            totalCostSpareParts += costs.cost_spare_parts;
            totalCostProduction += costs.cost_total_production;
            totalCalculatedProfit += costs.profit_value;

            // Apply AMS Markup if enabled
            let markupMultiplier = 1;
            if (payloadItems[0]?.is_multicolor && config.enable_multicolor) {
              const markupPct = Number(config.multicolor_markup_pct) || 15;
              markupMultiplier = 1 + (markupPct / 100);
              console.log(`[QUOTER] Applied Multi-color markup: ${markupPct}%`);
            }

            totalBaseFinalPrice += (costs.final_price * markupMultiplier);

            group.items.forEach(it => {
              it._calc = {
                unit_price: (costs.final_price / group.items.length) / (it.quantity || 1),
                total_price: (costs.final_price / group.items.length)
              };
            });
          }
        } // end group loop

        // If we processed all files successfully
        if (validFilesCount === payloadItems.length && totalBaseFinalPrice > 0) {

          const finalQuoteTitle = title || (payloadItems.length > 1
            ? `Montagem/Lote (${payloadItems.length} peças)`
            : `Fração Automática (${primary_url.split('/').pop()})`);

          // --- DYNAMIC SHIPPING CALCULATION ---
          let shippingCost = 0;
          let shippingService = delivery_method === 'pickup' ? "Retirada em Mãos" : "Retirada no local";
          let appliedPackagingCost = 0;

          if (delivery_method !== 'pickup' && client_zipcode && config.company_zipcode && config.shipping_api_provider !== 'none') {

            // 1. Calculate the maximum required box dimensions across all groups
            let reqX = 0, reqY = 0, reqZ = 0;
            for (const gk in groups) {
              const g = groups[gk] as any;
              if (g.maxDimX > reqX) reqX = g.maxDimX;
              if (g.maxDimY > reqY) reqY = g.maxDimY;
              if (g.maxDimZ > reqZ) reqZ = g.maxDimZ;
            }
            // Convert mm to cm
            reqX = reqX / 10.0; reqY = reqY / 10.0; reqZ = reqZ / 10.0;
            // Sort dimensions so we can compare [Small, Medium, Large] vs [Length, Width, Height]
            const reqDims = [reqX, reqY, reqZ].sort((a, b) => b - a);

            // 2. Fetch available packaging sizes
            const [boxesRows]: any = await pool.query("SELECT * FROM packaging_sizes WHERE active=1 ORDER BY (length_cm * width_cm * height_cm) ASC");
            let selectedBox = null;

            for (const box of boxesRows) {
              const boxDims = [Number(box.length_cm), Number(box.width_cm), Number(box.height_cm)].sort((a, b) => b - a);
              // If the biggest model dimension fits in the biggest box dimension, etc.
              if (boxDims[0] >= reqDims[0] && boxDims[1] >= reqDims[1] && boxDims[2] >= reqDims[2] && Number(box.max_weight_kg) >= (totalWeightGrams / 1000)) {
                selectedBox = box;
                break;
              }
            }

            // Fallback if no box fits or no boxes exist
            if (!selectedBox && boxesRows.length > 0) {
              selectedBox = boxesRows[boxesRows.length - 1]; // Use biggest
            }

            const activeLength = selectedBox ? Number(selectedBox.length_cm) : Number(config.packaging_length || 20);
            const activeWidth = selectedBox ? Number(selectedBox.width_cm) : Number(config.packaging_width || 20);
            const activeHeight = selectedBox ? Number(selectedBox.height_cm) : Number(config.packaging_height || 10);
            appliedPackagingCost = selectedBox ? Number(selectedBox.cost || 0) : Number(config.packaging_cost || 0);

            console.log(`[SHIPPING] Selected Box: ${selectedBox ? selectedBox.name : 'Fallback'} (${activeLength}x${activeWidth}x${activeHeight}cm). Added cost R$${appliedPackagingCost}`);

            const results = await calculateShipping({
              fromZip: config.company_zipcode,
              toZip: client_zipcode,
              weight_g: totalWeightGrams,
              dimensions: {
                length: activeLength,
                width: activeWidth,
                height: activeHeight,
              },
              provider: config.shipping_api_provider,
              token: config.shipping_api_token
            });

            if (results && results.length > 0) {
              const best = results[0]; // Take first option
              shippingCost = best.price;
              shippingService = best.name;
            }
          } else if (delivery_method !== 'pickup' && client_zipcode && config.company_zipcode) {
            shippingCost = 20.00;
            shippingService = "Frete Fixo";
          }

          // Distribute packaging cost into the final calculations
          if (appliedPackagingCost > 0) {
            totalCostProduction += appliedPackagingCost;
            totalCalculatedProfit = totalCostProduction * (effectiveProfitMargin / 100);
            totalBaseFinalPrice = totalCostProduction + totalCalculatedProfit;
          }

          // Adjust base final price with the Coupon Discount (if any)
          let basePriceForDiscount = totalBaseFinalPrice;
          if (couponId) {
            if (couponType === 'percentage') {
              discountAmount = basePriceForDiscount * (couponValue / 100);
            } else {
              discountAmount = couponValue;
            }
            if (discountAmount > basePriceForDiscount) discountAmount = basePriceForDiscount;
          }

          const discountedFinalPrice = basePriceForDiscount - discountAmount;
          const totalGlobalQuantity = payloadItems.reduce((acc: number, curr: any) => acc + (curr.quantity || 1), 0);
          const discountedPerUnit = discountedFinalPrice / totalGlobalQuantity;

          // Process Upsells
          let totalUpsellCost = 0;
          const upsellLog: any[] = [];

          if (upsells && Array.isArray(upsells) && upsells.length > 0) {
            const uIds = upsells.filter((id: any) => !isNaN(Number(id)));
            if (uIds.length > 0) {
              const [uRows] = await pool.query(
                `SELECT id, name, charge_type, charge_value, per_unit FROM upsell_options WHERE active = 1 AND id IN (${uIds.join(',')})`
              );
              const fetchedUpsells = uRows as any[];

              for (const u of fetchedUpsells) {
                let rowCost = 0;
                if (u.charge_type === 'labor_hours') rowCost = Number(u.charge_value) * Number(config.labor_hourly_rate);
                else rowCost = Number(u.charge_value);

                if (u.per_unit) rowCost *= totalGlobalQuantity;

                totalUpsellCost += rowCost;
                upsellLog.push({ id: u.id, name: u.name, price_applied: rowCost, per_unit: u.per_unit });
              }
            }
          }

          const priceWithShippingAndUpsells = discountedFinalPrice + shippingCost + totalUpsellCost;

          // G-code fallback for global quotes table (if single item)
          const primaryGcodeUrl = payloadItems[0].gcode_url || null;
          const publicToken = crypto.randomUUID();

          // We will use 1 for now or null since the REAL data is in the JSON `items`
          const [qResult] = await pool.query(
            `INSERT INTO quotes (
                  title, client_id, public_token, printer_id, filament_id, print_time_hours, filament_used_g,
                  setup_time_hours, post_process_hours, quantity, infill_percentage,
                  energy_kwh_price, labor_hourly_rate, profit_margin_pct, loss_pct, spare_parts_pct,
                  printer_power_watts, printer_purchase_price, printer_lifespan_hours, printer_maintenance_pct,
                  filament_cost_per_kg,
                  cost_filament, cost_energy, cost_depreciation, cost_maintenance, cost_labor,
                  cost_losses, cost_spare_parts, cost_total_production, profit_value,
                  final_price, final_price_per_unit, valid_days, status, file_urls,
                  client_zipcode, shipping_cost, shipping_service, coupon_id, discount_value,
                  extras, items, gcode_url, is_multicolor,
                  client_address, client_address_number, client_address_comp, client_neighborhood, client_city, client_state, client_document, client_name
                ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,30, 'quoted', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              finalQuoteTitle, client_id, publicToken,
              globalPrinterId, globalFilamentId, totalPrintTime, totalWeightGrams, totalSetupHours, 0, totalGlobalQuantity, payloadItems[0].infill,
              Number(config.energy_kwh_price), Number(config.labor_hourly_rate), effectiveProfitMargin, Number(config.default_loss_pct), Number(config.spare_parts_reserve_pct),
              100, 1000, 10000, 5, 100, // Dummy printer/filament fallback since it's now per item
              totalCostFilament, totalCostEnergy, totalCostDepreciation, totalCostMaintenance, totalCostLabor,
              totalCostLosses, totalCostSpareParts, totalCostProduction, totalCalculatedProfit,
              priceWithShippingAndUpsells, discountedPerUnit, JSON.stringify(legacy_file_urls),
              client_zipcode || null, shippingCost, shippingService, couponId, discountAmount,
              upsellLog.length > 0 ? JSON.stringify(upsellLog) : null,
              JSON.stringify(payloadItems), // Store the fully calculated JSON assembly!
              primaryGcodeUrl, // Store the primary generated G-code URL directly into the global row for webhooks
              payloadItems[0].is_multicolor ? 1 : 0,
              client_address || null, client_address_number || null, client_address_comp || null,
              client_neighborhood || null, client_city || null, client_state || null,
              client_document || null, client_name || null
            ]
          );

          if (couponId) {
            await pool.query("UPDATE coupons SET times_used = times_used + 1 WHERE id = ?", [couponId]);
          }

          const quoteId = (qResult as any).insertId;

          await pool.query(
            "UPDATE quote_requests SET status = 'quoted', quote_id = ? WHERE id = ?",
            [quoteId, requestId]
          );

          return NextResponse.json({ success: true, request_id: requestId, quote_token: publicToken });
        }
      }
    } catch (autoErr) {
      console.error("Instant quoting/Review routing failed:", autoErr);
    }

    // If action === 'review' or auto quoting is disabled completely, or some other validation failed
    return NextResponse.json({ success: true, request_id: requestId, quote_token: null });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
