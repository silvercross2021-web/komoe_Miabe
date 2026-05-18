"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SectionCommentaires } from "@/components/ui/SectionCommentaires";
import {
  ArrowLeft, AlertTriangle, MapPin, Calendar, Users,
  Loader2, CheckCircle2, ShieldAlert,
  ThumbsUp, ThumbsDown, Search as SearchIcon, Gavel, X,
  Flame, FileSearch, FileText, Activity, Link as LinkIcon,
  ChevronRight, MessageSquare, TrendingUp, Sparkles,
} from "lucide-react";
import { signalementsApi, type Signalement } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { pushToast } from "@/lib/toast";
import { emitDataChange } from "@/lib/dataEvents";

const STATUT_META: Record<string, { label: string; icon: any; bg: string; text: string; border: string; gradient: string; }> = {
  NOUVEAU:       { label: "Nouveau",            icon: AlertTriangle, bg: "bg-blue-500/10",    text: "text-blue-600",    border: "border-blue-500/30",    gradient: "from-blue-500/20 to-blue-500/5" },
  VIRAL:         { label: "Viral",              icon: Flame,         bg: "bg-amber-500/10",   text: "text-amber-600",   border: "border-amber-500/30",   gradient: "from-amber-500/20 to-amber-500/5" },
  ENQUETE_DGDDL: { label: "Enquete en cours",   icon: FileSearch,    bg: "bg-orange-500/10",  text: "text-orange-600",  border: "border-orange-500/30",  gradient: "from-orange-500/20 to-orange-500/5" },
  VALIDE_FRAUDE: { label: "Fraude confirmee",   icon: ShieldAlert,   bg: "bg-red-500/10",     text: "text-red-600",     border: "border-red-500/30",     gradient: "from-red-500/20 to-red-500/5" },
  REJETE_FAUX:   { label: "Faux signalement",   icon: Gavel,         bg: "bg-zinc-500/10",    text: "text-zinc-600",    border: "border-zinc-500/30",    gradient: "from-zinc-500/20 to-zinc-500/5" },
  CLOS:          { label: "Clos",               icon: CheckCircle2,  bg: "bg-emerald-500/10", text: "text-emerald-600", border: "border-emerald-500/30", gradient: "from-emerald-500/20 to-emerald-500/5" },
};

const PRE_ENQUETE_STATUTS = ["NOUVEAU", "VIRAL"];

// Indicateur de progression du dossier
function getProgressionStep(statut: string): { step: 1 | 2 | 3; label: string } {
  if (statut === "NOUVEAU" || statut === "VIRAL") return { step: 1, label: "En attente d'audit" };
  if (statut === "ENQUETE_DGDDL") return { step: 2, label: "Enquete en cours" };
  return { step: 3, label: "Cloture" };
}

