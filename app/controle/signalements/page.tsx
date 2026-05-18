"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { AlertCircle, Search, Download, Loader2, Filter, CheckCircle2, Clock, MapPin, ExternalLink, ShieldAlert, Gavel, Flame, FileSearch } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { signalementsApi, Signalement } from "@/lib/api";
import { formatDateShort } from "@/lib/constants";
import { useDataChange } from "@/lib/hooks/useDataChange";

const STATUT_META: Record<string, { label: string; icon: any; bg: string; text: string; border: string; }> = {
  NOUVEAU:       { label: "Nouveau",           icon: AlertCircle, bg: "bg-blue-500/10",    text: "text-blue-600",    border: "border-blue-500/20" },
  VIRAL:         { label: "Viral",              icon: Flame,       bg: "bg-amber-500/10",   text: "text-amber-600",   border: "border-amber-500/20" },
  ENQUETE_DGDDL: { label: "Enquete en cours",   icon: FileSearch,  bg: "bg-orange-500/10",  text: "text-orange-600",  border: "border-orange-500/20" },
  VALIDE_FRAUDE: { label: "Fraude confirmee",   icon: ShieldAlert, bg: "bg-red-500/10",     text: "text-red-600",     border: "border-red-500/20" },
  REJETE_FAUX:   { label: "Faux signalement",   icon: Gavel,       bg: "bg-zinc-500/10",    text: "text-zinc-600",    border: "border-zinc-500/20" },
  CLOS:          { label: "Clos",               icon: CheckCircle2, bg: "bg-emerald-500/10", text: "text-emerald-600", border: "border-emerald-500/20" },
};

