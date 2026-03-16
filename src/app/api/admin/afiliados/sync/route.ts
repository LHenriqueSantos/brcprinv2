import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { checkAdmin, forbiddenResponse } from "@/lib/adminCheck";

// Rota restrita para Administradores: Sincroniza clientes antigos que não são afiliados
export async function POST() {
  if (!await checkAdmin()) return forbiddenResponse();

  try {
    // Busca todos os clientes que ainda não possuem cadastro na tabela affiliates (baseado no email)
    const [clientsRows] = await pool.query(
      `SELECT c.id, c.name, c.email
       FROM clients c
       LEFT JOIN affiliates a ON c.email = a.email
       WHERE a.id IS NULL`
    );

    const clientsToSync = clientsRows as any[];

    if (clientsToSync.length === 0) {
      return NextResponse.json({ success: true, message: "Todos os clientes já estão sincronizados como afiliados." });
    }

    let syncedCount = 0;

    for (const client of clientsToSync) {
      // Gera um referral code base único
      const baseCode = (client.name.split(' ')[0] || "usr").toUpperCase().replace(/[^A-Z]/g, '');
      const uniqueCode = `${baseCode}${client.id}${Math.floor(Math.random() * 900) + 100}`;

      await pool.query(
        "INSERT INTO affiliates (name, email, referral_code, commission_rate_pct, active) VALUES (?, ?, ?, ?, ?)",
        [client.name, client.email, uniqueCode, 5.00, true] // Assumindo uma taxa padrão de 5% inicial, o admin pode mudar
      );

      syncedCount++;
    }

    return NextResponse.json({
      success: true,
      message: `${syncedCount} cliente(s) antigo(s) convertido(s) em afiliados com sucesso!`
    });
  } catch (err: any) {
    console.error("Erro na sincronização de afiliados:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
