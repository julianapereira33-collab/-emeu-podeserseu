"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import type { Tables } from "@/types/database";
import { marcarNotificacaoLida, marcarTodasNotificacoesLidas } from "./notificacoes-actions";

export function NotificacoesSino({
  notificacoesIniciais,
}: {
  notificacoesIniciais: Tables<"notificacoes">[];
}) {
  const [aberto, setAberto] = useState(false);
  const [pending, startTransition] = useTransition();
  const naoLidas = notificacoesIniciais.filter((n) => !n.lida).length;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        className="relative rounded p-1.5 text-white hover:text-gold"
        aria-label="Notificações"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-5 w-5"
        >
          <path d="M12 22c1.1 0 2-.9 2-2h-4a2 2 0 0 0 2 2Zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4a1.5 1.5 0 0 0-3 0v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2Z" />
        </svg>
        {naoLidas > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-medium text-white">
            {naoLidas > 9 ? "9+" : naoLidas}
          </span>
        )}
      </button>

      {aberto && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setAberto(false)} />
          <div className="absolute right-0 z-20 mt-2 w-80 max-w-[90vw] rounded border border-neutral-200 bg-white text-neutral-900 shadow-lg">
            <div className="flex items-center justify-between border-b border-neutral-100 px-3 py-2">
              <span className="text-sm font-medium">Notificações</span>
              {naoLidas > 0 && (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      await marcarTodasNotificacoesLidas();
                    })
                  }
                  className="text-xs text-neutral-500 hover:text-gold-dark disabled:opacity-50"
                >
                  Marcar todas como lidas
                </button>
              )}
            </div>

            <ul className="max-h-96 overflow-y-auto">
              {notificacoesIniciais.length === 0 && (
                <li className="px-3 py-4 text-center text-xs text-neutral-400">
                  Nenhuma notificação por aqui.
                </li>
              )}
              {notificacoesIniciais.map((n) => (
                <li key={n.id} className={`border-b border-neutral-50 ${n.lida ? "" : "bg-amber-50"}`}>
                  <Link
                    href={n.link ?? "/painel"}
                    onClick={() => {
                      setAberto(false);
                      if (!n.lida) {
                        startTransition(async () => {
                          await marcarNotificacaoLida(n.id);
                        });
                      }
                    }}
                    className="block px-3 py-2 hover:bg-neutral-50"
                  >
                    <p className="text-xs font-medium">{n.titulo}</p>
                    <p className="text-xs text-neutral-600">{n.mensagem}</p>
                    <p className="mt-1 text-[10px] text-neutral-400">
                      {new Date(n.criado_em).toLocaleString("pt-BR")}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
