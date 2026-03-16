import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const [rows] = await pool.query(
      `SELECT * FROM printer_maintenance_logs WHERE printer_id = ? ORDER BY created_at DESC`,
      [id]
    );

    return NextResponse.json(rows);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    let body = {
      maintenanceType: "Manutenção Geral",
      cost: 0,
      description: "Zerar horas de manutenção via painel rápido",
      addToExpenses: false,
      consumables: [] as { id: number; quantity: number }[]
    };

    try {
      const parsedBody = await req.json();
      if (parsedBody && Object.keys(parsedBody).length > 0) {
        body = { ...body, ...parsedBody };
      }
    } catch (e) {
      // Ignora erro de JSON caso tenha vindo vazio (legado)
    }

    const { maintenanceType, cost, description, addToExpenses, consumables } = body;

    // 1. Obter informações da impressora
    const [printers] = await pool.query(`SELECT name, current_hours_printed FROM printers WHERE id = ?`, [id]) as any[];
    if (!printers || printers.length === 0) {
      throw new Error("Impressora não encontrada");
    }
    const printer = printers[0];

    // 2. Atualizar as horas da impressora
    await pool.query(
      `UPDATE printers SET last_maintenance_hours = current_hours_printed WHERE id = ?`,
      [id]
    );

    // 3. Registrar o log na nova tabela
    const [maintResult] = await pool.query(
      `INSERT INTO printer_maintenance_logs (printer_id, maintenance_type, description, cost) VALUES (?, ?, ?, ?)`,
      [id, maintenanceType, description || null, cost || 0]
    ) as any[];
    const maintenanceLogId = maintResult.insertId;

    // 4. Processar consumíveis se houver
    if (consumables && Array.isArray(consumables)) {
      for (const item of consumables) {
        const { id: consumableId, quantity } = item;
        if (!consumableId || !quantity) continue;

        // Buscar custo atual do consumível
        const [consRows] = await pool.query(`SELECT cost_per_unit FROM consumables WHERE id = ?`, [consumableId]) as any[];
        if (consRows.length === 0) continue;
        const unitCost = consRows[0].cost_per_unit;

        // Deduzir do estoque
        await pool.query(
          `UPDATE consumables SET stock_current = stock_current - ? WHERE id = ?`,
          [quantity, consumableId]
        );

        // Registrar na tabela de junção
        await pool.query(
          `INSERT INTO maintenance_consumables (maintenance_log_id, consumable_id, quantity, unit_cost) VALUES (?, ?, ?, ?)`,
          [maintenanceLogId, consumableId, quantity, unitCost]
        );
      }
    }

    // 5. Lançar despesa no financeiro se for requisitado
    if (addToExpenses && Number(cost) > 0) {
      const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
      const expenseDescription = `[Manutenção] ${printer.name} - ${maintenanceType}`;

      await pool.query(
        `INSERT INTO expenses (description, amount, category, due_date, status) VALUES (?, ?, ?, ?, ?)`,
        [expenseDescription, Number(cost), "Manutenção", today, "paid"]
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Maintenance POST Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