export default function ControleSignalementDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { user, refreshUser } = useAuth();
  const [signalement, setSignalement] = useState<Signalement | null>(null);
  const [loading, setLoading] = useState(true);
  const [votingId, setVotingId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showResoudreForm, setShowResoudreForm] = useState(false);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [resolution, setResolution] = useState<"FRAUDE" | "FAUX" | "INFONDE">("INFONDE");
  const [justification, setJustification] = useState("");
  const [montantCorrige, setMontantCorrige] = useState("");
  const [noteEnquete, setNoteEnquete] = useState("");

  const fetchSignalement = async () => {
    try {
      const sig = await signalementsApi.detail(id);
      setSignalement(sig);
    } catch {
      setSignalement(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSignalement();
  }, [id]);

  const handleLancerEnquete = async () => {
    // Protection double-clic
    if (actionLoading) return;
    if (!confirm("Confirmer le lancement d'une enquête formelle sur ce signalement ?")) return;
    setActionLoading(true);
    try {
      await signalementsApi.lancerEnquete(id);
      await fetchSignalement();
      pushToast({
        title: "Enquête lancée",
        description: "Le dossier d'audit est ouvert et tracé sur la blockchain.",
        variant: "success",
      });
      emitDataChange("signalement");
    } catch (err: any) {
      pushToast({
        title: "Impossible de lancer l'enquête",
        description: err?.message || "Erreur inconnue. Réessayez dans un instant.",
        variant: "danger",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleResoudreEnquete = async (e: React.FormEvent) => {
    e.preventDefault();
    // Protection double-clic
    if (actionLoading) return;
    if (!justification.trim()) {
      pushToast({
        title: "Justification obligatoire",
        description: "Vous devez justifier le verdict avant publication.",
        variant: "warning",
      });
      return;
    }
    setActionLoading(true);
    try {
      await signalementsApi.resoudreEnquete(id, {
        resolution,
        justification,
        montant_corrige: resolution === "FRAUDE" && montantCorrige ? Number(montantCorrige) : undefined,
      });
      setShowResoudreForm(false);
      setJustification("");
      setMontantCorrige("");
      await fetchSignalement();
      refreshUser();
      pushToast({
        title: "Verdict publié",
        description: `Le verdict ${resolution} a été scellé sur la blockchain et notifié à tous les acteurs.`,
        variant: "success",
        duration: 7000,
      });
      emitDataChange("signalement");
      // Si la TX a été corrigée (cas FRAUDE), invalider aussi les caches transaction
      if (resolution === "FRAUDE") emitDataChange("transaction");
    } catch (err: any) {
      pushToast({
        title: "Échec de la publication du verdict",
        description: err?.message || "Le verdict n'a pas pu être enregistré. Le signalement est peut-être déjà clôturé.",
        variant: "danger",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (actionLoading) return;
    if (!noteEnquete.trim()) return;
    setActionLoading(true);
    try {
      await signalementsApi.ajouterNoteEnquete(id, noteEnquete);
      setNoteEnquete("");
      setShowNoteForm(false);
      await fetchSignalement();
      pushToast({
        title: "Note d'audit ajoutée",
        description: "Votre observation est visible publiquement dans la timeline.",
        variant: "info",
      });
      emitDataChange("signalement");
    } catch (err: any) {
      pushToast({
        title: "Impossible d'enregistrer la note",
        description: err?.message || "Erreur inconnue.",
        variant: "danger",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleVote = async (verdict: "CREDIBLE" | "INFONDE") => {
    if (!signalement) return;
    const label = verdict === "CREDIBLE" ? "CRÉDIBLE" : "INFONDÉ";
    if (!confirm(`Êtes-vous certain que ce signalement est ${label} ?\n\nCette action est irréversible.`)) return;
    
    setVotingId(verdict);
    const oldSignalement = { ...signalement };
    const newSignalement = { ...signalement };
    const oldVote = signalement.mon_vote;

    // Mise à jour optimiste
    if (verdict === "CREDIBLE") {
      newSignalement.nb_credibles += 1;
      if (oldVote === "INFONDE") newSignalement.nb_infondes -= 1;
    } else {
      newSignalement.nb_infondes += 1;
      if (oldVote === "CREDIBLE") newSignalement.nb_credibles -= 1;
    }
    newSignalement.nb_votes = newSignalement.nb_credibles + newSignalement.nb_infondes;
    newSignalement.pct_credible = newSignalement.nb_votes > 0 
      ? Math.round((newSignalement.nb_credibles / newSignalement.nb_votes) * 100) 
      : 0;
    newSignalement.mon_vote = verdict;
    setSignalement(newSignalement);

    try {
      await signalementsApi.voter(id, verdict);
      const fresh = await signalementsApi.detail(id);
      setSignalement(fresh);
    } catch (err: any) {
      setSignalement(oldSignalement);
      pushToast({
        title: "Vote non enregistré",
        description: err?.message || "Réessayez dans un instant.",
        variant: "danger",
      });
    } finally {
      setVotingId(null);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-32 gap-4">
      <Loader2 className="w-10 h-10 animate-spin text-primary" />
      <p className="text-sm font-black uppercase tracking-widest text-muted-foreground">Chargement du signalement...</p>
    </div>
  );

  if (!signalement) return (
    <div className="max-w-2xl mx-auto py-20 text-center">
      <div className="bg-red-50 dark:bg-red-500/5 p-8 rounded-[32px] border border-red-100 dark:border-red-500/20">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-black text-foreground">Signalement introuvable</h3>
        <Link href="/controle/signalements">
          <Button className="mt-6">Retour</Button>
        </Link>
      </div>
    </div>
  );

  const statutKey = signalement.statut ?? "NOUVEAU";
  const meta = STATUT_META[statutKey] ?? STATUT_META.NOUVEAU;
  const StatusIcon = meta.icon;
  const isDgddl = user?.role === "DGDDL";
  const canLancerEnquete = PRE_ENQUETE_STATUTS.includes(statutKey);
  // Le vote citoyen "Credible/Infonde" n'est PAS destine au DGDDL :
  // le DGDDL n'a pas a se prononcer democratiquement, il lance directement une enquete officielle.
  const canVoterCredibilite = !isDgddl && PRE_ENQUETE_STATUTS.includes(statutKey) && !signalement.is_reviewed;
  const progression = getProgressionStep(statutKey);

  return (
    <div className="animate-in fade-in duration-500 max-w-5xl mx-auto pb-12">
      {/* Breadcrumb / Back */}
      <Link
        href="/controle/signalements"
        className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-primary mb-8 transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
        Retour aux signalements
      </Link>

      {/* ════════ HERO HEADER ════════ */}
      <div className={`relative overflow-hidden rounded-[32px] border ${meta.border} bg-gradient-to-br ${meta.gradient} backdrop-blur-xl p-8 mb-8`}>
        {/* Decorations en arriere-plan */}
        <div className={`absolute -top-20 -right-20 w-64 h-64 ${meta.bg} rounded-full blur-3xl opacity-50 pointer-events-none`} />
        <div className="absolute top-4 right-4 opacity-[0.04] pointer-events-none">
          <StatusIcon className="w-40 h-40" />
        </div>

        <div className="relative">
          {/* Badge statut + prioritaire en haut */}
          <div className="flex items-center gap-2 mb-5 flex-wrap">
            <span className={`inline-flex items-center gap-1.5 text-[10px] font-black px-3 py-1.5 rounded-full border-2 ${meta.bg} ${meta.text} ${meta.border}`}>
              <StatusIcon className="w-3 h-3" />
              {meta.label}
            </span>
            {signalement.is_prioritaire && (
              <span className="inline-flex items-center gap-1 text-[10px] font-black px-3 py-1.5 rounded-full border-2 border-red-500/30 bg-red-500/10 text-red-600 animate-pulse">
                <Sparkles className="w-3 h-3" />
                PRIORITAIRE
              </span>
            )}
          </div>

          {/* Titre */}
          <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight leading-tight mb-3">
            {signalement.sujet}
          </h1>

          {/* Meta info */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold text-muted-foreground mb-6">
            <span className="inline-flex items-center gap-1.5">
              <MapPin size={14} className="text-primary" />
              {signalement.commune_detail?.nom || "Commune inconnue"}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Calendar size={14} className="text-primary" />
              {new Date(signalement.created_at).toLocaleDateString("fr-FR", { dateStyle: "long" })}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Users size={14} className="text-primary" />
              {signalement.auteur_detail?.full_name || "Anonyme"}
            </span>
          </div>

          {/* Progression visuelle 3 etapes */}
          <div className="flex items-center gap-3 mb-6">
            {[1, 2, 3].map((step) => {
              const isActive = progression.step >= step;
              const isCurrent = progression.step === step;
              return (
                <div key={step} className="flex items-center gap-3 flex-1">
                  <div className={`flex flex-col items-center gap-1.5 flex-1`}>
                    <div className={`w-full h-1.5 rounded-full transition-all ${
                      isActive ? "bg-gradient-to-r from-primary to-primary/60" : "bg-muted"
                    } ${isCurrent ? "shadow-lg shadow-primary/30" : ""}`} />
                    <span className={`text-[9px] font-black uppercase tracking-wider ${
                      isCurrent ? meta.text : isActive ? "text-muted-foreground" : "text-muted-foreground/40"
                    }`}>
                      {step === 1 ? "Signale" : step === 2 ? "Audit" : "Cloture"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Stats compact */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-2xl p-3 text-center">
              <div className="flex items-center justify-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-500" />
                <span className="text-xl font-black text-foreground">{signalement.nb_votes ?? 0}</span>
              </div>
              <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Votes</span>
            </div>
            <div className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-2xl p-3 text-center">
              <div className="flex items-center justify-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-xl font-black text-emerald-600">{signalement.pct_credible ?? 0}%</span>
              </div>
              <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Credible</span>
            </div>
            <div className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-2xl p-3 text-center">
              <div className="flex items-center justify-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-purple-500" />
                <span className="text-xl font-black text-purple-600">{signalement.nb_preuves ?? 0}</span>
              </div>
              <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Preuves</span>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
        {/* ═══════ COLONNE GAUCHE : DETAILS + AUTEUR + TIMELINE ═══════ */}
        <div className="lg:col-span-3 space-y-6">
          {/* Card Description */}
          <Card className="border border-border/70 rounded-[28px] overflow-hidden bg-card shadow-sm">
            <CardContent className="p-7">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-base font-black text-foreground tracking-tight flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-primary" />
                  </div>
                  Details de l'incident
                </h3>
              </div>
              <div className="relative pl-5 border-l-2 border-primary/20">
                <div
                  className="prose prose-sm max-w-none text-foreground/90 leading-relaxed font-medium"
                  dangerouslySetInnerHTML={{ __html: signalement.description }}
                />
              </div>

              {/* Resolution si existante */}
              {signalement.resolution && (
                <div className={`mt-6 p-5 rounded-[20px] border ${
                  signalement.resolution === "FRAUDE"
                    ? "bg-red-500/5 border-red-500/30"
                    : signalement.resolution === "FAUX"
                    ? "bg-amber-500/5 border-amber-500/30"
                    : "bg-zinc-500/5 border-zinc-500/30"
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Gavel className={`w-4 h-4 ${
                      signalement.resolution === "FRAUDE" ? "text-red-600" :
                      signalement.resolution === "FAUX" ? "text-amber-600" : "text-zinc-600"
                    }`} />
                    <p className={`text-[10px] font-black uppercase tracking-widest ${
                      signalement.resolution === "FRAUDE" ? "text-red-600" :
                      signalement.resolution === "FAUX" ? "text-amber-600" : "text-zinc-600"
                    }`}>Verdict DGDDL : {signalement.resolution}</p>
                  </div>
                  {signalement.resolution_justification && (
                    <p className="text-sm text-foreground/90 leading-relaxed">{signalement.resolution_justification}</p>
                  )}
                  {signalement.blockchain_tx_hash_resolution && (
                    <>
                      <a
                        href={`https://amoy.polygonscan.com/tx/${signalement.blockchain_tx_hash_resolution}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 mt-3 text-[10px] font-black text-primary hover:underline"
                      >
                        <LinkIcon className="w-3 h-3" />
                        Preuve blockchain du verdict
                      </a>
                      {signalement.resolution_par_detail?.full_name && (
                        <p className="text-[9px] text-muted-foreground/70 italic mt-1 leading-snug">
                          Signe par le systeme KOMOE pour le compte du DGDDL{" "}
                          <span className="font-bold text-foreground/80">{signalement.resolution_par_detail.full_name}</span>
                          {signalement.resolution_par_detail.wallet_address && (
                            <> (wallet : <span className="font-mono">{signalement.resolution_par_detail.wallet_address.slice(0, 10)}…</span>)</>
                          )}
                        </p>
                      )}
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card Citoyen emetteur */}
          <Card className="border border-border/70 rounded-[28px] overflow-hidden bg-card shadow-sm">
            <CardContent className="p-6">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3">
                Citoyen emetteur
              </p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center text-primary font-black text-base">
                  {(signalement.auteur_detail?.full_name || "?").charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-foreground text-sm truncate">
                    {signalement.auteur_detail?.full_name || "Anonyme"}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-0.5">
                    {signalement.created_by_profession || "Citoyen"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card Transaction suspectee */}
          {signalement.transaction_detail && (
            <Card className="border border-border/70 rounded-[28px] overflow-hidden bg-card shadow-sm">
              <CardContent className="p-6">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Activity className="w-3 h-3" />
                  Transaction suspectee
                </p>
                <div className="p-5 bg-gradient-to-br from-primary/5 to-transparent rounded-[20px] border border-primary/10">
                  <p className="text-2xl font-black text-foreground tracking-tight">
                    {signalement.transaction_detail.montant_fcfa.toLocaleString()} <span className="text-sm font-bold text-muted-foreground">FCFA</span>
                  </p>
                  <p className="text-xs font-black text-primary uppercase mt-1 tracking-wider">
                    {signalement.transaction_detail.categorie}
                  </p>
                  <div className="mt-4 pt-4 border-t border-primary/10 flex items-center justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    <span>{new Date(signalement.transaction_detail.created_at).toLocaleDateString("fr-FR")}</span>
                    <span className="px-2 py-1 bg-primary/10 text-primary rounded-full">
                      {signalement.transaction_detail.statut}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Timeline d'audit DGDDL */}
          {signalement.actions_dgddl && signalement.actions_dgddl.length > 0 && (
            <Card className="border border-border/70 rounded-[28px] overflow-hidden bg-card shadow-sm">
              <CardContent className="p-7">
                <h4 className="text-base font-black text-foreground tracking-tight flex items-center gap-2.5 mb-6">
                  <div className="w-8 h-8 rounded-xl bg-orange-500/10 flex items-center justify-center">
                    <ShieldAlert className="w-4 h-4 text-orange-600" />
                  </div>
                  Timeline d'audit DGDDL
                </h4>
                <div className="relative space-y-5">
                  {signalement.actions_dgddl.map((action, idx) => {
                    const isLast = idx === (signalement.actions_dgddl?.length ?? 0) - 1;
                    return (
                      <div key={idx} className="relative pl-10">
                        {/* Ligne verticale */}
                        {!isLast && (
                          <div className="absolute left-3.5 top-7 bottom-[-20px] w-0.5 bg-gradient-to-b from-orange-500/30 to-orange-500/0" />
                        )}
                        {/* Puce */}
                        <div className="absolute left-0 top-0 w-7 h-7 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/30 border-2 border-background">
                          <ChevronRight className="w-3.5 h-3.5 text-white" />
                        </div>
                        <div className="bg-muted/30 dark:bg-muted/20 rounded-2xl p-4 border border-border/60">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className="text-[10px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-widest">
                              {action.effectuee_par_nom}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(action.created_at).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
                            </span>
                          </div>
                          <p className="text-sm text-foreground/90 leading-relaxed">
                            {action.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* ═══════ COLONNE DROITE : ACTIONS DGDDL / VOTE CITOYEN ═══════ */}
        <div className="lg:col-span-2 space-y-6 lg:sticky lg:top-6 lg:self-start">
          <Card className="relative border border-border/70 rounded-[28px] overflow-hidden bg-card shadow-lg">
            {/* Accent bar coloree en haut selon le statut */}
            <div className={`absolute top-0 left-0 right-0 h-1 ${meta.bg.replace('/10', '')}`} />

            <CardContent className="p-6">
              {/* En-tete : titre adapte au role */}
              <div className="flex items-center gap-2.5 mb-5">
                {isDgddl ? (
                  <>
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-md shadow-orange-500/30">
                      <ShieldAlert className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-foreground tracking-tight leading-none">Actions Controle</h3>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Reserve au DGDDL</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md shadow-blue-500/30">
                      <Users className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-foreground tracking-tight leading-none">Votre avis</h3>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Vote citoyen democratique</p>
                    </div>
                  </>
                )}
              </div>

              {/* Bandeau "Enquete lancee le ..." si statut ENQUETE_DGDDL */}
              {signalement.enquete_lancee_a && (
                <div className="mb-4 px-4 py-3 bg-orange-500/5 border border-orange-500/20 rounded-2xl flex items-center gap-2.5">
                  <Activity className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                  <p className="text-[10px] text-orange-700 dark:text-orange-300 font-bold">
                    Enquete lancee le {new Date(signalement.enquete_lancee_a).toLocaleDateString("fr-FR", { dateStyle: "long" })}
                  </p>
                </div>
              )}

              {/* ═══ ACTIONS RESERVEES AU DGDDL ═══ */}
              {isDgddl && (
                <div className="space-y-4 mb-4">
                  {/* ETAPE 1 : Lancer enquete formelle */}
                  {canLancerEnquete && (
                    <div className="relative p-5 bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-950/30 dark:to-orange-900/10 border border-orange-200/70 dark:border-orange-500/20 rounded-[24px] overflow-hidden">
                      <div className="absolute top-3 right-3 text-[9px] font-black uppercase tracking-widest text-orange-600/60 dark:text-orange-400/60">Etape 1</div>
                      <div className="flex items-start gap-3 mb-4">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/30 shrink-0">
                          <ShieldAlert className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="text-[11px] font-black uppercase text-orange-700 dark:text-orange-300 tracking-wider">Action requise</p>
                          <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                            Ouvrez un dossier d'audit public ancre sur la blockchain. Le Maire sera notifie automatiquement.
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={handleLancerEnquete}
                        disabled={actionLoading}
                        className="w-full bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-[16px] h-12 font-black uppercase shadow-lg shadow-orange-500/30 transition-all hover:scale-[1.01]"
                      >
                        {actionLoading ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <SearchIcon className="w-4 h-4 mr-2" />}
                        Lancer une enquete formelle
                      </Button>
                    </div>
                  )}

                  {/* ETAPE 2 : Pendant l'enquete (notes + verdict) */}
                  {statutKey === "ENQUETE_DGDDL" && !showNoteForm && !showResoudreForm && (
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        onClick={() => setShowNoteForm(true)}
                        variant="outline"
                        className="rounded-[16px] h-14 font-black uppercase text-[10px] border-2 border-primary/30 text-primary hover:bg-primary/5 flex flex-col gap-1"
                      >
                        <span className="text-base">📝</span>
                        Note d'audit
                      </Button>
                      <Button
                        onClick={() => setShowResoudreForm(true)}
                        disabled={actionLoading}
                        className="bg-gradient-to-br from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 text-white rounded-[16px] h-14 font-black uppercase text-[10px] shadow-lg shadow-purple-500/30 flex flex-col gap-1"
                      >
                        <Gavel className="w-4 h-4" />
                        Verdict
                      </Button>
                    </div>
                  )}

                  {/* Formulaire note */}
                  {showNoteForm && (
                    <form onSubmit={handleAddNote} className="space-y-3 p-4 bg-primary/5 rounded-[20px] border border-primary/20 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-black uppercase tracking-widest text-primary">Nouvelle note d'audit</p>
                        <button type="button" onClick={() => setShowNoteForm(false)}>
                          <X size={14} className="text-muted-foreground hover:text-foreground" />
                        </button>
                      </div>
                      <textarea
                        value={noteEnquete}
                        onChange={e => setNoteEnquete(e.target.value)}
                        placeholder="Observation d'enquete (visible publiquement)..."
                        rows={3}
                        required
                        className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                      />
                      <Button type="submit" disabled={actionLoading} className="w-full rounded-xl h-10 font-black uppercase text-[10px]">
                        {actionLoading ? <Loader2 className="animate-spin w-3 h-3 mr-2" /> : null}
                        Enregistrer la note
                      </Button>
                    </form>
                  )}

                  {/* Formulaire résolution */}
                  {showResoudreForm && (
                    <form onSubmit={handleResoudreEnquete} className="space-y-3 p-4 bg-purple-500/5 rounded-[20px] border border-purple-200 dark:border-purple-500/20 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-purple-700 dark:text-purple-300">Verdict officiel DGDDL</p>
                        <button type="button" onClick={() => setShowResoudreForm(false)}>
                          <X size={14} className="text-muted-foreground hover:text-foreground" />
                        </button>
                      </div>
                      <select
                        value={resolution}
                        onChange={e => setResolution(e.target.value as any)}
                        className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="FRAUDE">FRAUDE - Confirmee</option>
                        <option value="FAUX">FAUX - Signalement abusif</option>
                        <option value="INFONDE">INFONDE - Classe sans suite</option>
                      </select>

                      {resolution === "FRAUDE" && (
                        <div className="animate-in slide-in-from-top-2 duration-300">
                          <label className="text-[9px] font-black text-red-600 uppercase mb-1 block">Montant de correction (FCFA)</label>
                          <input
                            type="number"
                            value={montantCorrige}
                            onChange={e => setMontantCorrige(e.target.value)}
                            placeholder="Montant a regulariser..."
                            className="w-full px-3 py-2 bg-red-500/5 border border-red-200 rounded-xl text-sm font-black text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                          />
                        </div>
                      )}

                      <textarea
                        value={justification}
                        onChange={e => setJustification(e.target.value)}
                        placeholder="Justification d'audit obligatoire (visible publiquement)..."
                        rows={3}
                        required
                        className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                      />
                      <Button
                        type="submit"
                        disabled={actionLoading || !justification.trim()}
                        className="w-full bg-gradient-to-br from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 text-white font-black rounded-xl h-11"
                      >
                        {actionLoading ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Gavel className="w-4 h-4 mr-2" />}
                        Publier le verdict officiel
                      </Button>
                    </form>
                  )}

                  {/* Message neutre quand aucune action n'est dispo (statut terminal) */}
                  {!canLancerEnquete && statutKey !== "ENQUETE_DGDDL" && !showNoteForm && !showResoudreForm && (
                    <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-[20px] border border-border">
                      <CheckCircle2 className="text-muted-foreground shrink-0" size={18} />
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Aucune action DGDDL en attente. Le dossier est cloture ou n'est pas dans une phase active.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* ═══ VOTE CITOYEN (non-DGDDL uniquement) ═══ */}
              {canVoterCredibilite && (
                <div className="space-y-3 mb-4 pt-4 border-t border-border/50">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500/15 to-blue-500/5 flex items-center justify-center shrink-0">
                      <Users className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-[11px] font-black uppercase text-blue-700 dark:text-blue-300 tracking-wider">Vote de credibilite</p>
                      <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                        Donnez votre avis citoyen. {signalement.nb_votes ?? 0} vote(s) deja enregistre(s).
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleVote("CREDIBLE")}
                      disabled={!!votingId}
                      className={`flex-1 rounded-[16px] h-11 font-black text-xs uppercase border-2 transition-all ${
                        signalement.mon_vote === "CREDIBLE"
                          ? "bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-500/30"
                          : "bg-transparent border-emerald-600/30 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                      }`}
                    >
                      {votingId === "CREDIBLE" ? <Loader2 className="animate-spin w-3 h-3 mr-1" /> : <ThumbsUp className="w-3 h-3 mr-1" />}
                      Credible
                    </Button>
                    <Button
                      onClick={() => handleVote("INFONDE")}
                      disabled={!!votingId}
                      className={`flex-1 rounded-[16px] h-11 font-black text-xs uppercase border-2 transition-all ${
                        signalement.mon_vote === "INFONDE"
                          ? "bg-rose-600 border-rose-600 text-white shadow-lg shadow-rose-500/30"
                          : "bg-transparent border-rose-600/30 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                      }`}
                    >
                      {votingId === "INFONDE" ? <Loader2 className="animate-spin w-3 h-3 mr-1" /> : <ThumbsDown className="w-3 h-3 mr-1" />}
                      Infonde
                    </Button>
                  </div>
                </div>
              )}

              {/* ═══ BADGES STATUT TERMINAL ═══ */}
              {statutKey === "VALIDE_FRAUDE" && (
                <div className="flex items-center gap-3 p-4 bg-red-500/10 rounded-2xl border border-red-500/30">
                  <div className="w-9 h-9 rounded-xl bg-red-500/20 flex items-center justify-center shrink-0">
                    <ShieldAlert className="text-red-600" size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-red-700 dark:text-red-300 uppercase">Fraude confirmee</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Dossier valide par le DGDDL</p>
                  </div>
                </div>
              )}

              {(statutKey === "CLOS" || statutKey === "REJETE_FAUX") && (
                <div className="flex items-center gap-3 p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/30">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="text-emerald-600" size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-emerald-700 dark:text-emerald-300 uppercase">Dossier clos</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Aucune action requise</p>
                  </div>
                </div>
              )}

              {/* Footer subtil */}
              <div className="mt-5 pt-4 border-t border-border/50">
                <p className="text-[10px] text-muted-foreground/80 leading-relaxed text-center">
                  Toutes les actions DGDDL sont publiques et ancrees sur la blockchain.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ════════ SECTION COMMENTAIRES ════════ */}
      <div className="mt-8">
        <div className="flex items-center gap-3 mb-5 px-2">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-black text-foreground tracking-tight">Conversation publique</h3>
            <p className="text-xs text-muted-foreground">Discussion ouverte autour du signalement</p>
          </div>
        </div>
        <SectionCommentaires
          signalementId={id}
          commentairesInitiaux={signalement.commentaires ?? []}
        />
      </div>
    </div>
  );
}
