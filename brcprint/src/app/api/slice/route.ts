import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const data = await req.formData();
    const files = data.getAll("files");
    const infill = data.get("infill");
    const quantities = data.get("quantities");

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "Nenhum arquivo enviado para fatiamento." }, { status: 400 });
    }

    const slicerData = new FormData();
    if (infill) slicerData.append("infill", infill);
    if (quantities) slicerData.append("quantities", quantities);

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
    return NextResponse.json(slicerResult);

  } catch (err: any) {
    console.error("[Next Proxy ERROR]", err);
    return NextResponse.json({ error: err.message || "Erro interno ao contatar fatiador" }, { status: 500 });
  }
}
