"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import StatsCard from "@/components/ui/StatsCard";
import { BarChart3, Loader2, Award, Target, AlertCircle } from "lucide-react";
import { useCommunesList } from "@/lib/hooks/useCommunes";
import { formatFCFA } from "@/lib/constants";

export default function ComparatifPage() {
  const { communes: rawCommunes, loading } = useCommunesList();
  const communes = [...rawCommunes].sort((a, b) => b.score_transparence - a.score_transparence);
  const avg = communes.length > 0 ? Math.round(communes.reduce((s, c) => s + c.score_transparence, 0) / communes.length) : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-card border border-border p-8 rounded-[32px] shadow-2xl shadow-primary/5">
        <div>
          <h2 className="text-3xl font-black text-foreground tracking-tight uppercase italic flex items-center gap-3">
             <Target className="text-primary" /> Analyse Comparative
          </h2>
          <p className="text-muted-foreground mt-2 font-medium max-w-2xl">
             Benchmarks financiers et performance de gestion par collectivité territoriale.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatsCard label="Moyenne Nationale" value={avg} icon={<BarChart3 className="text-primary" />} />
        <StatsCard label="Leader Transparence" value={communes[0]?.nom || "—"} icon={<Award className="text-emerald-500" />} />
        <StatsCard label="Zone de Vigilance" value={communes.filter(c => c.score_transparence < 50).length} icon={<AlertCircle className="text-rose-500" />} />
      </div>

      <Card className="shadow-2xl border-border rounded-[32px] overflow-hidden border">
        <CardHeader className="bg-muted/30 border-b border-border p-8">
          <CardTitle className="text-lg font-black uppercase tracking-widest text-foreground flex items-center gap-3">
            <BarChart3 className="w-5 h-5 text-primary" />
            Tableau de Bord Comparatif des Communes
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="text-left px-8 py-5 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Commune</th>
                  <th className="text-right px-4 py-5 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Budget Annuel</th>
                  <th className="text-right px-4 py-5 text-[10px] font-black text-muted-foreground uppercase tracking-widest hidden md:table-cell">Décaissements</th>
                  <th className="text-right px-4 py-5 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Exécution</th>
                  <th className="text-right px-8 py-5 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading && (
                  <tr>
                    <td colSpan={5} className="px-8 py-20 text-center">
                       <div className="flex flex-col items-center gap-3">
                          <Loader2 className="w-8 h-8 animate-spin text-primary" />
                          <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Compilation des données...</span>
                       </div>
                    </td>
                  </tr>
                )}
                {!loading && communes.map((c, i) => {
                  const execRate = c.budget_annuel_fcfa > 0
                    ? ((c.budget_depense_fcfa / c.budget_annuel_fcfa) * 100).toFixed(0)
                    : '0';
                  return (
                    <tr key={c.id} className="hover:bg-muted/30 transition-all group">
                      <td className="px-8 py-4">
                        <div className="flex items-center gap-4">
                          <span className="w-6 text-[10px] font-black text-muted-foreground text-center shrink-0">{i + 1}</span>
                          <div>
                            <p className="font-black text-foreground group-hover:text-primary transition-colors">{c.nom}</p>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">{c.region}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right font-bold text-foreground tabular-nums">{formatFCFA(c.budget_annuel_fcfa)}</td>
                      <td className="px-4 py-4 text-right font-bold text-foreground/80 hidden md:table-cell tabular-nums">{formatFCFA(c.budget_depense_fcfa)}</td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <div className="w-20 bg-muted rounded-full h-2 overflow-hidden border border-border">
                            <div
                              className="h-full bg-primary transition-all duration-1000"
                              style={{ width: `${Math.min(Number(execRate), 100)}%` }}
                            />
                          </div>
                          <span className="text-xs font-black text-foreground tabular-nums">{execRate}%</span>
                        </div>
                      </td>
                      <td className="px-8 py-4 text-right">
                        <Badge variant={c.score_transparence >= 70 ? "success" : c.score_transparence >= 50 ? "secondary" : "destructive"} className="rounded-lg px-3 font-black">
                          {c.score_transparence}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
