import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(request: Request, props: { params: Promise<{ code: string }> }) {
  const params = await props.params;
  const code = params.code;

  if (!code) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  try {
    // Check if affiliate exists and is active
    const [rows] = await pool.query(
      "SELECT id FROM affiliates WHERE referral_code = ? AND active = 1",
      [code]
    );

    const affiliates = rows as any[];

    if (affiliates.length > 0) {
      // Valid affiliate, set cookie and redirect
      const response = NextResponse.redirect(new URL("/", request.url));

      // 30 days = 30 * 24 * 60 * 60 = 2592000 seconds
      response.cookies.set({
        name: "aff_ref",
        value: affiliates[0].id.toString(),
        maxAge: 2592000,
        path: "/",
        httpOnly: true, // Prevent XSS reading the cookie
        sameSite: "lax"
      });

      return response;
    }

    // Invalid code, just redirect silently
    return NextResponse.redirect(new URL("/", request.url));
  } catch (error) {
    console.error("Affiliate Ref Error:", error);
    return NextResponse.redirect(new URL("/", request.url));
  }
}
