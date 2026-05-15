"use client";

import { useState, useEffect, useMemo } from "react";
import { propositionsApi, type Proposition } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { 
  Lightbulb, 
  Clock, 
  MessageSquare, 
  ThumbsUp, 
  CheckCircle2, 
  Loader2,
  TrendingUp,
  ShieldCheck,
  ChevronRight,
  Plus
} from "lucide-react";
import { formatDateShort, formatFCFA } from "@/lib/constants";
import Link from "next/link";
import { motion } from "framer-motion";

export default function CommuneEngagementsPage() {
  const { user } = useAuth();
  const [propositions, setPropositions] = useState<Proposition[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"TOUT" | "EN_ATTENTE" | "OFFICIEL">("TOUT");

  const fetchPropositions = async () => {
    if (!user?.commune) return;
    setLoading(true);
    try {
      const res = await propositionsApi.list({ 
        commune: Number(user.commune) 
      });
      setPropositions(res.results ?? []);
    } catch (err) {
      console.error("Erreur chargement propositions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPropositions();
  }, [user?.commune]);

  const filtered = useMemo(() => {
    return propositions.filter(p => {
      if (filter === "EN_ATTENTE") return p.statut === "SUGGESTION";
      if (filter === "OFFICIEL") return p.is_official;
      return true;
    });
  }, [propositions, filter]);

  const stats = {
    total: propositions.length,
    suggestions: propositions.filter(p => p.statut === "SUGGESTION").length,
    officiels: propositions.filter(p => p.is_official).length,
    popular: propositions.filter(p => p.pct_soutien >= 70).length
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-card border border-border p-8 rounded-[32px] shadow-2xl shadow-primary/5">
        <div>
          <div className="flex items-center gap-2 bg-blue-500/10 text-blue-600 px-3 py-1 rounded-lg w-max mb-4 border border-blue-500/20">
            <Lightbulb size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest">Budget Participatif</span>
          </div>
          <h2 className="text-3xl font-black text-foreground tracking-tight uppercase italic">Propositions Citoyennes</h2>
          <p className="text-muted-foreground mt-2 font-medium">
            Consultez les idées des citoyens et officialisez les projets prioritaires pour votre commune.
          </p>
        </div>
      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Idées", value: stats.total, icon: Lightbulb, color: "text-foreground" },
          { label: "Suggestions", value: stats.suggestions, icon: Clock, color: "text-amber-600" },
          { label: "Officialisés", value: stats.officiels, icon: ShieldCheck, color: "text-emerald-600" },
          { label: "Plébiscités", value: stats.popular, icon: TrendingUp, color: "text-primary" },
        ].map((s, idx) => (
          <div key={idx} className="bg-card p-6 rounded-3xl border border-border flex items-center gap-4">
            <div className={`p-3 rounded-2xl bg-muted/50 ${s.color}`}>
              <s.icon size={20} />
            </div>
            <div>
              <p className="text-2xl font-black text-foreground">{s.value}</p>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-border">
        {(["TOUT", "EN_ATTENTE", "OFFICIEL"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-6 py-4 font-black text-xs uppercase tracking-widest transition-all relative ${
              filter === f ? "text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {f === "TOUT" ? "Toutes les propositions" : f === "EN_ATTENTE" ? "Suggestions" : "Engagements Officiels"}
            {filter === f && (
              <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full" />
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-sm font-black uppercase tracking-widest text-muted-foreground">Synchronisation des propositions...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-32 text-center bg-card rounded-[40px] border border-dashed border-border">
          <Lightbulb className="w-16 h-16 mx-auto mb-4 opacity-10" />
          <p className="text-sm font-black text-muted-foreground uppercase tracking-widest">Aucune proposition dans cette catégorie</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filtered.map((prop, idx) => (
            <motion.div
              key={prop.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className="rounded-[28px] border border-border hover:shadow-xl transition-all overflow-hidden group">
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row items-stretch">
                    <div className="p-8 flex-1 space-y-4">
                      <div className="flex items-center gap-3">
                        <Badge className={`rounded-full px-3 py-1 font-bold text-[10px] uppercase ${
                          prop.is_official 
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" 
                            : "bg-blue-500/10 text-blue-600 border-blue-500/20"
                        }`}>
                          {prop.is_official ? "Engagement Officiel" : "Suggestion Citoyenne"}
                        </Badge>
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-tighter">
                          {prop.categorie} • {formatDateShort(prop.created_at)}
                        </span>
                      </div>

                      <h3 className="text-xl font-black text-foreground group-hover:text-primary transition-colors italic uppercase">
                        {prop.titre}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 font-medium">
                        {prop.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-6 pt-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <ThumbsUp size={14} />
                          </div>
                          <div>
                            <p className="text-xs font-black text-foreground">{prop.nb_soutiens}</p>
                            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Soutiens</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                            <TrendingUp size={14} />
                          </div>
                          <div>
                            <p className="text-xs font-black text-foreground">{prop.pct_soutien}%</p>
                            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Adhésion</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                            <MessageSquare size={14} />
                          </div>
                          <div>
                            <p className="text-xs font-black text-foreground">{prop.commentaires?.length ?? 0}</p>
                            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Avis</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="md:w-64 bg-muted/30 border-l border-border p-8 flex flex-col justify-center gap-4">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Estimation Budget</p>
                        <p className="text-lg font-black text-foreground">{formatFCFA(prop.budget_demande_fcfa)}</p>
                      </div>

                      {prop.is_official ? (
                        <div className="flex items-center gap-2 text-emerald-600">
                          <ShieldCheck size={18} />
                          <span className="text-[10px] font-black uppercase tracking-widest">Déjà officialisé</span>
                        </div>
                      ) : (
                        <Link href={`/public/engagements/proposition/${prop.id}`} className="w-full">
                          <Button className="w-full rounded-xl bg-primary text-white font-black uppercase text-[10px] tracking-widest h-11">
                            Examiner <ChevronRight size={14} className="ml-1" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
