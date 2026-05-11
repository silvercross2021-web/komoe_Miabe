"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { AlertTriangle, TrendingDown, AlertCircle, Clock, Download, Loader2, Filter, MapPin } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { anomaliesApi } from "@/lib/api";
import { formatFCFA } from "@/lib/constants";

interface Anomaly {
  id: string;
  commune: string;
  commune_nom?: string;
  type: string;
  severity: "critical" | "high" | "medium" | "low";
  description: string;
  value?: number;
  threshold?: number;
  created_at: string;
}

const ANOMALY_TYPES: Record<string, { label: string; color: "success" | "destructive" | "secondary" | "warning" }> = {
  budget_gap: { label: "Écart budgétaire", color: "destructive" },
  no_transactions: { label: "Pas de transactions", color: "warning" },
  signalement_old: { label: "Signalement ancien", color: "warning" },
  score_decline: { label: "Score en baisse", color: "secondary" },
  modification_retroactive: { label: "Modification rétroactive", color: "destructive" },
};

const SEVERITY_COLORS: Record<string, { label: string; color: "success" | "destructive" | "secondary" | "warning" }> = {
  critical: { label: "CRITIQUE", color: "destructive" },
  high: { label: "ÉLEVÉE", color: "warning" },
  medium: { label: "MOYENNE", color: "secondary" },
  low: { label: "BASSE", color: "secondary" },
};

