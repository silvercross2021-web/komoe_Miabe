"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { signalementsApi, type Signalement } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/Card";
import {
  ShieldAlert, AlertTriangle, Flame, FileSearch, Gavel, CheckCircle2,
  Loader2, ExternalLink, AlertCircle,
} from "lucide-react";
import { formatDateShort } from "@/lib/constants";

interface Props {
  transactionId: string;
  /**
   * Si true, le panneau ne s'affiche que s'il y a au moins un signalement (sinon rien).
   * Si false, affiche un message neutre "aucun signalement" — utile cote DGDDL/MAIRE.
   */
  hideIfEmpty?: boolean;
}

const STATUT_META: Record<string, { label: string; icon: any; bg: string; text: string; border: string; }> = {
  NOUVEAU:       { label: "Nouveau",            icon: AlertTriangle, bg: "bg-blue-500/10",    text: "text-blue-600",    border: "border-blue-500/30" },
  VIRAL:         { label: "Viral",              icon: Flame,         bg: "bg-amber-500/10",   text: "text-amber-600",   border: "border-amber-500/30" },
  ENQUETE_DGDDL: { label: "Enquete en cours",   icon: FileSearch,    bg: "bg-orange-500/10",  text: "text-orange-600",  border: "border-orange-500/30" },
  VALIDE_FRAUDE: { label: "Fraude confirmee",   icon: ShieldAlert,   bg: "bg-red-500/10",     text: "text-red-600",     border: "border-red-500/30" },
  REJETE_FAUX:   { label: "Signalement faux",   icon: Gavel,         bg: "bg-zinc-500/10",    text: "text-zinc-600",    border: "border-zinc-500/30" },
  CLOS:          { label: "Classe",              icon: CheckCircle2,  bg: "bg-emerald-500/10", text: "text-emerald-600", border: "border-emerald-500/30" },
};

export function LinkedSignalementsPanel({ transactionId, hideIfEmpty = false }: Props) {
  const [signalements, setSignalements] = useState<Signalement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    signalementsApi
      .list({ transaction: transactionId })
      .then((res) => setSignalements(res.results ?? []))
      .catch(() => setSignalements([]))
      .finally(() => setLoading(false));
  }, [transactionId]);

  if (loading) {
    return (
      <Card className="rounded-[24px] border border-border bg-card">
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (signalements.length === 0) {
    if (hideIfEmpty) return null;
    return (
      <Card className="rounded-[24px] border border-dashed border-border bg-card/40">
        <CardContent className="p-5">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            <div>
              <p className="text-xs font-black text-foreground uppercase tracking-widest">Aucun signalement</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Cette transaction n'a fait l'objet d'aucun signalement citoyen.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Classer les signalements par criticite : fraude > enquete en cours > viral > autres
  const fraudeConfirmee = signalements.find((s) => s.statut === "VALIDE_FRAUDE");
  const enquete = signalements.find((s) => s.statut === "ENQUETE_DGDDL");

  return (
    <Card className={`rounded-[24px] border-2 overflow-hidden ${
      fraudeConfirmee ? "border-red-500/40 bg-red-500/5" :
      enquete ? "border-orange-500/40 bg-orange-500/5" :
      "border-amber-500/40 bg-amber-500/5"
    }`}>
      <CardContent className="p-5">
        <div className="flex items-center gap-2.5 mb-4">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
            fraudeConfirmee ? "bg-red-500/15 text-red-600" :
            enquete ? "bg-orange-500/15 text-orange-600" :
            "bg-amber-500/15 text-amber-600"
          }`}>
            {fraudeConfirmee ? <ShieldAlert className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-black tracking-tight text-foreground">
              {fraudeConfirmee ? "Fraude confirmee sur cette transaction" :
                enquete ? "Enquete DGDDL en cours sur cette transaction" :
                `${signalements.length} signalement${signalements.length > 1 ? "s" : ""} citoyen${signalements.length > 1 ? "s" : ""}`}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {fraudeConfirmee
                ? "Le DGDDL a valide une fraude. Une correction a ete emise et ancree sur la blockchain."
                : "Visible publiquement, audite par la DGDDL."}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {signalements.map((s) => {
            const meta = STATUT_META[s.statut] ?? STATUT_META.NOUVEAU;
            const Icon = meta.icon;
            return (
              <Link
                key={s.id}
                href={`/public/engagements/signalement/${s.id}`}
                className="group flex items-center gap-3 p-3 rounded-xl bg-card/80 border border-border/60 hover:border-primary/40 transition-colors"
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${meta.bg} ${meta.border} border`}>
                  <Icon className={`w-3.5 h-3.5 ${meta.text}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">
                      {s.sujet}
                    </p>
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${meta.bg} ${meta.text} ${meta.border}`}>
                      {meta.label}
                    </span>
                  </div>
                  {s.resolution_justification && (
                    <p className="text-[10px] text-muted-foreground mt-1 line-clamp-1">
                      <span className="font-black uppercase tracking-widest">Verdict :</span> {s.resolution_justification}
                    </p>
                  )}
                  <p className="text-[9px] text-muted-foreground/70 mt-0.5">{formatDateShort(s.created_at)}</p>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-primary shrink-0" />
              </Link>
            );
          })}
        </div>

        {fraudeConfirmee?.blockchain_tx_hash_resolution && (
          <div className="mt-4 pt-4 border-t border-red-500/20">
            <a
              href={`https://amoy.polygonscan.com/tx/${fraudeConfirmee.blockchain_tx_hash_resolution}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[10px] font-black text-red-600 hover:underline"
            >
              <AlertCircle className="w-3 h-3" />
              Verifier le verdict de fraude sur la blockchain
            </a>
            {fraudeConfirmee.resolution_par_detail?.full_name && (
              <p className="text-[9px] text-muted-foreground/70 italic mt-1 leading-snug">
                Signe par le systeme KOMOE pour le compte du DGDDL{" "}
                <span className="font-bold text-foreground/80">{fraudeConfirmee.resolution_par_detail.full_name}</span>
                {fraudeConfirmee.resolution_par_detail.wallet_address && (
                  <> (wallet identifie : <span className="font-mono">{fraudeConfirmee.resolution_par_detail.wallet_address.slice(0, 10)}…</span>)</>
                )}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
