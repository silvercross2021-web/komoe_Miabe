"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ShieldCheck, ExternalLink, Loader2, Gavel } from "lucide-react";
import { signalementsApi, type Transaction, type Signalement } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/Card";

interface Props {
  transaction: Transaction;
}

/**
 * Badge premium affiche sur les pages detail transaction lorsqu'une transaction
 * est une CORRECTION emise par le DGDDL suite a un verdict de fraude.
 * Montre clairement :
 *  - Qui est le DGDDL responsable (nom + wallet)
 *  - Le lien vers le dossier d'enquete originel
 *  - La justification publique de la correction
 */
export function DgddlTransactionBadge({ transaction }: Props) {
  const [parentSignalements, setParentSignalements] = useState<Signalement[]>([]);
  const [loading, setLoading] = useState(false);

  // Si la TX est une correction, on cherche le signalement source (via parent_frauduleux)
  useEffect(() => {
    if (!transaction.is_correction || !transaction.parent_frauduleux) return;
    setLoading(true);
    signalementsApi
      .list({ transaction: transaction.parent_frauduleux })
      .then((res) => setParentSignalements((res.results ?? []).filter((s) => s.statut === "VALIDE_FRAUDE")))
      .catch(() => setParentSignalements([]))
      .finally(() => setLoading(false));
  }, [transaction.id, transaction.is_correction, transaction.parent_frauduleux]);

  if (!transaction.is_correction) return null;

  const dgddlName = transaction.valide_par_detail?.full_name || transaction.soumis_par_detail?.full_name || "DGDDL";
  const dgddlWallet = transaction.valide_par_detail?.wallet_address || transaction.soumis_par_detail?.wallet_address || "";
  const signalementSource = parentSignalements[0];

  return (
    <Card className="relative overflow-hidden rounded-[28px] border-2 border-purple-500/40 bg-gradient-to-br from-purple-500/10 via-card to-card shadow-xl shadow-purple-500/10">
      {/* decoration arriere plan */}
      <div className="absolute -top-20 -right-20 w-56 h-56 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

      <CardContent className="relative p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center shadow-lg shadow-purple-500/30 shrink-0">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <p className="text-xs font-black uppercase tracking-widest text-purple-700 dark:text-purple-300">
                Transaction corrective officielle
              </p>
              <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                AUDIT DGDDL
              </span>
            </div>

            <p className="text-sm font-bold text-foreground leading-snug">
              Cette transaction a été <span className="text-purple-700 dark:text-purple-300">émise et validée par le DGDDL</span> suite à un verdict de fraude.
            </p>

            {/* Identite du DGDDL */}
            <div className="mt-4 p-3 bg-card/70 rounded-2xl border border-purple-500/20">
              <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">DGDDL responsable</p>
              <p className="text-sm font-black text-foreground">{dgddlName}</p>
              {dgddlWallet && (
                <p className="text-[10px] font-mono text-muted-foreground mt-0.5 truncate">
                  Wallet identifie : {dgddlWallet}
                </p>
              )}
            </div>

            {/* Justification publique */}
            {transaction.correction_justification && (
              <div className="mt-3 p-3 bg-purple-500/5 rounded-2xl border border-purple-500/20">
                <p className="text-[9px] font-black uppercase tracking-widest text-purple-700 dark:text-purple-300 mb-1 flex items-center gap-1.5">
                  <Gavel className="w-3 h-3" />
                  Justification de l'audit
                </p>
                <p className="text-xs text-foreground/90 leading-relaxed italic">
                  &quot;{transaction.correction_justification}&quot;
                </p>
              </div>
            )}

            {/* Lien vers le dossier signalement source */}
            {loading ? (
              <div className="mt-3 flex items-center gap-2 text-[10px] text-muted-foreground">
                <Loader2 className="w-3 h-3 animate-spin" />
                Chargement du dossier d'enquete...
              </div>
            ) : signalementSource ? (
              <Link
                href={`/public/engagements/signalement/${signalementSource.id}`}
                className="inline-flex items-center gap-1.5 mt-3 text-[10px] font-black text-purple-700 dark:text-purple-300 hover:underline"
              >
                <ExternalLink className="w-3 h-3" />
                Voir le dossier d'enquete : {signalementSource.sujet}
              </Link>
            ) : null}

            {/* Mention transparence signature systeme */}
            <p className="text-[9px] text-muted-foreground/70 italic mt-4 leading-relaxed">
              Signature blockchain emise par le systeme KOMOE pour le compte du DGDDL identifie ci-dessus.
              L'authentification souveraine est garantie par la base d'identite gouvernementale.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
