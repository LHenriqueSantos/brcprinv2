import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();
    const {
      items,
      address,
      deliveryMethod,
      shippingService,
      shippingCost,
      couponCode,
      notes,
      subtotal,
      total,
      discountValue
    } = body;

    if (!items || !items.length) {
      return NextResponse.json({ error: "Carrinho vazio" }, { status: 400 });
    }

    // 1. Basic validation of address if shipping
    if (deliveryMethod === 'shipping') {
      if (!address.zipcode || !address.street || !address.number || !address.city || !address.state) {
        return NextResponse.json({ error: "Endereço incompleto" }, { status: 400 });
      }
    }

    const publicToken = uuidv4();
    const clientId = (session?.user as any)?.id || null;

    // 2. Transaction to create order and items
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Find coupon ID if provided
      let couponId = null;
      if (couponCode) {
        const [coupons]: any = await connection.query("SELECT id FROM coupons WHERE code = ? AND active = 1", [couponCode]);
        if (coupons.length > 0) couponId = coupons[0].id;
      }

      // Insert Order
      const [orderResult]: any = await connection.query(`
        INSERT INTO cart_orders (
          public_token, client_id, status, subtotal, shipping_cost, discount_value, total,
          coupon_id, delivery_method,
          client_name, client_document, client_email, client_phone,
          client_zipcode, client_address, client_number, client_complement,
          client_neighborhood, client_city, client_state,
          shipping_service, notes
        ) VALUES (?, ?, 'pending_payment', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        publicToken, clientId, subtotal, shippingCost || 0, discountValue || 0, total,
        couponId, deliveryMethod,
        address.name, address.document, address.email, address.phone,
        address.zipcode, address.street, address.number, address.complement,
        address.neighborhood, address.city, address.state,
        shippingService?.name || null, notes
      ]);

      const orderId = orderResult.insertId;

      // Insert Items
      for (const item of items) {
        await connection.query(`
          INSERT INTO cart_order_items (
            order_id, type, catalog_item_id, title, price, quantity, color, stl_file_url, extras
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          orderId, item.type, item.catalog_item_id || null, item.title, item.price,
          item.quantity, item.color || null, item.stl_file_url || null,
          item.extras ? JSON.stringify(item.extras) : null
        ]);
      }

      await connection.commit();
      return NextResponse.json({ success: true, orderId, publicToken });

    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }

  } catch (error: any) {
    console.error("Error creating cart order:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
