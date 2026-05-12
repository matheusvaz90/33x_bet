import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }
    const supabase = await createSupabaseServer();
    const { error } = await supabase.auth.signInWithPassword({
      email: String(email).toLowerCase(),
      password: String(password),
    });
    if (error) {
      return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Erro no login" }, { status: 500 });
  }
}
