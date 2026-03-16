import { NextResponse } from "next/server";
import { calculateShipping } from "@/lib/shipping";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { fromZip, toZip, weight_g, dimensions, provider, token } = body;

    const options = await calculateShipping({
      fromZip,
      toZip,
      weight_g,
      dimensions,
      provider,
      token
    });

    return NextResponse.json(options);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
