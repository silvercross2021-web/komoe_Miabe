"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Heart, CheckCircle2, Clock, Users, Search, Download, Loader2, Filter, AlertTriangle, FileText } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { authApi, Engagement } from "@/lib/api";
import { formatDateShort } from "@/lib/constants";

const ENGAGEMENT_TYPES: Record<string, { label: string; icon: any; color: string }> = {
  vote: { label: "Vote", icon: Heart, color: "text-blue-500" },
  signalement: { label: "Signalement", icon: AlertTriangle, color: "text-rose-500" },
  participation: { label: "Participation", icon: Users, color: "text-emerald-500" },
  commentaire: { label: "Commentaire", icon: FileText, color: "text-amber-500" },
};

const ENGAGEMENT_STATUS: Record<string, { label: string; color: "success" | "secondary" | "outline" | "warning" }> = {
  completed: { label: "Complété", color: "success" },
  pending: { label: "En attente", color: "warning" },
  processing: { label: "En traitement", color: "secondary" },
};

export default function EngagementsPage() {
  const [engagements, setEngagements] = useState<Engagement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    fetchEngagements();
  }, []);

  const fetchEngagements = async () => {
    setLoading(true);
    try {
      // Vérifier le cache d'abord
      const cached = localStorage.getItem('komoe_engagements_cache');
      const cacheTime = localStorage.getItem('komoe_engagements_cache_time');
      const now = Date.now();
      if (cached && cacheTime && (now - parseInt(cacheTime)) < 300000) { // 5 min cache
        setEngagements(JSON.parse(cached));
        setLoading(false);
        return;
      }

      const response = await fetch('/api/engagements/', {
        headers: {
          'Authorization': `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('komoe_access') || '' : ''}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const result = data.results || [];
        setEngagements(result);
        localStorage.setItem('komoe_engagements_cache', JSON.stringify(result));
        localStorage.setItem('komoe_engagements_cache_time', now.toString());
      } else if (response.status === 404) {
        console.warn('Endpoint /api/engagements/ non disponible, utilisation fallback optimisé');
        setError('Chargement en mode compatibilité (données en cache, 5 min)...');

        const usersResp = await authApi.list();
        const users = usersResp?.results || [];

        // Paralléliser les requêtes par lots de 10
        const batchSize = 10;
        let allEngagements: Engagement[] = [];

        for (let i = 0; i < users.length; i += batchSize) {
          const batch = users.slice(i, i + batchSize);
          const batchResults = await Promise.all(
            batch.map(async (user) => {
              try {
                const engData = await authApi.getEngagements(user.id);
                return (engData?.results || []).map((e: Engagement) => ({
                  ...e,
                  user_id: user.id,
                  user_name: user.full_name,
                  user_email: user.email,
                }));
              } catch (err) {
                console.error(`Erreur engagement user ${user.id}:`, err);
                return [];
              }
            })
          );
          allEngagements = [...allEngagements, ...batchResults.flat()];
        }

        setEngagements(allEngagements);
        localStorage.setItem('komoe_engagements_cache', JSON.stringify(allEngagements));
        localStorage.setItem('komoe_engagements_cache_time', now.toString());
        setError('Données chargées et cachées (5 min)');
      }
    } catch (err) {
      const errorMsg = (err as any).message || 'Erreur inconnue';
      console.error("Erreur fetch engagements:", err);
      setError(`Erreur: ${errorMsg}`);
      setEngagements([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = engagements.filter((e) => {
    const matchSearch =
      e.description?.toLowerCase().includes(search.toLowerCase()) ||
      e.user_name?.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter ? e.type === typeFilter : true;
    const matchStatus = statusFilter ? e.status === statusFilter : true;
    return matchSearch && matchType && matchStatus;
  });

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const headers = ["Type", "Description", "Citoyen", "Statut", "Preuve Hash", "Date"];
      const rows = filtered.map((e) => [
        ENGAGEMENT_TYPES[e.type]?.label || e.type,
        e.description,
        e.user_name,
        ENGAGEMENT_STATUS[e.status]?.label || e.status,
        e.proof_hash || "N/A",
        e.date || "N/A",
      ]);

      const csvContent = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
      const blob = new Blob([`﻿${csvContent}`], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Komoe_Engagements_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert("Erreur export: " + (err as any).message);
    } finally {
      setIsExporting(false);
    }
  };

  const engagementTypes = ["vote", "signalement", "participation", "commentaire"];
  const statuses = ["completed", "pending", "processing"];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-8">
      {error && (
        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/30 rounded-[16px]">
          <p className="text-sm font-bold text-amber-800 dark:text-amber-400">{error}</p>
        </div>
      )}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-card border border-border p-8 rounded-[32px] shadow-2xl shadow-primary/5">
        <div>
          <h2 className="text-3xl font-black text-foreground tracking-tight uppercase italic">Engagements Citoyens</h2>
          <p className="text-muted-foreground mt-1 font-medium italic">Audit de la participation, votes et signalements citoyens</p>
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
          { label: "Total engagements", value: engagements.length.toString(), color: "text-foreground", icon: Heart },
          { label: "Complétés", value: engagements.filter(e => e.status === 'completed').length.toString(), color: "text-emerald-500", icon: CheckCircle2 },
          { label: "En attente", value: engagements.filter(e => e.status === 'pending').length.toString(), color: "text-amber-500", icon: Clock },
          { label: "Citoyens actifs", value: new Set(engagements.map(e => e.user_id)).size.toString(), color: "text-primary", icon: Users },
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
            Tous les engagements
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
              {engagementTypes.map(t => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(typeFilter === t ? null : t)}
                  className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase transition-all ${typeFilter === t ? 'bg-primary text-white' : 'bg-card border border-border text-muted-foreground hover:bg-muted'}`}
                >
                  {ENGAGEMENT_TYPES[t]?.label || t}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {loading && (
              <div className="p-20 text-center text-muted-foreground font-bold italic">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-3" />
                Chargement des engagements...
              </div>
            )}
            {!loading && filtered.length === 0 && (
              <div className="p-20 text-center text-muted-foreground font-bold italic">
                Aucun engagement trouvé pour cette recherche.
              </div>
            )}
            {!loading && filtered.map((e) => {
              const TypeIcon = ENGAGEMENT_TYPES[e.type]?.icon || Heart;
              return (
                <div
                  key={e.id}
                  className="flex items-start justify-between p-6 hover:bg-muted/30 transition-all group"
                >
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${ENGAGEMENT_TYPES[e.type]?.color} bg-opacity-10`}>
                      <TypeIcon className={`w-6 h-6 ${ENGAGEMENT_TYPES[e.type]?.color}`} />
                    </div>
                    <div className="space-y-1 flex-1 min-w-0">
                      <p className="font-black text-foreground group-hover:text-primary transition-colors line-clamp-2">{e.description}</p>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">
                          {e.user_name}
                        </span>
                        <Badge variant={ENGAGEMENT_STATUS[e.status]?.color ?? "outline"} className="rounded-lg px-2 py-0.5 text-[9px] font-black">
                          {ENGAGEMENT_STATUS[e.status]?.label || e.status}
                        </Badge>
                        {e.proof_hash && (
                          <span className="text-[9px] font-mono text-primary bg-primary/5 px-2 py-0.5 rounded-lg">
                            {e.proof_hash.slice(0, 10)}...
                          </span>
                        )}
                        <span className="text-[9px] font-bold text-muted-foreground italic">
                          {e.date ? formatDateShort(e.date) : "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
