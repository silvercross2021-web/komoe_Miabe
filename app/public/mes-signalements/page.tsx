"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { signalementsApi, type Signalement } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { formatDateShort } from "@/lib/constants";
import {
  AlertCircle, AlertTriangle, Flame, FileSearch, Gavel, CheckCircle2,
  ShieldAlert, Plus, Loader2, ExternalLink, MapPin, TrendingUp, ThumbsUp,
} from "lucide-react";

const STATUT_META: Record<string, { label: string; icon: any; color: string; bg: string; border: string; description: string; }> = {
  NOUVEAU:       { label: "Nouveau",            icon: AlertCircle,  color: "text-blue-600",    bg: "bg-blue-500/10",    border: "border-blue-500/30",    description: "Vote citoyen en cours" },
  VIRAL:         { label: "Viral",              icon: Flame,        color: "text-amber-600",   bg: "bg-amber-500/10",   border: "border-amber-500/30",   description: "Tres suivi, intervention DGDDL recommandee" },
  ENQUETE_DGDDL: { label: "Enquete en cours",   icon: FileSearch,   color: "text-orange-600",  bg: "bg-orange-500/10",  border: "border-orange-500/30",  description: "Le DGDDL audite votre signalement" },
  VALIDE_FRAUDE: { label: "Fraude confirmee",   icon: ShieldAlert,  color: "text-red-600",     bg: "bg-red-500/10",     border: "border-red-500/30",     description: "Verdict : Fraude reconnue (+50 pts)" },
  REJETE_FAUX:   { label: "Juge faux",          icon: Gavel,        color: "text-zinc-600",    bg: "bg-zinc-500/10",    border: "border-zinc-500/30",    description: "Verdict : Signalement abusif (-10 pts)" },
  CLOS:          { label: "Classe sans suite",  icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-500/10", border: "border-emerald-500/30", description: "Verdict : Infonde, aucune sanction" },
};

const ACTIF_STATUTS = ["NOUVEAU", "VIRAL", "ENQUETE_DGDDL"];
const TERMINE_STATUTS = ["VALIDE_FRAUDE", "REJETE_FAUX", "CLOS"];

export default function MesSignalementsPage() {
  const { user, isAuthenticated } = useAuth();
  const [items, setItems] = useState<Signalement[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"actifs" | "termines" | "tous">("actifs");

  useEffect(() => {
    if (!isAuthenticated) return;
    setLoading(true);
    signalementsApi
      .list({ mes_signalements: true })
      .then((res) => setItems(res?.results || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  const stats = useMemo(() => {
    const actifs = items.filter((s) => ACTIF_STATUTS.includes(s.statut)).length;
    const fraudes = items.filter((s) => s.statut === "VALIDE_FRAUDE").length;
    const faux = items.filter((s) => s.statut === "REJETE_FAUX").length;
    return { total: items.length, actifs, fraudes, faux };
  }, [items]);

  const filtered = useMemo(() => {
    if (tab === "actifs") return items.filter((s) => ACTIF_STATUTS.includes(s.statut));
    if (tab === "termines") return items.filter((s) => TERMINE_STATUTS.includes(s.statut));
    return items;
  }, [items, tab]);

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto py-24 text-center">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
        <h2 className="text-xl font-black mb-2">Connexion requise</h2>
        <p className="text-sm text-muted-foreground mb-6">Connectez-vous pour voir vos signalements.</p>
        <Link href="/login">
          <Button className="rounded-2xl px-6">Se connecter</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 max-w-5xl mx-auto pb-12 space-y-6">
      {/* HERO */}
      <div className="relative overflow-hidden rounded-[32px] border border-border bg-gradient-to-br from-primary/10 via-card to-card backdrop-blur-xl p-8">
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative">
          <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-2">Mes signalements</p>
          <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight mb-2">
            Bonjour {user?.full_name?.split(" ")[0] || "citoyen"}
          </h1>
          <p className="text-sm text-muted-foreground mb-6 max-w-2xl">
            Suivez en temps reel l'avancement de tous vos signalements, les verdicts du DGDDL et leur impact sur votre score citoyen.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="Total" value={stats.total} icon={AlertCircle} color="text-foreground" />
            <StatCard label="En cours" value={stats.actifs} icon={FileSearch} color="text-orange-600" />
            <StatCard label="Fraudes validees" value={stats.fraudes} icon={ShieldAlert} color="text-red-600" />
            <StatCard label="Score citoyen" value={user?.reputation_score ?? 0} icon={TrendingUp} color="text-emerald-600" suffix=" pts" />
          </div>

          <div className="mt-6 flex items-center gap-3">
            <Link href="/public/signalements">
              <Button className="rounded-2xl bg-primary hover:bg-primary/90 h-11 px-5 font-black uppercase text-[10px] tracking-widest">
                <Plus className="w-4 h-4 mr-2" />
                Nouveau signalement
              </Button>
            </Link>
            <Link href="/public/signalements">
              <Button variant="ghost" className="rounded-2xl h-11 px-5 font-black uppercase text-[10px] tracking-widest text-muted-foreground">
                Voir tous les signalements publics
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-2 px-1">
        <TabButton active={tab === "actifs"} count={stats.actifs} onClick={() => setTab("actifs")}>En cours</TabButton>
        <TabButton active={tab === "termines"} count={items.filter((s) => TERMINE_STATUTS.includes(s.statut)).length} onClick={() => setTab("termines")}>Cloturees</TabButton>
        <TabButton active={tab === "tous"} count={stats.total} onClick={() => setTab("tous")}>Tous</TabButton>
      </div>

      {/* LISTE */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border border-dashed border-border rounded-[28px] bg-transparent">
          <CardContent className="p-12 text-center">
            <AlertCircle className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm font-bold text-foreground mb-1">
              {tab === "actifs" ? "Aucun signalement en cours" : tab === "termines" ? "Aucun signalement cloture" : "Aucun signalement"}
            </p>
            <p className="text-xs text-muted-foreground">
              {tab === "actifs"
                ? "Tous vos signalements ont ete traites ou vous n'en avez pas encore cree."
                : "Vos signalements termines apparaitront ici."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((s) => {
            const meta = STATUT_META[s.statut] ?? STATUT_META.NOUVEAU;
            const Icon = meta.icon;
            return (
              <Link key={s.id} href={`/public/engagements/signalement/${s.id}`} className="block group">
                <Card className="border border-border/70 hover:border-primary/40 rounded-[24px] overflow-hidden bg-card hover:shadow-lg transition-all">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${meta.bg} ${meta.border}`}>
                        <Icon className={`w-5 h-5 ${meta.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 mb-1">
                          <p className="font-black text-foreground group-hover:text-primary transition-colors text-sm">
                            {s.sujet}
                          </p>
                          <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${meta.bg} ${meta.color} ${meta.border} shrink-0`}>
                            {meta.label}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1 mb-2">{s.description}</p>
                        <p className={`text-[11px] font-bold ${meta.color} mb-3`}>{meta.description}</p>

                        <div className="flex items-center gap-3 flex-wrap text-[10px] font-bold text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-primary" />
                            {s.commune_detail?.nom || "Commune"}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <ThumbsUp className="w-3 h-3" />
                            {s.nb_votes ?? 0} vote{(s.nb_votes ?? 0) > 1 ? "s" : ""} ({s.pct_credible ?? 0}% credible)
                          </span>
                          {s.nb_preuves > 0 && (
                            <span className="inline-flex items-center gap-1 text-primary">
                              {s.nb_preuves} preuve{s.nb_preuves > 1 ? "s" : ""}
                            </span>
                          )}
                          <span className="ml-auto opacity-70">{formatDateShort(s.created_at)}</span>
                        </div>

                        {s.resolution && s.resolution_justification && (
                          <div className={`mt-3 p-3 rounded-xl border text-[11px] leading-snug ${meta.bg} ${meta.border}`}>
                            <span className="font-black uppercase tracking-wider">Justification DGDDL :</span>{" "}
                            <span className="text-foreground/90">{s.resolution_justification}</span>
                          </div>
                        )}
                      </div>
                      <ExternalLink className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0 mt-1" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, suffix }: { label: string; value: number; icon: any; color: string; suffix?: string; }) {
  return (
    <div className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-2xl p-3">
      <div className="flex items-center gap-2 mb-0.5">
        <Icon className={`w-3.5 h-3.5 ${color}`} />
        <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{label}</span>
      </div>
      <p className={`text-xl font-black ${color}`}>{value}{suffix}</p>
    </div>
  );
}

function TabButton({ active, children, count, onClick }: { active: boolean; children: React.ReactNode; count?: number; onClick: () => void; }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${
        active
          ? "bg-primary text-white shadow-lg shadow-primary/20"
          : "bg-card border border-border text-muted-foreground hover:bg-muted/50"
      }`}
    >
      {children}
      {count !== undefined && (
        <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${active ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"}`}>
          {count}
        </span>
      )}
    </button>
  );
}
