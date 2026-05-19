"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Usuario = {
  id: string;
  name: string;
  email: string;
  statusInscricao: string;
  valorInscricao: number;
  observacaoAdmin: string | null;
  createdAt: string;
};

const STATUS_LABEL: Record<string, string> = {
  PENDENTE: "Pendente",
  CONFIRMADA: "Confirmada",
  RECUSADA: "Recusada",
};
const STATUS_CLS: Record<string, string> = {
  PENDENTE: "text-amber-300 border-amber-400/40 bg-amber-400/10",
  CONFIRMADA: "text-emerald-400 border-emerald-400/40 bg-emerald-400/10",
  RECUSADA: "text-red-400 border-red-400/40 bg-red-400/10",
};

export default function FinanceiroTable({ usuarios }: { usuarios: Usuario[] }) {
  const router = useRouter();
  const [local, setLocal] = useState(usuarios);
  const [obs, setObs] = useState<Record<string, string>>(
    Object.fromEntries(usuarios.map((u) => [u.id, u.observacaoAdmin ?? ""])),
  );
  const [saving, setSaving] = useState<string | null>(null);

  async function atualizar(userId: string, status: string) {
    setSaving(userId);
    const res = await fetch("/api/admin/financeiro", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, status, observacao: obs[userId] || null }),
    });
    setSaving(null);
    if (!res.ok) { alert("Erro ao atualizar status."); return; }
    setLocal((prev) => prev.map((u) => u.id === userId ? { ...u, statusInscricao: status } : u));
    router.refresh();
  }

  function exportCSV() {
    const header = ["Nome", "Email", "Status", "Valor", "Data", "Observação"];
    const rows = local.map((u) => [
      u.name, u.email,
      STATUS_LABEL[u.statusInscricao] ?? u.statusInscricao,
      `R$ ${u.valorInscricao.toFixed(2).replace(".", ",")}`,
      new Date(u.createdAt).toLocaleDateString("pt-BR"),
      u.observacaoAdmin ?? "",
    ]);
    const csv = [header, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "inscricoes.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={exportCSV} className="bg-zinc-800 hover:bg-zinc-700 border border-[color:var(--c-border)] text-xs uppercase tracking-wider font-semibold rounded-lg px-4 py-2">
          Exportar CSV
        </button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-zinc-500 text-xs uppercase tracking-wider border-b border-[color:var(--c-border)]">
            <tr>
              <th className="text-left px-4 py-3">Nome</th>
              <th className="text-left px-4 py-3 hidden md:table-cell">Email</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-right px-4 py-3 hidden sm:table-cell">Valor</th>
              <th className="text-left px-4 py-3 hidden lg:table-cell">Obs</th>
              <th className="text-right px-4 py-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {local.map((u) => (
              <tr key={u.id} className="border-t border-[color:var(--c-border)] hover:bg-white/2">
                <td className="px-4 py-3 font-semibold">{u.name}</td>
                <td className="px-4 py-3 text-zinc-400 hidden md:table-cell">{u.email}</td>
                <td className="px-4 py-3">
                  <span className={`chip border text-[0.65rem] ${STATUS_CLS[u.statusInscricao] ?? ""}`}>
                    {STATUS_LABEL[u.statusInscricao] ?? u.statusInscricao}
                  </span>
                </td>
                <td className="px-4 py-3 text-right hidden sm:table-cell text-zinc-300">
                  R$ {u.valorInscricao.toFixed(2).replace(".", ",")}
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  <input
                    value={obs[u.id] ?? ""}
                    onChange={(e) => setObs((o) => ({ ...o, [u.id]: e.target.value }))}
                    placeholder="Observação..."
                    className="text-input text-xs py-1 w-40"
                  />
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center gap-1 justify-end flex-wrap">
                    {saving === u.id ? (
                      <span className="text-xs text-zinc-500">Salvando...</span>
                    ) : (
                      <>
                        {u.statusInscricao !== "CONFIRMADA" && (
                          <button onClick={() => atualizar(u.id, "CONFIRMADA")} className="text-[0.65rem] uppercase tracking-wider font-semibold px-2 py-1 rounded bg-emerald-900/40 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-800/50">
                            Confirmar
                          </button>
                        )}
                        {u.statusInscricao !== "RECUSADA" && (
                          <button onClick={() => atualizar(u.id, "RECUSADA")} className="text-[0.65rem] uppercase tracking-wider font-semibold px-2 py-1 rounded bg-red-900/40 text-red-400 border border-red-500/30 hover:bg-red-800/50">
                            Recusar
                          </button>
                        )}
                        {u.statusInscricao !== "PENDENTE" && (
                          <button onClick={() => atualizar(u.id, "PENDENTE")} className="text-[0.65rem] uppercase tracking-wider font-semibold px-2 py-1 rounded bg-zinc-800 text-zinc-400 border border-zinc-600/40 hover:bg-zinc-700">
                            Pendente
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {local.length === 0 && (
          <div className="p-10 text-center text-zinc-500">Nenhum usuário cadastrado.</div>
        )}
      </div>
    </div>
  );
}
