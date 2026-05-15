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
} from "lucide-react";
import { signalementsApi, type Signalement } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

const STATUT_STYLES: Record<string, string> = {
  ACTIF:           "bg-blue-500/10 text-blue-700 border-blue-200",
  ENQUETE_DGDDL:   "bg-orange-500/10 text-orange-700 border-orange-200",
  VALIDE_FRAUDE:   "bg-red-500/10 text-red-700 border-red-200",
  RESOLU:          "bg-emerald-500/10 text-emerald-700 border-emerald-200",
  CLASSE_SANS_SUITE: "bg-gray-500/10 text-gray-700 border-gray-200",
};

export default function ControleSignalementDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { user } = useAuth();
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
    if (!confirm("Confirmer le lancement d'une enquête formelle sur ce signalement ?")) return;
    setActionLoading(true);
    try {
      await signalementsApi.lancerEnquete(id);
      fetchSignalement();
    } catch (err: any) {
      alert("Erreur : " + (err.message || "Échec"));
    } finally {
      setActionLoading(false);
    }
  };

  const handleResoudreEnquete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!justification.trim()) { alert("La justification est obligatoire."); return; }
    setActionLoading(true);
    try {
      await signalementsApi.resoudreEnquete(id, { 
        resolution, 
        justification, 
        montant_corrige: resolution === "FRAUDE" && montantCorrige ? Number(montantCorrige) : undefined 
      });
      setShowResoudreForm(false);
      setJustification("");
      setMontantCorrige("");
      fetchSignalement();
    } catch (err: any) {
      alert("Erreur : " + (err.message || "Échec"));
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteEnquete.trim()) return;
    setActionLoading(true);
    try {
      await signalementsApi.ajouterNoteEnquete(id, noteEnquete);
      setNoteEnquete("");
      setShowNoteForm(false);
      fetchSignalement();
    } catch (err: any) {
      alert("Erreur : " + (err.message || "Échec"));
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
      alert("Erreur vote : " + (err.message || "Échec"));
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

  const statutStyle = STATUT_STYLES[signalement.statut ?? "ACTIF"] ?? STATUT_STYLES.ACTIF;

  return (
    <div className="animate-in fade-in duration-500 max-w-4xl mx-auto pb-12">
      <Link
        href="/controle/signalements"
        className="inline-flex items-center text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-primary mb-10 transition-colors"
      >
        <ArrowLeft className="w-5 h-5 mr-2" /> Retour aux signalements
      </Link>

      {/* En-tête */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-12">
        <div className="space-y-4">
          <div className="flex items-center gap-4 flex-wrap">
            <h2 className="text-4xl font-black text-foreground tracking-tight uppercase italic">
              {signalement.sujet}
            </h2>
            <span className={`text-[10px] font-black px-3 py-1 rounded-full border ${statutStyle}`}>
              {signalement.statut ?? "ACTIF"}
            </span>
            {signalement.is_prioritaire && (
              <Badge className="bg-amber-500/10 text-amber-700 border-amber-200 text-[10px] font-black">
                ⭐ Prioritaire
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-6 text-muted-foreground font-bold text-xs uppercase tracking-widest italic">
            <span className="flex items-center gap-2">
              <MapPin size={16} className="text-primary" />
              {signalement.commune_detail?.nom || "Non précisé"}
            </span>
            <span className="flex items-center gap-2">
              <Calendar size={16} className="text-primary" />
              {new Date(signalement.created_at).toLocaleDateString("fr-FR", { dateStyle: "long" })}
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-4 shrink-0">
          <div className="flex flex-col items-center p-5 bg-primary/5 rounded-[24px] border border-primary/10 min-w-[90px]">
            <span className="text-3xl font-black text-primary">{signalement.nb_votes}</span>
            <span className="text-[9px] font-black text-primary/60 uppercase tracking-widest mt-1">Votes</span>
          </div>
          <div className="flex flex-col items-center p-5 bg-emerald-500/10 rounded-[24px] border border-emerald-200 min-w-[90px]">
            <span className="text-3xl font-black text-emerald-600">{signalement.pct_credible}%</span>
            <span className="text-[9px] font-black text-emerald-600/70 uppercase tracking-widest mt-1">Crédible</span>
          </div>
          <div className="flex flex-col items-center p-5 bg-purple-500/10 rounded-[24px] border border-purple-200 min-w-[90px]">
            <span className="text-3xl font-black text-purple-600">{signalement.nb_preuves}</span>
            <span className="text-[9px] font-black text-purple-600/70 uppercase tracking-widest mt-1">Preuves</span>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mb-8">
        {/* Détails */}
        <Card className="lg:col-span-3 shadow-2xl border-border rounded-[40px] overflow-hidden border bg-card/50 backdrop-blur-xl">
          <CardContent className="p-10">
            <h3 className="text-xl font-black text-foreground mb-8 uppercase tracking-tight italic flex items-center gap-3">
              <Users className="text-primary" size={20} /> Détails de l'incident
            </h3>
            <div
              className="prose prose-sm max-w-none text-muted-foreground leading-relaxed font-medium italic mb-10"
              dangerouslySetInnerHTML={{ __html: signalement.description }}
            />

            {/* Résolution si existante */}
            {signalement.resolution && (
              <div className="mt-6 p-5 bg-red-500/5 border border-red-500/20 rounded-[20px]">
                <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-2">Résolution</p>
                <p className="text-sm font-bold text-foreground">{signalement.resolution}</p>
                {signalement.resolution_justification && (
                  <p className="text-xs text-muted-foreground mt-2">{signalement.resolution_justification}</p>
                )}
              </div>
            )}

            {/* Auteur */}
            <div className="pt-8 border-t border-border mt-8">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4 italic">
                Citoyen émetteur
              </p>
              <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-[24px] border border-border">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                  <Users size={24} />
                </div>
                <div>
                  <p className="font-black text-foreground uppercase text-xs">
                    {signalement.auteur_detail?.full_name || "Anonyme"}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-bold italic capitalize">
                    {signalement.created_by_profession?.toLowerCase() || "Citoyen"}
                  </p>
                </div>
              </div>
            </div>

            {/* Timeline d'Audit DGDDL */}
            {signalement.actions_dgddl && signalement.actions_dgddl.length > 0 && (
              <div className="mt-12 pt-8 border-t border-border">
                <h4 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2">
                  <ShieldAlert className="text-primary w-4 h-4" /> Timeline d'Audit DGDDL
                </h4>
                <div className="space-y-6">
                  {signalement.actions_dgddl.map((action, idx) => (
                    <div key={idx} className="relative pl-6 border-l-2 border-primary/20 pb-2">
                      <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-primary border-2 border-background" />
                      <p className="text-[10px] font-black text-primary uppercase mb-1">
                        {new Date(action.created_at).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })} — {action.effectuee_par_nom}
                      </p>
                      <p className="text-xs font-bold text-foreground bg-muted/20 p-3 rounded-xl border border-border/50">
                        {action.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions DGDDL */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-2xl border-border rounded-[40px] overflow-hidden border bg-card/50 backdrop-blur-xl">
            <CardContent className="p-10">
              <h3 className="text-xl font-black text-foreground mb-6 uppercase tracking-tight italic flex items-center gap-3">
                <ShieldAlert className="text-primary" size={20} /> Actions Contrôle
              </h3>

              {/* Statut enquête */}
              {signalement.enquete_lancee_a && (
                <div className="mb-4 p-4 bg-orange-500/10 rounded-[20px] border border-orange-200">
                  <p className="text-[10px] font-black text-orange-700 uppercase tracking-widest mb-1">Enquête en cours</p>
                  <p className="text-xs text-orange-600">
                    Lancée le {new Date(signalement.enquete_lancee_a).toLocaleDateString("fr-FR", { dateStyle: "long" })}
                  </p>
                </div>
              )}

              {/* Résolution affichée */}
              {signalement.resolution && (
                <div className={`mb-4 p-4 rounded-[20px] border ${
                  signalement.resolution === "FRAUDE"
                    ? "bg-red-500/10 border-red-200"
                    : signalement.resolution === "FAUX"
                    ? "bg-amber-500/10 border-amber-200"
                    : "bg-gray-500/10 border-gray-200"
                }`}>
                  <p className="text-[10px] font-black uppercase tracking-widest mb-1">
                    Résolution : {signalement.resolution}
                  </p>
                  {signalement.resolution_justification && (
                    <p className="text-xs mt-1">{signalement.resolution_justification}</p>
                  )}
                  {signalement.blockchain_tx_hash_resolution && (
                    <a 
                      href={`https://amoy.polygonscan.com/tx/${signalement.blockchain_tx_hash_resolution}`}
                      target="_blank"
                      className="text-[9px] font-black text-primary underline block mt-2"
                    >
                      Preuve Blockchain Verdict
                    </a>
                  )}
                </div>
              )}

              {/* Actions DGDDL */}
              {user?.role === "DGDDL" && (
                <div className="space-y-3 mb-4">
                  {/* Lancer enquête — disponible si statut ACTIF */}
                  {signalement.statut === "ACTIF" && (
                    <Button
                      onClick={handleLancerEnquete}
                      disabled={actionLoading}
                      className="w-full bg-orange-600 hover:bg-orange-700 text-white rounded-[20px] h-12 font-black uppercase shadow-lg shadow-orange-500/20"
                    >
                      {actionLoading ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <SearchIcon className="w-4 h-4 mr-2" />}
                      Lancer une enquête
                    </Button>
                  )}

                  {/* Ajouter une note d'enquête */}
                  {signalement.statut === "ENQUETE_DGDDL" && !showNoteForm && !showResoudreForm && (
                    <Button
                      onClick={() => setShowNoteForm(true)}
                      variant="outline"
                      className="w-full rounded-[20px] h-12 font-black uppercase border-primary/20 text-primary"
                    >
                      Ajouter une note d'audit
                    </Button>
                  )}

                  {showNoteForm && (
                    <form onSubmit={handleAddNote} className="space-y-3 p-4 bg-primary/5 rounded-[20px] border border-primary/20">
                      <textarea
                        value={noteEnquete}
                        onChange={e => setNoteEnquete(e.target.value)}
                        placeholder="Observation d'enquête..."
                        rows={3}
                        required
                        className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <div className="flex gap-2">
                        <Button type="submit" disabled={actionLoading} className="flex-1 rounded-xl h-10 font-black uppercase text-[10px]">
                          Enregistrer
                        </Button>
                        <Button type="button" variant="ghost" onClick={() => setShowNoteForm(false)} className="rounded-xl h-10 px-3">
                          Annuler
                        </Button>
                      </div>
                    </form>
                  )}

                  {/* Résoudre enquête — disponible si statut ENQUETE_DGDDL */}
                  {signalement.statut === "ENQUETE_DGDDL" && !showResoudreForm && (
                    <Button
                      onClick={() => setShowResoudreForm(true)}
                      disabled={actionLoading}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-[20px] h-12 font-black uppercase shadow-lg shadow-purple-500/20"
                    >
                      <Gavel className="w-4 h-4 mr-2" />
                      Rendre un verdict
                    </Button>
                  )}

                  {/* Formulaire résolution */}
                  {showResoudreForm && (
                    <form onSubmit={handleResoudreEnquete} className="space-y-3 p-4 bg-muted/20 rounded-[20px] border border-border">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] font-black uppercase tracking-widest">Verdict DGDDL</p>
                        <button type="button" onClick={() => setShowResoudreForm(false)}>
                          <X size={14} className="text-muted-foreground hover:text-foreground" />
                        </button>
                      </div>
                      <select
                        value={resolution}
                        onChange={e => setResolution(e.target.value as any)}
                        className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="FRAUDE">🔴 FRAUDE — Confirmée</option>
                        <option value="FAUX">⚠️ FAUX — Signalement abusif</option>
                        <option value="INFONDE">⚪ INFONDÉ — Classé sans suite</option>
                      </select>

                      {resolution === "FRAUDE" && (
                        <div className="animate-in slide-in-from-top-2 duration-300">
                          <label className="text-[9px] font-black text-red-600 uppercase mb-1 block">Montant de correction (FCFA)</label>
                          <input
                            type="number"
                            value={montantCorrige}
                            onChange={e => setMontantCorrige(e.target.value)}
                            placeholder="Montant à régulariser..."
                            className="w-full px-3 py-2 bg-red-500/5 border border-red-200 rounded-xl text-sm font-black text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                          />
                        </div>
                      )}

                      <textarea
                        value={justification}
                        onChange={e => setJustification(e.target.value)}
                        placeholder="Justification d'audit obligatoire..."
                        rows={3}
                        required
                        className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                      />
                      <Button
                        type="submit"
                        disabled={actionLoading || !justification.trim()}
                        className="w-full bg-primary hover:bg-primary/90 text-white font-black rounded-xl h-10"
                      >
                        {actionLoading ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Gavel className="w-4 h-4 mr-2" />}
                        Publier le verdict officiel
                      </Button>
                    </form>
                  )}

                  {/* Vote crédibilité */}
                  {!signalement.is_reviewed && signalement.statut === "ACTIF" && (
                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={() => handleVote("CREDIBLE")}
                        disabled={!!votingId}
                        className={`flex-1 rounded-[20px] h-10 font-black text-xs uppercase border-2 transition-all ${
                          signalement.mon_vote === "CREDIBLE"
                            ? "bg-emerald-600 border-emerald-600 text-white"
                            : "bg-transparent border-emerald-600/20 text-emerald-600 hover:bg-emerald-50"
                        }`}
                      >
                        {votingId === "CREDIBLE" ? <Loader2 className="animate-spin w-3 h-3 mr-1" /> : <ThumbsUp className="w-3 h-3 mr-1" />}
                        Crédible
                      </Button>
                      <Button
                        onClick={() => handleVote("INFONDE")}
                        disabled={!!votingId}
                        className={`flex-1 rounded-[20px] h-10 font-black text-xs uppercase border-2 transition-all ${
                          signalement.mon_vote === "INFONDE"
                            ? "bg-rose-600 border-rose-600 text-white"
                            : "bg-transparent border-rose-600/20 text-rose-600 hover:bg-rose-50"
                        }`}
                      >
                        {votingId === "INFONDE" ? <Loader2 className="animate-spin w-3 h-3 mr-1" /> : <ThumbsDown className="w-3 h-3 mr-1" />}
                        Infondé
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {signalement.statut === "VALIDE_FRAUDE" && (
                <div className="flex items-center gap-3 p-4 bg-red-500/10 rounded-[20px] border border-red-200">
                  <CheckCircle2 className="text-red-600" size={20} />
                  <p className="text-xs font-black text-red-700 uppercase">Fraude confirmée</p>
                </div>
              )}

              {(signalement.statut === "CLOS" || signalement.statut === "REJETE_FAUX") && (
                <div className="flex items-center gap-3 p-4 bg-emerald-500/10 rounded-[20px] border border-emerald-200">
                  <CheckCircle2 className="text-emerald-600" size={20} />
                  <p className="text-xs font-black text-emerald-700 uppercase">Dossier clos</p>
                </div>
              )}

              {/* Contexte de la Transaction */}
              {signalement.transaction_detail && (
                <div className="mt-6 pt-6 border-t border-border">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3 italic">Transaction suspectée</p>
                  <div className="p-4 bg-muted/20 rounded-[24px] border border-border/50">
                    <p className="text-lg font-black text-foreground">
                      {signalement.transaction_detail.montant_fcfa.toLocaleString()} FCFA
                    </p>
                    <p className="text-[10px] font-black text-primary uppercase mt-1">
                      {signalement.transaction_detail.categorie}
                    </p>
                    <div className="mt-3 flex items-center justify-between text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                      <span>{new Date(signalement.transaction_detail.created_at).toLocaleDateString()}</span>
                      <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                        {signalement.transaction_detail.statut}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-border text-center">
                <p className="text-[10px] text-muted-foreground font-bold italic">
                  Utilisez la section commentaires pour documenter vos observations publiques.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Section Commentaires */}
      <SectionCommentaires
        signalementId={id}
        commentairesInitiaux={signalement.commentaires ?? []}
      />
    </div>
  );
}
