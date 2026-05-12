import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();
    if (!name || !email || !password || String(password).length < 6) {
      return NextResponse.json({ error: "Dados inválidos (senha mín. 6)" }, { status: 400 });
    }
    const normEmail = String(email).toLowerCase();

    // Cria via Admin API com email_confirm=true (sem confirmação por email)
    const admin = createSupabaseAdmin();
    const { data, error } = await admin.auth.admin.createUser({
      email: normEmail,
      password: String(password),
      email_confirm: true,
      user_metadata: { name: String(name) },
    });
    if (error || !data.user) {
      const msg = error?.message?.includes("already")
        ? "Email já cadastrado"
        : error?.message || "Erro no cadastro";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    // Espelha na tabela User do Prisma
    const count = await prisma.user.count();
    const adminEmail = (process.env.ADMIN_EMAIL || "").toLowerCase();
    const isAdmin = count === 0 || (adminEmail !== "" && normEmail === adminEmail);

    await prisma.user.upsert({
      where: { id: data.user.id },
      create: { id: data.user.id, email: normEmail, name: String(name), isAdmin },
      update: { email: normEmail, name: String(name) },
    });

    // Faz login imediato
    const supabase = await createSupabaseServer();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: normEmail,
      password: String(password),
    });
    if (signInError) {
      return NextResponse.json({ error: "Cadastro ok, mas falhou no login" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Erro no cadastro" }, { status: 500 });
  }
}
