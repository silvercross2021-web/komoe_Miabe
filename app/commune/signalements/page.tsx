"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { signalementsApi, type Signalement } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import {
  ShieldAlert, Loader2, Clock, CheckCircle2,
  AlertTriangle, ExternalLink, MessageSquare, MapPin,
} from "lucide-react";
import { formatDateShort } from "@/lib/constants";

export default function CommuneSignalementsPage() {
  const { user } = useAuth();
  const [signalements, setSignalements] = useState<Signalement[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"TOUS" | "EN_ATTENTE" | "TRAITES">("TOUS");

  useEffect(() => {
    const fetchSignalements = async () => {
      setLoading(true);
      try {
        const res = await signalementsApi.list({
          commune: user?.commune ? Number(user.commune) : undefined,
        });
        setSignalements(res.results ?? []);
      } catch {
        setSignalements([]);
      } finally {
        setLoading(false);
      }
    };
    fetchSignalements();
  }, [user]);

  const filtered = signalements.filter(s => {
    if (filter === "EN_ATTENTE") return !s.is_reviewed;
    if (filter === "TRAITES") return s.is_reviewed;
    return true;
  });

  const stats = {
    total: signalements.length,
    enAttente: signalements.filter(s => !s.is_reviewed).length,
    traites: signalements.filter(s => s.is_reviewed).length,
    avecCommentaires: signalements.filter(s => (s.commentaires?.length ?? 0) > 0).length,
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* En-tête */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-card border border-border p-8 rounded-[32px] shadow-2xl shadow-primary/5">
        <div>
          <div className="flex items-center gap-2 bg-amber-500/10 text-amber-600 px-3 py-1 rounded-lg w-max mb-4 border border-amber-500/20">
            <ShieldAlert size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest">Commune</span>
          </div>
          <h2 className="text-3xl font-black text-foreground tracking-tight uppercase italic">Signalements</h2>
          <p className="text-muted-foreground mt-2 font-medium">
            Signalez des anomalies et suivez leur traitement — avec commentaires et preuves IPFS.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total", value: stats.total, color: "text-foreground", bg: "bg-card" },
          { label: "En attente", value: stats.enAttente, color: "text-amber-600", bg: "bg-amber-500/10" },
          { label: "Traités", value: stats.traites, color: "text-emerald-600", bg: "bg-emerald-500/10" },
          { label: "Avec commentaires", value: stats.avecCommentaires, color: "text-primary", bg: "bg-primary/10" },
        ].map(s => (
          <div key={s.label} className={`${s.bg} p-5 rounded-2xl border border-border text-center`}>
            <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div className="flex gap-2 border-b border-border">
        {(["TOUS", "EN_ATTENTE", "TRAITES"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-3 font-black text-xs uppercase tracking-widest transition-all ${
              filter === f ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {f === "TOUS" ? "Tous" : f === "EN_ATTENTE" ? "En attente" : "Traités"}
          </button>
        ))}
      </div>

      {/* Liste */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <ShieldAlert className="w-16 h-16 mb-4 opacity-20" />
          <p className="font-black uppercase tracking-widest text-xs">Aucun signalement</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(s => (
            <Card key={s.id} className="rounded-[24px] border border-border hover:shadow-lg transition-all">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap gap-2 items-center">
                      {s.is_reviewed ? (
                        <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-500/20 text-[10px] font-black">
                          <CheckCircle2 size={10} className="mr-1" /> Traité
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-500/10 text-amber-700 border-amber-500/20 text-[10px] font-black">
                          <AlertTriangle size={10} className="mr-1" /> En attente
                        </Badge>
                      )}
                      {s.commune_detail && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground">
                          <MapPin size={11} /> {s.commune_detail.nom}
                        </span>
                      )}
                      {s.nb_preuves > 0 && (
                        <Badge className="bg-purple-500/10 text-purple-700 border-purple-500/20 text-[10px] font-black">
                          📎 {s.nb_preuves} preuve(s) IPFS
                        </Badge>
                      )}
                    </div>

                    <h3 className="font-black text-foreground">{s.sujet}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">{s.description}</p>

                    <div className="flex flex-wrap items-center gap-4 pt-1 text-[10px] text-muted-foreground font-bold">
                      <span className="flex items-center gap-1">
                        <Clock size={11} /> {formatDateShort(s.created_at)}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare size={11} />
                        {s.commentaires?.length ?? 0} commentaire{(s.commentaires?.length ?? 0) > 1 ? "s" : ""}
                      </span>
                      <span>{s.nb_votes} vote(s) • {s.pct_credible}% crédible</span>
                    </div>
                  </div>

                  <Link href={`/commune/signalements/${s.id}`}>
                    <Button variant="outline" className="rounded-xl h-9 px-4 text-[10px] font-bold shrink-0">
                      <ExternalLink size={12} className="mr-1" /> Voir & Commenter
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
