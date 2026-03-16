import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { NextResponse } from "next/server";

export async function checkAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "admin") {
    return false;
  }
  return true;
}

export async function checkAnyAuth() {
  const session = await getServerSession(authOptions);
  return !!session;
}

export async function checkOperatorOrAdmin() {
  const session = await getServerSession(authOptions);
  if (!session) return false;
  const role = (session.user as any)?.role;
  return role === "admin" || role === "operador";
}

export async function checkSellerOrAdmin() {
  const session = await getServerSession(authOptions);
  if (!session) return false;
  const role = (session.user as any)?.role;
  return role === "admin" || role === "vendedor";
}

export function forbiddenResponse() {
  return NextResponse.json({ error: "Acesso negado. Nível de permissão insuficiente." }, { status: 403 });
}
