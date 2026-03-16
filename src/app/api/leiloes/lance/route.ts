import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Você precisa estar logado para dar um lance." }, { status: 401 });
    }

    const { auctionId } = await req.json();
    if (!auctionId) {
      return NextResponse.json({ error: "ID do leilão não informado." }, { status: 400 });
    }

    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      // 1. Validar status do leilão e tempo restante
      const [auctions]: any = await conn.query(
        `SELECT * FROM auction_items WHERE id = ? AND status = 'active' FOR UPDATE`,
        [auctionId]
      );
      if (auctions.length === 0) {
        throw new Error("Este leilão não está mais ativo ou não existe.");
      }

      const auction = auctions[0];
      const now = new Date();
      if (new Date(auction.end_time) <= now) {
        throw new Error("O tempo deste leilão já encerrou.");
      }

      // Evita dois lances seguidos da mesma pessoa
      const userIdStr = String((session.user as any).id);
      const winnerIdStr = String(auction.winner_id);

      if (winnerIdStr === userIdStr) {
        throw new Error("Você já é o arrematante atual deste lote!");
      }

      // 2. Descontar o lance da carteira do cliente
      const [balances]: any = await conn.query(
        `SELECT balance FROM client_bids_balance WHERE client_id = ? FOR UPDATE`,
        [session.user.id]
      );

      let balance = balances.length > 0 ? balances[0].balance : 0;
      if (balance <= 0) {
        throw new Error("Saldo de lances insuficiente.");
      }

      await conn.query(
        `UPDATE client_bids_balance SET balance = balance - 1 WHERE client_id = ?`,
        [session.user.id]
      );

      // 3. Acrescentar 1 centavo e atualizar o cronômetro
      const newPrice = Number(auction.current_price) + 0.01;

      // Se faltar menos tempo que o `time_increment`, reseta o cronômetro pro incremento.
      // Ex: Faltavam 3s, o time_increment é 15s. Volta pra +15s (a partir de agora).
      let updateTimeSql = "end_time = end_time";
      const secondsLeft = (new Date(auction.end_time).getTime() - now.getTime()) / 1000;

      if (secondsLeft < auction.time_increment) {
        updateTimeSql = `end_time = DATE_ADD(NOW(), INTERVAL ${auction.time_increment} SECOND)`;
      }

      await conn.query(
        `UPDATE auction_items SET current_price = ?, winner_id = ?, ${updateTimeSql} WHERE id = ?`,
        [newPrice, session.user.id, auctionId]
      );

      // 4. Salvar histórico de Lances
      await conn.query(
        `INSERT INTO bids (auction_id, client_id, price_after_bid) VALUES (?, ?, ?)`,
        [auctionId, session.user.id, newPrice]
      );

      await conn.commit();

      return NextResponse.json({ success: true, newPrice, balance: balance - 1 });
    } catch (err: any) {
      await conn.rollback();
      return NextResponse.json({ error: err.message || "Erro transacional." }, { status: 400 });
    } finally {
      conn.release();
    }
  } catch (error: any) {
    console.error("Bid error:", error);
    return NextResponse.json({ error: "Falha de execução do lance." }, { status: 500 });
  }
}