export default function AnomaliesPage() {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [severityFilter, setSeverityFilter] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    fetchAnomalies();
  }, []);

  const fetchAnomalies = async () => {
    setLoading(true);
    try {
      try {
        const response = await anomaliesApi.list();
        const data = (response?.anomalies || []) as Anomaly[];
        setAnomalies(
          data.map((a) => ({
            ...a,
            severity: a.severity || "medium",
          }))
        );
        setError(null);
      } catch (apiErr) {
        // Fallback: données fictives pour démonstration
        console.warn('Endpoint anomalies absent, utilisation données fictives');
        setError("Mode test: Anomalies fictives (en attente endpoint backend)");

        const mockAnomalies: Anomaly[] = [
          {
            id: "1",
            commune: "12",
            commune_nom: "Abidjan",
            type: "budget_gap",
            severity: "critical",
            description: "Écart budgétaire > 30% entre prévisions et exécution",
            value: 2500000000,
            threshold: 2000000000,
            created_at: new Date(Date.now() - 86400000).toISOString(),
          },
          {
            id: "2",
            commune: "15",
            commune_nom: "Yamoussoukro",
            type: "no_transactions",
            severity: "high",
            description: "Aucune transaction depuis 45 jours",
            created_at: new Date(Date.now() - 3888000000).toISOString(),
          },
          {
            id: "3",
            commune: "8",
            commune_nom: "Bouaké",
            type: "signalement_old",
            severity: "high",
            description: "Signalement citoyen non répondu depuis 20 jours",
            created_at: new Date(Date.now() - 1728000000).toISOString(),
          },
          {
            id: "4",
            commune: "20",
            commune_nom: "San-Pédro",
            type: "score_decline",
            severity: "medium",
            description: "Score de transparence en baisse de 15 points",
            value: 65,
            threshold: 80,
            created_at: new Date(Date.now() - 604800000).toISOString(),
          },
          {
            id: "5",
            commune: "25",
            commune_nom: "Gagnoa",
            type: "modification_retroactive",
            severity: "critical",
            description: "Modification rétroactive détectée sur transaction validée",
            created_at: new Date(Date.now() - 172800000).toISOString(),
          },
        ];

        setAnomalies(mockAnomalies);
      }
    } finally {
      setLoading(false);
    }
  };

  const filtered = anomalies.filter((a) => {
    const matchSeverity = severityFilter ? a.severity === severityFilter : true;
    const matchType = typeFilter ? a.type === typeFilter : true;
    return matchSeverity && matchType;
  });

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const headers = ["Commune", "Type", "Sévérité", "Description", "Valeur", "Date"];
      const rows = filtered.map((a) => [
        a.commune_nom || a.commune,
        ANOMALY_TYPES[a.type]?.label || a.type,
        SEVERITY_COLORS[a.severity]?.label || a.severity,
        a.description,
        a.value ? formatFCFA(a.value) : "N/A",
        a.created_at,
      ]);

      const csvContent = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
      const blob = new Blob([`﻿${csvContent}`], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Komoe_Anomalies_${new Date().toISOString().split("T")[0]}.csv`);
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
    total: anomalies.length,
    critical: anomalies.filter(a => a.severity === "critical").length,
    high: anomalies.filter(a => a.severity === "high").length,
    medium: anomalies.filter(a => a.severity === "medium").length,
  };

  const anomalyTypes = Object.keys(ANOMALY_TYPES);
  const severities = ["critical", "high", "medium", "low"];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-8">
      {error && (
        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/30 rounded-[16px]">
          <p className="text-sm font-bold text-amber-800 dark:text-amber-400">{error}</p>
        </div>
      )}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-card border border-border p-8 rounded-[32px] shadow-2xl shadow-primary/5">
        <div>
          <h2 className="text-3xl font-black text-foreground tracking-tight uppercase italic">Détection d'Anomalies</h2>
          <p className="text-muted-foreground mt-1 font-medium italic">Audit intelligent des écarts budgétaires et anomalies</p>
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
          { label: "Anomalies détectées", value: stats.total.toString(), color: "text-foreground", icon: AlertCircle },
          { label: "CRITIQUE", value: stats.critical.toString(), color: "text-red-500", icon: AlertTriangle },
          { label: "ÉLEVÉE", value: stats.high.toString(), color: "text-amber-500", icon: TrendingDown },
          { label: "MOYENNE", value: stats.medium.toString(), color: "text-orange-500", icon: Clock },
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
            Toutes les anomalies
          </CardTitle>
          <div className="flex flex-col sm:flex-row items-center gap-1.5 flex-wrap">
            {severities.map(s => (
              <button
                key={s}
                onClick={() => setSeverityFilter(severityFilter === s ? null : s)}
                className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase transition-all ${severityFilter === s ? 'bg-primary text-white' : 'bg-card border border-border text-muted-foreground hover:bg-muted'}`}
              >
                {SEVERITY_COLORS[s]?.label || s}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {loading && (
              <div className="p-20 text-center text-muted-foreground font-bold italic">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-3" />
                Analyse des anomalies...
              </div>
            )}
            {!loading && filtered.length === 0 && (
              <div className="p-20 text-center text-muted-foreground font-bold italic">
                Aucune anomalie détectée pour les critères sélectionnés. ✅
              </div>
            )}
            {!loading && filtered.map((a) => (
              <div key={a.id} className="flex items-start justify-between p-6 hover:bg-muted/30 transition-all group">
                <div className="flex items-start gap-4 flex-1">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${
                    a.severity === "critical" ? "bg-red-500/10 border-red-200" : "bg-amber-500/10 border-amber-200"
                  }`}>
                    {a.severity === "critical" ? (
                      <AlertTriangle className="w-6 h-6 text-red-500" />
                    ) : (
                      <AlertCircle className="w-6 h-6 text-amber-500" />
                    )}
                  </div>
                  <div className="space-y-1 flex-1 min-w-0">
                    <p className="font-black text-foreground group-hover:text-primary transition-colors">{a.description}</p>
                    <div className="flex items-center gap-3 flex-wrap">
                      <Badge variant={ANOMALY_TYPES[a.type]?.color ?? "secondary"} className="text-[9px] font-black rounded-lg">
                        {ANOMALY_TYPES[a.type]?.label || a.type}
                      </Badge>
                      <Badge variant={SEVERITY_COLORS[a.severity]?.color ?? "secondary"} className="text-[9px] font-black rounded-lg">
                        {SEVERITY_COLORS[a.severity]?.label}
                      </Badge>
                      {a.value && (
                        <span className="text-[9px] font-black text-primary bg-primary/5 px-2 py-0.5 rounded-lg">
                          {formatFCFA(a.value)}
                        </span>
                      )}
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {a.commune_nom || a.commune}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Règles de détection */}
      <Card className="rounded-[32px] overflow-hidden border shadow-xl bg-muted/20">
        <CardHeader className="border-b border-border">
          <CardTitle className="text-lg font-black uppercase tracking-tight">Règles de détection</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { rule: "Écart budgétaire > 20%", severity: "🔴 CRITIQUE" },
              { rule: "Pas de transaction depuis 30j", severity: "🟡 ALERTE" },
              { rule: "Signalement non répondu > 15j", severity: "🔴 CRITIQUE" },
              { rule: "Score transparence ↓ > 10pts", severity: "🟡 ALERTE" },
              { rule: "Modification rétroactive détectée", severity: "🔴 CRITIQUE" },
              { rule: "Budget mal exécuté < 10%", severity: "🟠 MOYEN" },
            ].map((item, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-card border border-border/30">
                <span className="text-sm font-bold text-foreground">{item.rule}</span>
                <Badge variant="outline" className="shrink-0 text-[9px] font-black">{item.severity}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
