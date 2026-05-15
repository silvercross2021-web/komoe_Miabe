"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { projetsApi, type Projet } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { 
  Building2, 
  Activity, 
  Target, 
  ShieldCheck, 
  ChevronLeft, 
  Loader2, 
  ExternalLink,
  Calendar,
  Wallet,
  ArrowRight,
  TrendingUp,
  Award
} from "lucide-react";
import { formatFCFA, formatDateShort, polygonscanTxUrl } from "@/lib/constants";
import { motion } from "framer-motion";
import Link from "next/link";

export default function PublicProjetDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [projet, setProjet] = useState<Projet | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjet = async () => {
      try {
        const data = await projetsApi.getDetail(id as string);
        setProjet(data);
      } catch (err) {
        console.error("Erreur chargement projet:", err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchProjet();
  }, [id]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Loader2 className="w-10 h-10 animate-spin text-primary" />
      <p className="text-sm font-black uppercase tracking-widest text-muted-foreground italic">Vérification de l'intégrité du projet...</p>
    </div>
  );

  if (!projet) return (
    <div className="text-center py-20">
      <h2 className="text-2xl font-black text-foreground italic uppercase">Projet introuvable</h2>
      <Button onClick={() => router.back()} variant="ghost" className="mt-4">Retour</Button>
    </div>
  );

  const consommePct = Math.min(100, (projet.budget_consomme_fcfa / projet.budget_alloue_fcfa) * 100);

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-32 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-4">
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-black uppercase text-[10px] tracking-[0.2em]"
          >
            <ChevronLeft size={14} /> Retour à la liste
          </button>
          
          <div className="flex items-center gap-3">
             <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 rounded-full px-4 py-1 font-black text-[10px] uppercase">
               Projet en cours
             </Badge>
             <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
               {projet.commune_detail?.nom} • Lancé le {formatDateShort(projet.created_at)}
             </span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-black text-foreground tracking-tighter uppercase italic leading-none">
            {projet.nom}
          </h1>
        </div>

        <div className="shrink-0">
          <Card className="bg-foreground text-background rounded-[32px] p-6 shadow-2xl">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-background/50 uppercase tracking-[0.2em]">Budget Investi</p>
              <p className="text-3xl font-black italic">{formatFCFA(projet.budget_alloue_fcfa)}</p>
            </div>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Physical Progress Card */}
        <Card className="lg:col-span-2 rounded-[48px] border-border bg-card shadow-xl overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-700">
             <Activity size={240} />
          </div>
          
          <div className="p-10 md:p-14 space-y-12 relative">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Avancement Physique</h3>
                <p className="text-6xl font-black text-primary italic leading-none">{projet.taux_execution}%</p>
              </div>
              <div className="p-6 bg-primary/10 rounded-[32px] text-primary">
                <TrendingUp size={48} />
              </div>
            </div>

            <div className="space-y-4">
              <div className="h-6 w-full bg-muted rounded-full overflow-hidden p-1.5 border border-border/50">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${projet.taux_execution}%` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-primary via-blue-500 to-emerald-400 rounded-full shadow-lg shadow-primary/20"
                />
              </div>
              <div className="flex justify-between text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] italic px-2">
                <span>Phase de lancement</span>
                <span>En cours de réalisation</span>
                <span>Livraison imminente</span>
              </div>
            </div>

            <div className="pt-10 border-t border-border/50">
               <h4 className="text-sm font-black uppercase tracking-widest mb-4">À propos de cette réalisation</h4>
               <p className="text-xl leading-relaxed text-foreground/70 font-medium italic">
                 {projet.description}
               </p>
            </div>
          </div>
        </Card>

        {/* Sidebar */}
        <div className="space-y-8">
          {/* Financial Transparency */}
          <Card className="rounded-[40px] border-border bg-card shadow-lg p-8 space-y-8">
            <div className="flex items-center gap-3 text-foreground">
              <Wallet className="w-5 h-5 text-primary" />
              <h3 className="text-sm font-black uppercase tracking-widest">Suivi Financier</h3>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                  <span className="text-muted-foreground">Consommation Budgétaire</span>
                  <span className="text-foreground">{consommePct.toFixed(1)}%</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${consommePct}%` }}
                    className="h-full bg-foreground"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div className="p-4 bg-muted/50 rounded-2xl border border-border/50">
                  <p className="text-[9px] font-black text-muted-foreground uppercase mb-1">Dépensé Réellement</p>
                  <p className="text-lg font-black text-foreground">{formatFCFA(projet.budget_consomme_fcfa)}</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-2xl border border-border/50">
                  <p className="text-[9px] font-black text-muted-foreground uppercase mb-1">Budget Restant</p>
                  <p className="text-lg font-black text-foreground">{formatFCFA(projet.budget_alloue_fcfa - projet.budget_consomme_fcfa)}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Citizen Origin */}
          {projet.parent_proposition && (
            <Card className="rounded-[40px] border-primary/20 bg-primary/5 shadow-lg p-8 relative overflow-hidden group">
               <div className="absolute -right-4 -bottom-4 text-primary/10 group-hover:rotate-12 transition-transform duration-500">
                  <Award size={120} />
               </div>
               <div className="relative space-y-4">
                  <h3 className="text-sm font-black uppercase tracking-widest text-primary italic">Origine Citoyenne</h3>
                  <p className="text-xs font-medium text-primary/70 leading-relaxed">
                    Ce projet est né d'une proposition citoyenne votée par la communauté sur KOMOE.
                  </p>
                  <Link href={`/public/engagements/proposition/${projet.parent_proposition}`}>
                    <Button variant="outline" className="w-full mt-4 rounded-2xl border-primary/30 text-primary font-black uppercase text-[10px] tracking-widest h-12 bg-white/50 backdrop-blur-sm">
                       Voir la proposition initiale <ArrowRight size={14} className="ml-2" />
                    </Button>
                  </Link>
               </div>
            </Card>
          )}

          {/* Blockchain Audit */}
          <Card className="rounded-[40px] border-border bg-card shadow-lg p-8 space-y-6">
            <div className="flex items-center gap-3 text-emerald-600">
               <ShieldCheck className="w-5 h-5" />
               <h3 className="text-sm font-black uppercase tracking-widest">Preuve Blockchain</h3>
            </div>
            <p className="text-xs text-muted-foreground font-medium leading-relaxed">
              Toutes les transactions financières de ce projet sont ancrées sur Polygon pour garantir qu'aucun franc n'est détourné.
            </p>
            {projet.blockchain_audit_hash && (
              <a 
                href={polygonscanTxUrl(projet.blockchain_audit_hash)}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-muted text-foreground hover:bg-foreground hover:text-background transition-all font-black text-[10px] uppercase tracking-widest border border-border"
              >
                Vérifier l'audit <ExternalLink size={14} />
              </a>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
