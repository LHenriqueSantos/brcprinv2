import { NextResponse } from "next/server";
import pool from "@/lib/db";

// Esta URL pode ser engatada num Vercel Cron, GitHub Actions, ou serviço como cron-job.org
// Ela buscará leilões onde os Bots estão permitidos e caso precisem (menos de 8s restando),
// disparará um lance fantasma.

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      // 1. Garantir que existam bots no sistema
      const [bots]: any = await conn.query(
        `SELECT id FROM clients WHERE email LIKE '%@bot.brcprint.com'`
      );

      let botList = bots;
      if (bots.length === 0) {
        await conn.query(`
          INSERT INTO clients (name, email, password_hash) VALUES
          ('Lucas M.', 'lucas@bot.brcprint.com', '123'),
          ('Mariana S.', 'mariana@bot.brcprint.com', '123'),
          ('Carlos V.', 'carlos@bot.brcprint.com', '123'),
          ('Fernanda', 'fernanda@bot.brcprint.com', '123')
        `);
        const [newBots]: any = await conn.query(
          `SELECT id FROM clients WHERE email LIKE '%@bot.brcprint.com'`
        );
        botList = newBots;
      }

      // 2. Recuperar leilões que estão abertos e precisam de interferência do bot
      // - Ativos
      // - bot_enabled = 1
      // - current_price < bot_max_price (ou não atingiu preço mínimo de venda)
      // - Faltam MENOS de 12 segundos para acabar pra gerar adrenalina.
      const [auctions]: any = await conn.query(
        `SELECT * FROM auction_items
         WHERE status = 'active'
           AND bot_enabled = 1
           AND current_price < bot_max_price
           AND end_time > NOW()
           AND TIMESTAMPDIFF(SECOND, NOW(), end_time) <= 12
         FOR UPDATE`
      );

      let totalFakedBids = 0;

      for (const auction of auctions) {
        // Puxar um bot aleatório q não seja o atual arrematante
        const randomBot = botList[Math.floor(Math.random() * botList.length)];

        // Evitar que o bot lute contra o próprio bot ou que lute de novo consigo
        if (String(auction.winner_id) === String(randomBot.id)) {
          continue;
        }

        const newPrice = Number(auction.current_price) + 0.01;

        // Tempo reseta usando a regra: se bot deu lance com 5s faltando, ele sobe pro incremento total (ex +15s).
        const timeIncrement = Number(auction.time_increment) || 15;
        const updateTimeSql = `end_time = DATE_ADD(NOW(), INTERVAL ${timeIncrement} SECOND)`;

        await conn.query(
          `UPDATE auction_items SET current_price = ?, winner_id = ?, ${updateTimeSql} WHERE id = ?`,
          [newPrice, randomBot.id, auction.id]
        );

        await conn.query(
          `INSERT INTO bids (auction_id, client_id, price_after_bid) VALUES (?, ?, ?)`,
          [auction.id, randomBot.id, newPrice]
        );

        totalFakedBids++;
      }

      // 3. Regra de Limpeza de Leilões Expirados
      // Os leilões que o tempo expirou (< NOW()) vão para finished ou cancelled
      // baseado no min_sale_price (preço de reserva).
      await conn.query(
        `UPDATE auction_items
         SET status = CASE
            WHEN current_price >= min_sale_price THEN 'finished'
            ELSE 'cancelled'
         END
         WHERE status = 'active' AND end_time <= NOW()`
      );

      await conn.commit();
      return NextResponse.json({ success: true, fake_bids_dispatched: totalFakedBids });

    } catch (e: any) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  } catch (err: any) {
    console.error("CronBot error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
