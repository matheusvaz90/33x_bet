import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { createSession } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }
    const user = await prisma.user.findUnique({ where: { email: String(email).toLowerCase() } });
    if (!user) {
      return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 });
    }
    const ok = await bcrypt.compare(String(password), user.password);
    if (!ok) {
      return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 });
    }
    await createSession({
      sub: user.id,
      email: user.email,
      name: user.name,
      isAdmin: user.isAdmin,
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Erro no login" }, { status: 500 });
  }
}
