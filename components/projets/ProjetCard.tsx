"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatFCFA, polygonscanTxUrl } from "@/lib/constants";
import { Building2, Activity, ExternalLink, ShieldCheck, Target } from "lucide-react";
import { motion } from "framer-motion";

interface ProjetCardProps {
  projet: {
    id: string | number;
    nom: string;
    description: string;
    budget_alloue_fcfa: number;
    taux_execution: number;
    statut: string;
    commune_nom?: string;
    blockchain_audit_hash?: string;
  };
}

const STATUT_STYLES: Record<string, string> = {
  EN_COURS: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  ACHEVE: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  SOUS_ENQUETE: "bg-rose-500/10 text-rose-600 border-rose-500/20",
  EN_ATTENTE: "bg-amber-500/10 text-amber-600 border-amber-500/20",
};

export function ProjetCard({ projet }: ProjetCardProps) {
  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 15 }}
    >
      <Card className="h-full group relative border-none bg-gradient-to-b from-card to-muted/20 shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden">
        {/* Glow effect on hover */}
        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <CardHeader className="relative pb-2 space-y-4 p-7">
          <div className="flex items-start justify-between">
            <Badge className={`rounded-full px-4 py-1 font-black text-[10px] uppercase tracking-wider border-none shadow-sm ${STATUT_STYLES[projet.statut] || "bg-muted text-muted-foreground"}`}>
              {projet.statut.replace('_', ' ')}
            </Badge>
            <div className="flex items-center gap-2 px-3 py-1 bg-background/50 backdrop-blur-md rounded-full border border-border/50">
              <Building2 className="w-3.5 h-3.5 text-primary" />
              <span className="text-[10px] font-black uppercase tracking-widest text-foreground/70">
                {projet.commune_nom || "Municipality"}
              </span>
            </div>
          </div>
          
          <div className="space-y-1">
            <CardTitle className="text-xl font-black leading-tight tracking-tight text-foreground group-hover:text-primary transition-colors italic uppercase">
              {projet.nom}
            </CardTitle>
            <div className="flex items-center gap-2 text-primary/60 font-bold text-[10px] uppercase tracking-widest">
              <Target size={12} />
              Priorité Communautaire
            </div>
          </div>
        </CardHeader>

        <CardContent className="relative space-y-8 p-7 pt-0">
          <p className="text-sm text-muted-foreground font-medium leading-relaxed line-clamp-3">
            {projet.description}
          </p>

          {/* Progress Section */}
          <div className="space-y-3">
            <div className="flex justify-between items-end">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Exécution Physique</p>
                <p className="text-2xl font-black text-foreground italic">{projet.taux_execution}%</p>
              </div>
              <div className="p-2 bg-primary/10 rounded-xl text-primary">
                <Activity size={20} />
              </div>
            </div>
            <div className="h-3 w-full bg-muted/50 rounded-full overflow-hidden border border-border/30 p-[2px]">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${projet.taux_execution}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-primary to-blue-600 rounded-full shadow-[0_0_12px_rgba(var(--primary),0.5)]"
              />
            </div>
          </div>

          {/* Budget & Blockchain */}
          <div className="pt-6 border-t border-border/50 grid grid-cols-2 gap-6">
            <div className="space-y-1">
              <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Budget Alloué</span>
              <p className="text-sm font-black text-foreground">{formatFCFA(projet.budget_alloue_fcfa)}</p>
            </div>
            <div className="space-y-1 text-right">
              <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Transparence</span>
              <div className="flex items-center justify-end gap-1.5 text-emerald-600 font-black text-[10px] uppercase tracking-tighter">
                <ShieldCheck size={14} />
                Certifié On-Chain
              </div>
            </div>
          </div>

          {projet.blockchain_audit_hash && (
            <a 
              href={polygonscanTxUrl(projet.blockchain_audit_hash)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-foreground text-background hover:bg-primary hover:text-white transition-all duration-300 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-foreground/5"
            >
              Vérifier l'audit blockchain <ExternalLink size={12} />
            </a>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
