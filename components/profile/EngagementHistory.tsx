"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/Card";
import { signalementsApi, type Signalement } from "@/lib/api";
import { formatDateShort } from "@/lib/constants";
import {
  ThumbsUp, ThumbsDown, ShieldAlert, CheckCircle2, AlertCircle,
  TrendingUp, TrendingDown, Loader2, Activity, Gavel,
} from "lucide-react";

interface Props {
  userId: string;
}

const TERMINE_STATUTS = ["VALIDE_FRAUDE", "REJETE_FAUX", "CLOS"];

type ReputationEvent = {
  id: string;
  source: "signalement" | "vote";
  date: string;
  delta: number;
  label: string;
  description: string;
  signalementId: string;
  variant: "positive" | "negative" | "neutral";
};

export function EngagementHistory({ userId }: Props) {
  const [signalementsAuteur, setSignalementsAuteur] = useState<Signalement[]>([]);
  const [signalementsVotes, setSignalementsVotes] = useState<Signalement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      signalementsApi.list({ mes_signalements: true }).then((r) => r?.results || []).catch(() => []),
      signalementsApi.list({ mes_votes: true }).then((r) => r?.results || []).catch(() => []),
    ])
      .then(([auteurs, votes]) => {
        setSignalementsAuteur(auteurs);
        setSignalementsVotes(votes);
      })
      .finally(() => setLoading(false));
  }, [userId]);

  // Construire la timeline d'evenements de reputation
  const events = useMemo<ReputationEvent[]>(() => {
    const list: ReputationEvent[] = [];

    // Evenements liés a "j'ai cree ce signalement"
    for (const s of signalementsAuteur) {
      if (!TERMINE_STATUTS.includes(s.statut) || !s.resolution_a) continue;
      const isFraude = s.resolution === "FRAUDE";
      const isFaux = s.resolution === "FAUX";
      const delta = isFraude ? 50 : isFaux ? -10 : 0;
      list.push({
        id: `sig-${s.id}`,
        source: "signalement",
        date: s.resolution_a,
        delta,
        label: isFraude ? "Signalement valide" : isFaux ? "Signalement juge faux" : "Signalement classe",
        description: `Sujet : ${s.sujet}`,
        signalementId: s.id,
        variant: isFraude ? "positive" : isFaux ? "negative" : "neutral",
      });
    }

    // Evenements liés a mes votes
    for (const s of signalementsVotes) {
      if (!TERMINE_STATUTS.includes(s.statut) || !s.resolution_a || !s.mon_vote || !s.resolution) continue;
      // INFONDE : pas d'ajustement
      if (s.resolution === "INFONDE") {
        list.push({
          id: `vote-${s.id}`,
          source: "vote",
          date: s.resolution_a,
          delta: 0,
          label: "Vote sans ajustement",
          description: `Verdict INFONDE sur '${s.sujet}'`,
          signalementId: s.id,
          variant: "neutral",
        });
        continue;
      }
      const voteJuste =
        (s.resolution === "FRAUDE" && s.mon_vote === "CREDIBLE") ||
        (s.resolution === "FAUX" && s.mon_vote === "INFONDE");
      const delta = voteJuste ? 5 : -3;
      list.push({
        id: `vote-${s.id}`,
        source: "vote",
        date: s.resolution_a,
        delta,
        label: voteJuste ? "Vote juste" : "Vote errone",
        description: `Vous aviez vote '${s.mon_vote}', verdict DGDDL : ${s.resolution}`,
        signalementId: s.id,
        variant: voteJuste ? "positive" : "negative",
      });
    }

    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [signalementsAuteur, signalementsVotes]);

  const stats = useMemo(() => {
    const totalGain = events.filter((e) => e.delta > 0).reduce((s, e) => s + e.delta, 0);
    const totalPerte = events.filter((e) => e.delta < 0).reduce((s, e) => s + Math.abs(e.delta), 0);
    const votesJustes = events.filter((e) => e.source === "vote" && e.variant === "positive").length;
    const votesErrones = events.filter((e) => e.source === "vote" && e.variant === "negative").length;
    const accuracy = votesJustes + votesErrones > 0
      ? Math.round((votesJustes / (votesJustes + votesErrones)) * 100)
      : null;
    return {
      totalGain,
      totalPerte,
      net: totalGain - totalPerte,
      votesJustes,
      votesErrones,
      accuracy,
    };
  }, [events]);

  if (loading) {
    return (
      <Card className="rounded-[28px] border border-border bg-card">
        <CardContent className="p-8 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      {/* Resume reputation */}
      <Card className="rounded-[28px] border border-border bg-card overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <Activity className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight">Mon engagement citoyen</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">Historique de mes interactions et gains</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <ReputationStat icon={TrendingUp} label="Gain total" value={`+${stats.totalGain}`} color="text-emerald-600" bg="bg-emerald-500/10" />
            <ReputationStat icon={TrendingDown} label="Perte totale" value={`-${stats.totalPerte}`} color="text-rose-600" bg="bg-rose-500/10" />
            <ReputationStat icon={CheckCircle2} label="Votes justes" value={`${stats.votesJustes}/${stats.votesJustes + stats.votesErrones}`} color="text-blue-600" bg="bg-blue-500/10" />
            <ReputationStat icon={Gavel} label="Precision vote" value={stats.accuracy !== null ? `${stats.accuracy}%` : "—"} color="text-purple-600" bg="bg-purple-500/10" />
          </div>
        </CardContent>
      </Card>

      {/* Timeline d'evenements */}
      <Card className="rounded-[28px] border border-border bg-card overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/5 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight">Mes verdicts recents</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">Vos signalements et votes resolus par le DGDDL</p>
            </div>
          </div>

          {events.length === 0 ? (
            <div className="text-center py-10 px-4">
              <AlertCircle className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm font-bold text-foreground">Aucun verdict pour le moment</p>
              <p className="text-xs text-muted-foreground mt-1">
                Vos signalements et vos votes apparaitront ici une fois traites par le DGDDL.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {events.slice(0, 10).map((e) => (
                <Link key={e.id} href={`/public/engagements/signalement/${e.signalementId}`}>
                  <div className="group flex items-center gap-3 p-3 rounded-2xl border border-border/60 hover:border-primary/30 hover:bg-muted/30 transition-all cursor-pointer">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      e.variant === "positive" ? "bg-emerald-500/15 text-emerald-600" :
                      e.variant === "negative" ? "bg-rose-500/15 text-rose-600" :
                      "bg-zinc-500/15 text-zinc-600"
                    }`}>
                      {e.source === "signalement" ? <ShieldAlert className="w-4 h-4" /> :
                        e.variant === "positive" ? <ThumbsUp className="w-4 h-4" /> :
                        e.variant === "negative" ? <ThumbsDown className="w-4 h-4" /> :
                        <Gavel className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-xs font-black text-foreground">{e.label}</p>
                        <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                          e.source === "signalement" ? "bg-primary/10 text-primary" : "bg-blue-500/10 text-blue-600"
                        }`}>
                          {e.source === "signalement" ? "Mon signalement" : "Mon vote"}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{e.description}</p>
                      <p className="text-[9px] text-muted-foreground/70 mt-0.5">{formatDateShort(e.date)}</p>
                    </div>
                    <div className={`text-sm font-black tabular-nums shrink-0 ${
                      e.delta > 0 ? "text-emerald-600" : e.delta < 0 ? "text-rose-600" : "text-muted-foreground"
                    }`}>
                      {e.delta > 0 ? `+${e.delta}` : e.delta === 0 ? "—" : e.delta}
                      {e.delta !== 0 && <span className="text-[9px] font-bold ml-0.5">pts</span>}
                    </div>
                  </div>
                </Link>
              ))}
              {events.length > 10 && (
                <p className="text-center text-[10px] text-muted-foreground pt-2">+{events.length - 10} autres evenements</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ReputationStat({ icon: Icon, label, value, color, bg }: { icon: any; label: string; value: string; color: string; bg: string; }) {
  return (
    <div className={`p-3 rounded-2xl border border-border/50 ${bg}`}>
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className={`w-3 h-3 ${color}`} />
        <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{label}</span>
      </div>
      <p className={`text-lg font-black ${color}`}>{value}</p>
    </div>
  );
}
