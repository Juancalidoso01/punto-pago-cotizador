import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const url = process.env.COTIZACION_SHEET_WEBHOOK_URL;
  if (!url?.trim()) {
    return NextResponse.json(
      { error: "Falta configurar COTIZACION_SHEET_WEBHOOK_URL en el servidor." },
      { status: 503 },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const text = await res.text();
    if (!res.ok) {
      return NextResponse.json(
        { error: text || `Error ${res.status} al contactar el webhook` },
        { status: 502 },
      );
    }
    let parsed: unknown = text;
    try {
      parsed = text ? JSON.parse(text) : {};
    } catch {
      parsed = { raw: text };
    }
    return NextResponse.json({ ok: true, upstream: parsed });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error de red";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