export default function SignalementsPage() {
  const [signalements, setSignalements] = useState<Signalement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [reviewedFilter, setReviewedFilter] = useState<boolean | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    fetchSignalements();
  }, []);

  // Auto-refresh quand un signalement est modifié ailleurs (verdict rendu, enquête lancée…)
  // ou quand l'utilisateur revient sur l'onglet (focus de la fenêtre).
  useDataChange("signalement", () => fetchSignalements());

  const fetchSignalements = async () => {
    setLoading(true);
    try {
      const response = await signalementsApi.list();
      const result = response?.results || [];
      setSignalements(result);
    } catch (err) {
      console.error("Erreur fetch signalements:", err);
      setSignalements([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = signalements.filter((s) => {
    const matchSearch =
      s.sujet?.toLowerCase().includes(search.toLowerCase()) ||
      s.description?.toLowerCase().includes(search.toLowerCase()) ||
      s.commune_detail?.nom?.toLowerCase().includes(search.toLowerCase());
    const matchReviewed = reviewedFilter !== null ? s.is_reviewed === reviewedFilter : true;
    return matchSearch && matchReviewed;
  });

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const headers = ["Commune", "Sujet", "Description", "Preuves", "Révisé", "Date"];
      const rows = filtered.map((s) => [
        s.commune_detail?.nom || s.commune,
        s.sujet,
        s.description.slice(0, 50),
        s.nb_preuves,
        s.is_reviewed ? "Oui" : "Non",
        formatDateShort(s.created_at),
      ]);

      const csvContent = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
      const blob = new Blob([`﻿${csvContent}`], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Komoe_Signalements_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert("Erreur export: " + (err as any).message);
    } finally {
      setIsExporting(false);
    }
  };

  const stats = {
    total: signalements.length,
    aTraiter: signalements.filter(s => s.statut === "NOUVEAU" || s.statut === "VIRAL").length,
    enCours: signalements.filter(s => s.statut === "ENQUETE_DGDDL").length,
    fraudes: signalements.filter(s => s.statut === "VALIDE_FRAUDE").length,
    faux: signalements.filter(s => s.statut === "REJETE_FAUX").length,
    clos: signalements.filter(s => s.statut === "CLOS").length,
    viraux: signalements.filter(s => s.statut === "VIRAL").length,
    avecPreuves: signalements.filter(s => s.nb_preuves > 0).length,
  };
  const totalTraites = stats.fraudes + stats.faux + stats.clos;
  const tauxFraude = totalTraites > 0 ? Math.round((stats.fraudes / totalTraites) * 100) : 0;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-card border border-border p-8 rounded-[32px] shadow-2xl shadow-primary/5">
        <div>
          <h2 className="text-3xl font-black text-foreground tracking-tight uppercase italic">Signalements Citoyens</h2>
          <p className="text-muted-foreground mt-1 font-medium italic">Audit des rapports de malversations et anomalies signalées</p>
        </div>
        <Button
          onClick={handleExport}
          disabled={isExporting || filtered.length === 0}
          className="bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20 rounded-2xl h-14 px-8 font-black text-base transition-all hover:scale-105"
        >
          {isExporting ? <Loader2 className="w-5 h-5 animate-spin mr-3" /> : <Download className="w-5 h-5 mr-3" />}
          Exporter CSV
        </Button>
      </div>

      {/* KPI principaux DGDDL */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "A traiter", value: stats.aTraiter, color: "text-orange-600", bg: "bg-orange-500/10", border: "border-orange-500/30", icon: AlertCircle, sub: `dont ${stats.viraux} viraux` },
          { label: "Enquetes en cours", value: stats.enCours, color: "text-amber-600", bg: "bg-amber-500/10", border: "border-amber-500/30", icon: FileSearch, sub: "audits actifs" },
          { label: "Fraudes confirmees", value: stats.fraudes, color: "text-red-600", bg: "bg-red-500/10", border: "border-red-500/30", icon: ShieldAlert, sub: `${tauxFraude}% de taux de fraude` },
          { label: "Total traites", value: totalTraites, color: "text-emerald-600", bg: "bg-emerald-500/10", border: "border-emerald-500/30", icon: CheckCircle2, sub: `${stats.faux} faux, ${stats.clos} classes` },
        ].map(({ label, value, color, bg, border, icon: Icon, sub }) => (
          <Card key={label} className={`rounded-[24px] border-2 ${border} overflow-hidden ${bg}`}>
            <CardContent className="p-5 relative">
              <Icon className={`w-20 h-20 ${color} absolute -right-2 -bottom-2 opacity-[0.08]`} />
              <div className="relative">
                <p className={`text-3xl font-black ${color}`}>{loading ? "…" : value}</p>
                <p className={`text-[10px] font-black uppercase tracking-widest mt-1 ${color}`}>{label}</p>
                <p className="text-[9px] font-bold text-muted-foreground mt-1.5">{sub}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Repartition verdicts (barre visuelle) */}
      {totalTraites > 0 && (
        <Card className="rounded-[24px] border border-border/50 shadow-sm overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-black uppercase tracking-widest text-foreground">Repartition des verdicts</p>
              <p className="text-[10px] font-bold text-muted-foreground">{totalTraites} dossiers traites</p>
            </div>
            <div className="flex h-3 rounded-full overflow-hidden bg-muted/30">
              <div className="bg-red-500" style={{ width: `${(stats.fraudes / totalTraites) * 100}%` }} title={`${stats.fraudes} fraudes`} />
              <div className="bg-amber-500" style={{ width: `${(stats.faux / totalTraites) * 100}%` }} title={`${stats.faux} faux`} />
              <div className="bg-emerald-500" style={{ width: `${(stats.clos / totalTraites) * 100}%` }} title={`${stats.clos} classes`} />
            </div>
            <div className="flex items-center gap-4 mt-3 text-[10px] font-bold">
              <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500" />Fraude {stats.fraudes}</span>
              <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" />Faux {stats.faux}</span>
              <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" />Classe {stats.clos}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="rounded-[32px] overflow-hidden border shadow-xl">
        <CardHeader className="bg-muted/30 border-b border-border p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-3 text-foreground font-black uppercase tracking-widest text-sm">
            <Filter className="w-5 h-5" />
            Tous les signalements
          </CardTitle>
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => setReviewedFilter(reviewedFilter === false ? null : false)}
                className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase transition-all ${reviewedFilter === false ? 'bg-amber-500 text-white' : 'bg-card border border-border text-muted-foreground hover:bg-muted'}`}
              >
                En attente
              </button>
              <button
                onClick={() => setReviewedFilter(reviewedFilter === true ? null : true)}
                className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase transition-all ${reviewedFilter === true ? 'bg-emerald-500 text-white' : 'bg-card border border-border text-muted-foreground hover:bg-muted'}`}
              >
                Révisés
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {loading && (
              <div className="p-20 text-center text-muted-foreground font-bold italic">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-3" />
                Chargement des signalements...
              </div>
            )}
            {!loading && filtered.length === 0 && (
              <div className="p-20 text-center text-muted-foreground font-bold italic">
                Aucun signalement trouvé pour cette recherche.
              </div>
            )}
            {!loading && filtered.map((s) => {
              const meta = STATUT_META[s.statut] ?? STATUT_META.NOUVEAU;
              const StatusIcon = meta.icon;
              const needsAttention = s.statut === "NOUVEAU" || s.statut === "VIRAL";
              return (
                <Link
                  key={s.id}
                  href={`/controle/signalements/${s.id}`}
                  className="relative group block hover:bg-muted/40 transition-all duration-200"
                >
                  {needsAttention && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-orange-400 to-orange-600" />
                  )}
                  <div className="flex items-start gap-5 p-6 pl-8">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border ${meta.bg} ${meta.border}`}>
                      <StatusIcon className={`w-6 h-6 ${meta.text}`} />
                    </div>

                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-black text-foreground group-hover:text-primary transition-colors text-base">
                          {s.sujet}
                        </p>
                        {s.is_prioritaire && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 border border-red-500/20 animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> PRIORITAIRE
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1">{s.description}</p>

                      <div className="flex items-center gap-2 flex-wrap mt-2">
                        <span className={`inline-flex items-center gap-1.5 text-[9px] font-black px-2.5 py-1 rounded-full border ${meta.bg} ${meta.text} ${meta.border}`}>
                          <StatusIcon className="w-3 h-3" />
                          {meta.label}
                        </span>

                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-muted-foreground">
                          <MapPin className="w-3 h-3 text-primary" />
                          {s.commune_detail?.nom || s.commune}
                        </span>

                        {s.nb_preuves > 0 && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full bg-primary/5 text-primary border border-primary/20">
                            {s.nb_preuves} preuve{s.nb_preuves > 1 ? "s" : ""}
                          </span>
                        )}

                        {s.nb_votes > 0 && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold text-muted-foreground">
                            {s.nb_votes} vote{s.nb_votes > 1 ? "s" : ""} ({s.pct_credible}% credible)
                          </span>
                        )}

                        <span className="text-[9px] font-bold text-muted-foreground/70 ml-auto">
                          {formatDateShort(s.created_at)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center shrink-0 self-center">
                      <Button
                        variant="ghost"
                        className={`h-11 px-5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                          needsAttention
                            ? "bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30 group-hover:scale-[1.03]"
                            : "group-hover:bg-primary group-hover:text-white"
                        }`}
                      >
                        {needsAttention ? "Auditer" : "Voir"}
                        <ExternalLink className="w-3.5 h-3.5 ml-2" />
                      </Button>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
