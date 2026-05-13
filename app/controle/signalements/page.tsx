"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { AlertCircle, Search, Download, Loader2, Filter, ThumbsUp, ThumbsDown, CheckCircle2, Clock, MapPin, ExternalLink } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { signalementsApi, Signalement } from "@/lib/api";
import { formatDateShort } from "@/lib/constants";

const VERDICT_COLORS: Record<string, "success" | "destructive" | "secondary"> = {
  CREDIBLE: "success",
  INFONDE: "destructive",
  PENDING: "secondary",
};

export default function SignalementsPage() {
  const [signalements, setSignalements] = useState<Signalement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [reviewedFilter, setReviewedFilter] = useState<boolean | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [votingId, setVotingId] = useState<string | null>(null);

  useEffect(() => {
    fetchSignalements();
  }, []);

  const fetchSignalements = async () => {
    setLoading(true);
    try {
      // Vérifier cache (3 min)
      const cached = localStorage.getItem('komoe_signalements_cache');
      const cacheTime = localStorage.getItem('komoe_signalements_cache_time');
      const now = Date.now();
      if (cached && cacheTime && (now - parseInt(cacheTime)) < 180000) {
        setSignalements(JSON.parse(cached));
        setLoading(false);
        return;
      }

      const response = await signalementsApi.list();
      const result = response?.results || [];
      setSignalements(result);
      localStorage.setItem('komoe_signalements_cache', JSON.stringify(result));
      localStorage.setItem('komoe_signalements_cache_time', now.toString());
    } catch (err) {
      console.error("Erreur fetch signalements:", err);
      setSignalements([]);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (id: string, verdict: "CREDIBLE" | "INFONDE") => {
    // Confirmation pour éviter votes accidentels
    const verdict_label = verdict === "CREDIBLE" ? "CRÉDIBLE" : "INFONDÉ";
    if (!confirm(`Êtes-vous certain que ce signalement est ${verdict_label} ?\n\nCette action est irréversible.`)) {
      return;
    }

    setVotingId(id);
    try {
      await signalementsApi.voter(id, verdict);
      // Update optimiste au lieu de full refetch
      setSignalements(prevSignalements =>
        prevSignalements.map(s =>
          s.id === id ? { ...s, is_reviewed: true } : s
        )
      );
    } catch (err) {
      alert("Erreur vote: " + (err as any).message);
      setVotingId(null);
    } finally {
      setVotingId(null);
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
    reviewed: signalements.filter(s => s.is_reviewed).length,
    pending: signalements.filter(s => !s.is_reviewed).length,
    withProof: signalements.filter(s => s.nb_preuves > 0).length,
  };

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

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
        {[
          { label: "Total signalements", value: stats.total.toString(), color: "text-foreground", icon: AlertCircle },
          { label: "Révisés", value: stats.reviewed.toString(), color: "text-emerald-500", icon: CheckCircle2 },
          { label: "En attente", value: stats.pending.toString(), color: "text-amber-500", icon: Clock },
          { label: "Avec preuves", value: stats.withProof.toString(), color: "text-primary", icon: MapPin },
        ].map(({ label, value, color, icon: Icon }) => (
          <Card key={label} className="rounded-[24px] border-border/50 shadow-sm overflow-hidden">
            <CardContent className="p-6 relative">
              <Icon className={`w-12 h-12 ${color} absolute -right-2 -bottom-2 opacity-5`} />
              <p className="text-3xl font-black text-foreground">{loading ? "…" : value}</p>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

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
            {!loading && filtered.map((s) => (
              <div key={s.id} className="flex items-start justify-between p-6 hover:bg-muted/30 transition-all group">
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-12 h-12 rounded-xl bg-rose-500/10 flex items-center justify-center shrink-0 border border-rose-200">
                    <AlertCircle className="w-6 h-6 text-rose-500" />
                  </div>
                  <div className="space-y-1 flex-1 min-w-0">
                    <p className="font-black text-foreground group-hover:text-primary transition-colors">{s.sujet}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{s.description}</p>
                    <div className="flex items-center gap-3 flex-wrap mt-2">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {s.commune_detail?.nom || s.commune}
                      </span>
                      {s.nb_preuves > 0 && (
                        <Badge variant="outline" className="text-[9px] font-black">
                          {s.nb_preuves} preuve{s.nb_preuves > 1 ? "s" : ""}
                        </Badge>
                      )}
                      {s.is_reviewed ? (
                        <Badge variant="success" className="text-[9px] font-black">Révisé</Badge>
                      ) : (
                        <Badge variant="warning" className="text-[9px] font-black">En attente</Badge>
                      )}
                      <span className="text-[9px] font-bold text-muted-foreground italic">
                        {formatDateShort(s.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-4">
                  <Link href={`/controle/signalements/${s.id}`}>
                    <Button variant="outline" className="h-10 px-3 rounded-lg text-[9px] font-black">
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </Link>
                  {!s.is_reviewed && (
                    <>
                      <Button
                        onClick={() => handleVote(s.id, "CREDIBLE")}
                        disabled={votingId === s.id}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white h-10 px-3 rounded-lg text-[9px] font-black"
                      >
                        {votingId === s.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <ThumbsUp className="w-4 h-4" />}
                      </Button>
                      <Button
                        onClick={() => handleVote(s.id, "INFONDE")}
                        disabled={votingId === s.id}
                        className="bg-rose-600 hover:bg-rose-700 text-white h-10 px-3 rounded-lg text-[9px] font-black"
                      >
                        {votingId === s.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <ThumbsDown className="w-4 h-4" />}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
