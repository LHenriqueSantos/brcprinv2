import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const data = await req.formData();
    const scadFile = data.get("file") as File;

    if (!scadFile) {
      return NextResponse.json({ error: "Nenhum arquivo SCAD enviado." }, { status: 400 });
    }

    const content = await scadFile.text();
    const parameters: any[] = [];

    // Simple Regex to match common SCAD variable declarations
    // Matches patterns like `variable_name = "value";` or `thickness = 2.5;`
    // Captures: 1: variable_name, 2: value (with quotes), 3: inline comment (optional)
    const regex = /^([a-zA-Z0-9_]+)\s*=\s*(.*?);(.*?)$/gm;
    let match;

    while ((match = regex.exec(content)) !== null) {
      const name = match[1].trim();
      let rawVal = match[2].trim();
      let comment = match[3] ? match[3].replace(/\/\//, "").trim() : "";

      // Ignore special hidden variables starting with $
      if (name.startsWith('$') || name.startsWith('function') || name.startsWith('module')) {
        continue;
      }

      let type = "text";
      if (rawVal === "true" || rawVal === "false") {
        type = "boolean";
        rawVal = rawVal === "true";
      } else if (!isNaN(Number(rawVal))) {
        type = "number";
        rawVal = Number(rawVal);
      } else if (rawVal.startsWith('"') && rawVal.endsWith('"')) {
        rawVal = rawVal.replace(/(^"|"$)/g, ""); // Remove quotes
        type = "string";
      } else if (rawVal.startsWith('[') && rawVal.endsWith(']')) {
        // arrays are too complex for form gen, skip generic multi-dimensional or fallback to string
        type = "array";
      }

      // We only care about base types for Dynamic Forms
      if (["string", "number", "boolean"].includes(type)) {
        parameters.push({
          name,
          type,
          default: rawVal,
          description: comment || name.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())
        });
      }
    }

    return NextResponse.json({ schema: parameters });

  } catch (error: any) {
    console.error("SCAD Extraction Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
