import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { createSession } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();
    if (!name || !email || !password || String(password).length < 6) {
      return NextResponse.json({ error: "Dados inválidos (senha mín. 6)" }, { status: 400 });
    }
    const normEmail = String(email).toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email: normEmail } });
    if (existing) {
      return NextResponse.json({ error: "Email já cadastrado" }, { status: 409 });
    }

    const count = await prisma.user.count();
    const adminEmail = (process.env.ADMIN_EMAIL || "").toLowerCase();
    const isAdmin = count === 0 || (adminEmail !== "" && normEmail === adminEmail);

    const user = await prisma.user.create({
      data: {
        email: normEmail,
        name: String(name),
        password: await bcrypt.hash(String(password), 10),
        isAdmin,
      },
    });

    await createSession({
      sub: user.id,
      email: user.email,
      name: user.name,
      isAdmin: user.isAdmin,
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Erro no cadastro" }, { status: 500 });
  }
}
