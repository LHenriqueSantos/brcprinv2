import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const data = await req.formData();
    const files = data.getAll("files");
    const infill = data.get("infill");
    const quantities = data.get("quantities");
    const scales = data.get("scales");
    const material = data.get("material") as string | null; // optional hint for filament lookup

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "Nenhum arquivo enviado para fatiamento." }, { status: 400 });
    }

    const slicerData = new FormData();
    if (infill) slicerData.append("infill", infill);
    if (quantities) slicerData.append("quantities", quantities);
    if (scales) slicerData.append("scales", scales);

    for (const file of files) {
      slicerData.append("files", file as Blob, (file as File).name);
    }

    console.log(`[Next Proxy] Forwarding ${files.length} files to Headless Slicer...`);

    const slicerRes = await fetch("http://slicer:3005/slice", {
      method: "POST",
      body: slicerData as unknown as BodyInit,
    });

    if (!slicerRes.ok) {
      const errorText = await slicerRes.text();
      console.error("[Next Proxy] Slicer Error:", errorText);
      throw new Error(errorText || "Slicer container returned an error status.");
    }

    const slicerResult = await slicerRes.json();

    // --- Calculate estimated_price using real costs from DB ---
    try {
      const pool = (await import("@/lib/db")).default;
      const { calculateCosts } = await import("@/lib/pricing");

      const [cRows]: any = await pool.query("SELECT * FROM business_config WHERE id = 1");
      const config = cRows[0];

      // Find matching filament by material hint, fallback to first available
      let fRows: any;
      if (material) {
        [fRows] = await pool.query("SELECT * FROM filaments WHERE type LIKE ? LIMIT 1", [`%${material}%`]);
      } else {
        [fRows] = await pool.query("SELECT * FROM filaments LIMIT 1");
      }
      const filament = fRows[0];

      // Find first active FDM printer, fallback to any printer
      let pRows: any;
      [pRows] = await pool.query("SELECT * FROM printers WHERE active = 1 AND type = 'FDM' LIMIT 1");
      let printer = pRows[0];
      if (!printer) {
        [pRows] = await pool.query("SELECT * FROM printers LIMIT 1");
        printer = pRows[0];
      }

      if (config && filament && printer) {
        // Calculate total quantity from quantities map
        let qty = 1;
        if (quantities) {
          try {
            const q = JSON.parse(quantities as string);
            qty = Math.max(1, Object.values(q).reduce((s: number, v: any) => s + Number(v), 0) as number);
          } catch { /* use 1 */ }
        }

        const costs = calculateCosts({
          print_time_hours: slicerResult.print_time_hours || 0,
          filament_used_g: slicerResult.weight_g || 0,
          setup_time_hours: 0.25,
          post_process_hours: 0,
          quantity: qty,
          energy_kwh_price: Number(config.energy_kwh_price),
          labor_hourly_rate: Number(config.labor_hourly_rate),
          profit_margin_pct: Number(config.default_profit_margin_pct),
          loss_pct: Number(config.default_loss_pct),
          spare_parts_pct: Number(config.spare_parts_reserve_pct),
          power_watts: Number(printer.power_watts),
          purchase_price: Number(printer.purchase_price),
          lifespan_hours: Number(printer.lifespan_hours),
          maintenance_reserve_pct: Number(printer.maintenance_reserve_pct),
          cost_per_kg: Number(filament.cost_per_kg),
        });

        slicerResult.estimated_price = costs.final_price;
        slicerResult.estimated_price_per_unit = costs.final_price_per_unit;
        console.log(`[Next Proxy] Estimated price: R$ ${costs.final_price} (${qty} units)`);
      }
    } catch (priceErr: any) {
      // Non-fatal: return slicer data without estimated_price, frontend will use its own fallback
      console.warn("[Next Proxy] Could not calculate estimated_price:", priceErr.message);
    }

    return NextResponse.json(slicerResult);

  } catch (err: any) {
    console.error("[Next Proxy ERROR]", err);
    return NextResponse.json({ error: err.message || "Erro interno ao contatar fatiador" }, { status: 500 });
  }
}
