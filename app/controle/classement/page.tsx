"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { BarChart3, Trophy, ArrowUp, ArrowDown, Loader2 } from "lucide-react";
import { useCommunesList } from "@/lib/hooks/useCommunes";
import { formatFCFA } from "@/lib/constants";

export default function ClassementPage() {
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");
  const { communes: rawCommunes, loading } = useCommunesList();

  const communes = [...rawCommunes].sort((a, b) =>
    sortDir === "desc"
      ? b.score_transparence - a.score_transparence
      : a.score_transparence - b.score_transparence
  );

  const podium = [
    { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-300", label: "🥇" },
    { bg: "bg-muted/50",  text: "text-muted-foreground",  border: "border-border",  label: "🥈" },
    { bg: "bg-orange-100",text: "text-orange-700",border: "border-orange-300",label: "🥉" },
  ];

  const getBadge = (score: number) =>
    score >= 70 ? "success" : score >= 50 ? "secondary" : "destructive";

  const getBarColor = (score: number) =>
    score >= 70 ? "bg-emerald-500" : score >= 50 ? "bg-amber-400" : "bg-red-400";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold text-foreground tracking-tight">Classement Transparence</h2>
        <p className="text-muted-foreground mt-1 text-sm">Score calculé sur : soumissions blockchain, délais de validation, IPFS</p>
      </div>

      {/* Podium top 3 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {loading && <div className="col-span-3 flex justify-center py-8 text-muted-foreground gap-2"><Loader2 className="w-4 h-4 animate-spin" />Chargement…</div>}
        {!loading && communes.slice(0, 3).map((c, i) => (
          <Card key={c.id} className={`border-2 ${podium[i].border}`}>
            <CardContent className="p-5 text-center">
              <span className="text-3xl">{podium[i].label}</span>
              <p className="font-bold text-foreground mt-2">{c.nom}</p>
              <p className="text-xs text-muted-foreground mb-3">{c.region}</p>
              <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold ${podium[i].bg} ${podium[i].text}`}>
                {c.score_transparence}/100
              </div>
              <p className="text-xs text-muted-foreground mt-2">{formatFCFA(c.budget_annuel_fcfa)} alloué</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tableau complet */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              Classement complet — {communes.length} communes
            </CardTitle>
            <button
              onClick={() => setSortDir(d => d === "desc" ? "asc" : "desc")}
              className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-1.5 transition"
            >
              {sortDir === "desc" ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />}
              {sortDir === "desc" ? "Meilleurs en tête" : "Pires en tête"}
            </button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-gray-50">
            {communes.map((c, i) => (
              <div key={c.id} className="flex items-center gap-4 px-4 py-3 hover:bg-muted transition">
                {/* Rang */}
                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  i === 0 ? "bg-amber-100 text-amber-700" :
                  i === 1 ? "bg-muted/50 text-muted-foreground" :
                  i === 2 ? "bg-orange-100 text-orange-700" :
                  "bg-muted text-muted-foreground"
                }`}>
                  {i + 1}
                </span>

                {/* Commune */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-foreground truncate">{c.nom}</p>
                  <p className="text-xs text-muted-foreground">{c.region}</p>
                </div>

                {/* Barre de score */}
                <div className="w-32 hidden sm:block">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-muted/50 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${getBarColor(c.score_transparence)}`}
                        style={{ width: `${c.score_transparence}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Badge score */}
                <Badge variant={getBadge(c.score_transparence)} className="shrink-0">
                  {c.score_transparence}/100
                </Badge>

                {/* Taux exécution */}
                <span className="text-xs text-muted-foreground hidden md:block w-16 text-right shrink-0">
                  {c.budget_annuel_fcfa > 0 ? ((c.budget_depense_fcfa / c.budget_annuel_fcfa) * 100).toFixed(0) : 0}% exéc.
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
