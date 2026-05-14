"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { signalementsApi, type Signalement, type Commentaire } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { 
  MessageSquare, 
  ThumbsUp, 
  ThumbsDown, 
  Clock, 
  MapPin, 
  User, 
  ChevronLeft,
  Send,
  Paperclip,
  X,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  FileText,
  Image as ImageIcon
} from "lucide-react";
import { formatDateShort } from "@/lib/constants";
import { ipfsService } from "@/lib/ipfs";
import { motion } from "framer-motion";

export default function SignalementDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [signalement, setSignalement] = useState<Signalement | null>(null);
  const [loading, setLoading] = useState(true);
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentContent, setCommentContent] = useState("");
  const [commentError, setCommentError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const data = await signalementsApi.detail(id as string);
      setSignalement(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const [noteContent, setNoteContent] = useState("");
  const [resMontant, setResMontant] = useState<string>("");
  const [resJustif, setResJustif] = useState("");
  const [resType, setResType] = useState<"FRAUDE" | "FAUX" | "INFONDE">("FRAUDE");
  const [actionLoading, setActionLoading] = useState(false);

  const handleLancerEnquete = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      await signalementsApi.lancerEnquete(id as string);
      fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!id || !noteContent.trim()) return;
    setActionLoading(true);
    try {
      await signalementsApi.ajouterNoteEnquete(id as string, noteContent);
      setNoteContent("");
      fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResoudre = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      await signalementsApi.resoudreEnquete(id as string, {
        resolution: resType,
        justification: resJustif,
        montant_corrige: resType === "FRAUDE" && resMontant ? parseInt(resMontant) : undefined
      });
      fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  const handleVote = async (type: "CREDIBLE" | "INFONDE") => {
    if (!user) return router.push("/login");
    
    // Protection frontend
    const isInstitutional = ["MAIRE", "DGDDL", "AGENT_FINANCIER", "COUR_COMPTES"].includes(user.role);
    if (user.role === "CITOYEN" && user.certification_status !== "APPROVED" && !isInstitutional) {
      return alert("Votre compte doit être certifié Sentinelle pour voter.");
    }

    try {
      await signalementsApi.voter(id as string, type);
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const [commentType, setCommentType] = useState("AVIS");

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !commentContent.trim()) return;
    setCommentLoading(true);
    setCommentError(null);
    try {
      await signalementsApi.ajouterCommentaire(id as string, {
        contenu: commentContent,
        type_commentaire: commentType
      });
      setCommentContent("");
      setCommentType("AVIS");
      fetchData();
    } catch (err: any) {
      setCommentError(err.message);
    } finally {
      setCommentLoading(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
      <p className="text-slate-500">Chargement de la publication...</p>
    </div>
  );

  if (!signalement) return (
    <div className="text-center py-20">
      <h2 className="text-2xl font-bold">Signalement introuvable</h2>
      <Button onClick={() => router.back()} variant="ghost" className="mt-4">
        Retour au flux
      </Button>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 pb-24 space-y-8">
      <button 
        onClick={() => router.back()}
        className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors"
      >
        <ChevronLeft className="w-5 h-5" />
        Retour aux engagements
      </button>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Main Content */}
          <div className="flex-1 space-y-8">
            <Card className="rounded-3xl border-slate-200 overflow-hidden shadow-xl bg-white">
              <CardHeader className="bg-slate-50 border-b border-slate-100 p-6">
                <div className="flex justify-between items-start mb-4">
                  <Badge className={`px-4 py-1.5 rounded-full text-xs font-bold ${
                    signalement.statut === "ENQUETE_DGDDL" ? "bg-orange-100 text-orange-700 animate-pulse" :
                    signalement.statut === "VALIDE_FRAUDE" ? "bg-red-100 text-red-700" :
                    signalement.statut === "VIRAL" ? "bg-rose-100 text-rose-700" :
                    "bg-indigo-100 text-indigo-700"
                  }`}>
                    {signalement.statut}
                  </Badge>
                  <div className="flex items-center gap-2 text-slate-400 text-sm">
                    <Clock className="w-4 h-4" />
                    {formatDateShort(signalement.created_at)}
                  </div>
                </div>
                <CardTitle className="text-3xl font-black text-slate-900 leading-tight">
                  {signalement.sujet}
                </CardTitle>
                <div className="flex items-center gap-4 mt-4 text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    <span className="font-medium">{signalement.commune_detail?.nom}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <User className="w-4 h-4" />
                    <span>{signalement.auteur_detail?.full_name || "Citoyen Anonyme"}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                <p className="text-slate-600 leading-relaxed text-lg whitespace-pre-wrap mb-8">
                  {signalement.description}
                </p>

                {/* Transaction Linked Card (if fraud confirmed) */}
                {signalement.transaction_detail && (
                  <div className={`mb-8 p-6 rounded-2xl border ${
                    signalement.statut === "VALIDE_FRAUDE" ? "bg-red-50 border-red-100" : "bg-slate-50 border-slate-100"
                  }`}>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Transaction Concernée</p>
                        <p className="text-lg font-bold text-slate-900">{signalement.transaction_detail.montant_fcfa.toLocaleString()} FCFA</p>
                      </div>
                      {signalement.statut === "VALIDE_FRAUDE" && (
                        <Badge className="bg-red-600 text-white animate-bounce">FRAUDE CONFIRMÉE</Badge>
                      )}
                    </div>
                    <div className="text-sm text-slate-500 mb-4 line-clamp-1 italic">
                      {signalement.transaction_detail.description}
                    </div>
                    {signalement.transaction_detail.corrections && signalement.transaction_detail.corrections.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-red-100">
                        <p className="text-xs font-bold text-emerald-600 flex items-center gap-1.5 mb-2">
                          <CheckCircle2 className="w-4 h-4" /> CORRECTION APPLIQUÉE
                        </p>
                        {signalement.transaction_detail.corrections.map((corr: any) => (
                          <div key={corr.id} className="bg-emerald-50 p-3 rounded-xl border border-emerald-100 flex justify-between items-center">
                            <span className="font-bold text-emerald-700">{corr.montant_fcfa.toLocaleString()} FCFA</span>
                            <span className="text-xs text-emerald-600">{formatDateShort(corr.created_at)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Attachments */}
                <div className="space-y-4 pt-6 border-t border-slate-100">
                  <h3 className="font-bold flex items-center gap-2">
                    <Paperclip className="w-5 h-5 text-indigo-500" />
                    Pièces jointes et Preuves ({signalement.nb_preuves})
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                    {signalement.preuves?.map((preuve) => (
                      <a 
                        key={preuve.id} 
                        href={preuve.ipfs_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-4 border border-slate-100 rounded-2xl hover:bg-slate-50 transition-all group"
                      >
                        <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                          {preuve.type_fichier === "image" ? <ImageIcon className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{preuve.nom_fichier || "Document Preuve"}</p>
                          <p className="text-xs text-slate-400">Archivé sur IPFS</p>
                        </div>
                        <ExternalLink className="w-4 h-4 text-slate-300 group-hover:text-indigo-600" />
                      </a>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Timeline d'Enquête */}
            <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 shadow-inner">
              <h3 className="text-xl font-bold text-slate-900 mb-8 flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-orange-500" />
                Journal d'Audit Transparenet
              </h3>
              
              <div className="relative space-y-8 before:absolute before:inset-0 before:ml-4 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                
                {/* Step: Dépôt */}
                <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full border border-white bg-indigo-600 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2rem)] p-4 rounded-2xl bg-white border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-1">
                      <time className="font-bold text-indigo-600 text-xs uppercase tracking-widest">SIGNALEMENT DÉPOSÉ</time>
                      <span className="text-[10px] text-slate-400">{formatDateShort(signalement.created_at)}</span>
                    </div>
                    <div className="text-slate-500 text-sm">Le dossier a été ouvert par une Sentinelle certifiée.</div>
                  </div>
                </div>

                {/* Step: Viral / Validation Sociale */}
                {signalement.nb_votes > 0 && (
                  <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full border border-white ${signalement.statut === "VIRAL" ? "bg-rose-500" : "bg-slate-300"} text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2`}>
                      {signalement.statut === "VIRAL" ? "🔥" : <ThumbsUp className="w-4 h-4" />}
                    </div>
                    <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2rem)] p-4 rounded-2xl bg-white border border-slate-100 shadow-sm">
                      <div className="flex items-center justify-between mb-1">
                        <time className="font-bold text-slate-600 text-xs uppercase tracking-widest">VALIDATION SOCIALE</time>
                      </div>
                      <div className="text-slate-500 text-sm">
                        {signalement.nb_votes} votes citoyens. Crédibilité : {signalement.pct_credible}%.
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions DGDDL Timeline */}
                {signalement.actions_dgddl?.map((action, idx) => (
                  <div key={action.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full border border-white bg-orange-500 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2rem)] p-4 rounded-2xl bg-white border border-orange-100 shadow-sm ring-1 ring-orange-50">
                      <div className="flex items-center justify-between mb-1">
                        <time className="font-bold text-orange-600 text-xs uppercase tracking-widest">{action.action_type}</time>
                        <span className="text-[10px] text-slate-400">{formatDateShort(action.created_at)}</span>
                      </div>
                      <div className="text-slate-700 text-sm font-medium">{action.description}</div>
                      <div className="mt-2 text-[10px] text-slate-400 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> Officiel : {action.effectuee_par_nom}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Verdict Final */}
                {signalement.statut === "VALIDE_FRAUDE" || signalement.statut === "REJETE_FAUX" || signalement.statut === "CLOS" ? (
                  <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full border border-white ${signalement.statut === "VALIDE_FRAUDE" ? "bg-red-600" : "bg-emerald-600"} text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2`}>
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div className={`w-[calc(100%-3rem)] md:w-[calc(50%-2rem)] p-6 rounded-2xl border shadow-lg ${signalement.statut === "VALIDE_FRAUDE" ? "bg-red-600 text-white" : "bg-emerald-600 text-white"}`}>
                      <h4 className="font-black text-lg mb-1 uppercase">VERDICT FINAL</h4>
                      <p className="text-white/90 text-sm italic mb-3">"{signalement.resolution_justification}"</p>
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/20">
                        <div className="text-xs font-bold opacity-80">RÉSOLU LE {formatDateShort(signalement.resolution_a || "")}</div>
                        <Badge className="bg-white text-slate-900">{signalement.resolution}</Badge>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="space-y-6">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <MessageSquare className="w-6 h-6 text-indigo-500" />
                Discussions ({signalement.commentaires?.length || 0})
              </h2>

              {/* Comment Form */}
              {user ? (
                <div className="space-y-4">
                  {(user.role === "CITOYEN" && user.certification_status !== "APPROVED") && (
                    <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5 shrink-0" />
                      <p className="text-sm text-orange-800">
                        Votre compte doit être certifié **Sentinelle** pour participer aux discussions.
                      </p>
                    </div>
                  )}
                  <form onSubmit={handleAddComment} className={`bg-white rounded-2xl border border-slate-200 p-4 shadow-sm ${(user.role === "CITOYEN" && user.certification_status !== "APPROVED") || signalement.statut === "ENQUETE_DGDDL" ? "opacity-50 pointer-events-none" : ""}`}>
                    {/* Type selector for institutional users */}
                    {(user.role === "MAIRE" || user.role === "DGDDL") && (
                      <div className="mb-4 flex items-center gap-3 bg-slate-50 p-2 rounded-xl border border-slate-100">
                        <span className="text-xs font-bold text-slate-400 ml-2">RÔLE OFFICIEL :</span>
                        <select 
                          value={commentType}
                          onChange={(e) => setCommentType(e.target.value)}
                          className="text-xs font-bold bg-white border border-slate-200 rounded-lg px-3 py-1 text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        >
                          <option value="AVIS">Avis standard</option>
                          {user.role === "MAIRE" && <option value="JUSTIFICATION">Justification du Maire</option>}
                          {user.role === "DGDDL" && <option value="ENQUETE">Note d'enquête DGDDL</option>}
                        </select>
                      </div>
                    )}

                    <textarea 
                      required
                      disabled={(user.role === "CITOYEN" && user.certification_status !== "APPROVED") || signalement.statut === "ENQUETE_DGDDL"}
                      rows={3}
                      placeholder={signalement.statut === "ENQUETE_DGDDL" ? "Les discussions sont gelées pendant l'enquête..." : user.role === "MAIRE" ? "Apportez des précisions ou justifiez cette transaction..." : "Partagez votre avis..."}
                      className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
                      value={commentContent}
                      onChange={e => setCommentContent(e.target.value)}
                    />
                    <div className="flex items-center justify-between mt-3">
                      <button type="button" className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
                        <ImageIcon className="w-5 h-5" />
                      </button>
                      <Button disabled={commentLoading || (user.role === "CITOYEN" && user.certification_status !== "APPROVED") || signalement.statut === "ENQUETE_DGDDL"} className="rounded-xl px-6 bg-indigo-600 hover:bg-indigo-700 text-white">
                        {commentLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Envoyer"}
                        <Send className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                    {commentError && <p className="text-red-500 text-xs mt-2">{commentError}</p>}
                  </form>
                </div>
        ) : (
          <div className="bg-slate-100 p-6 rounded-2xl text-center border border-dashed border-slate-300">
            <p className="text-slate-600">Vous devez être connecté pour participer à la discussion.</p>
            <Button onClick={() => router.push("/login")} variant="link" className="text-indigo-600 font-bold">
              Se connecter
            </Button>
          </div>
        )}

        {/* Comments List */}
        <div className="space-y-4">
          {(signalement.commentaires || []).map((comment) => (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              key={comment.id} 
              className={`p-4 rounded-2xl border border-slate-100 bg-white shadow-sm ${
                comment.type_commentaire !== "AVIS" ? "ring-2 ring-indigo-500/10 border-indigo-100" : ""
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                    {comment.auteur_nom?.charAt(0)}
                  </div>
                  <span className="font-bold text-sm">{comment.auteur_nom}</span>
                  <Badge variant="secondary" className="text-[10px] py-0 px-2 rounded-full bg-slate-50 text-slate-500">
                    {comment.auteur_role}
                  </Badge>
                </div>
                <span className="text-xs text-slate-400">{formatDateShort(comment.created_at)}</span>
              </div>
              <p className="text-slate-700 text-sm leading-relaxed">
                {comment.contenu}
              </p>
            </motion.div>
          ))}
          {signalement.commentaires?.length === 0 && (
            <div className="text-center py-10 text-slate-400 italic">
              Aucun commentaire pour le moment.
            </div>
          )}
        </div>
      </div>
          {/* Sidebar / Stats & Audit Panel */}
          <div className="w-full md:w-96 space-y-8">
            {/* Panel de Contrôle DGDDL (Admin) */}
            {user?.role === "DGDDL" && (
              <Card className="rounded-3xl border-orange-200 bg-orange-50/50 shadow-lg border-2">
                <CardHeader>
                  <CardTitle className="text-orange-800 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5" />
                    Console d'Investigation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {signalement.statut !== "ENQUETE_DGDDL" && signalement.statut !== "VALIDE_FRAUDE" && signalement.statut !== "REJETE_FAUX" && (
                    <Button 
                      onClick={handleLancerEnquete}
                      disabled={actionLoading}
                      className="w-full bg-orange-600 hover:bg-orange-700 text-white rounded-2xl py-6"
                    >
                      {actionLoading ? <Loader2 className="animate-spin" /> : "🚀 Lancer l'enquête officielle"}
                    </Button>
                  )}

                  {signalement.statut === "ENQUETE_DGDDL" && (
                    <div className="space-y-4">
                      <div className="p-4 bg-white rounded-2xl border border-orange-200">
                        <p className="text-xs font-bold text-orange-700 mb-2 uppercase">Ajouter une note d'étape</p>
                        <textarea 
                          value={noteContent}
                          onChange={e => setNoteContent(e.target.value)}
                          placeholder="Décrivez l'avancement..."
                          className="w-full p-3 text-sm bg-slate-50 border rounded-xl mb-3 focus:ring-orange-500"
                        />
                        <Button 
                          onClick={handleAddNote}
                          disabled={actionLoading || !noteContent.trim()}
                          variant="outline"
                          className="w-full border-orange-200 text-orange-700"
                        >
                          Publier la note
                        </Button>
                      </div>

                      <div className="p-4 bg-white rounded-2xl border border-red-200 ring-2 ring-red-50">
                        <p className="text-xs font-bold text-red-700 mb-4 uppercase">Résolution Finale</p>
                        <select 
                          value={resType}
                          onChange={e => setResType(e.target.value as any)}
                          className="w-full p-3 text-sm border rounded-xl mb-3"
                        >
                          <option value="FRAUDE">CONFIRMER FRAUDE 🔴</option>
                          <option value="INFONDE">SIGNALEMENT INFONDÉ 🟢</option>
                          <option value="FAUX">SIGNALEMENT MALVEILLANT (FAUX) ❌</option>
                        </select>
                        
                        {resType === "FRAUDE" && (
                          <input 
                            type="number"
                            placeholder="Montant réel constaté (FCFA)"
                            className="w-full p-3 text-sm border rounded-xl mb-3 border-red-200"
                            value={resMontant}
                            onChange={e => setResMontant(e.target.value)}
                          />
                        )}

                        <textarea 
                          placeholder="Justification finale (obligatoire)..."
                          className="w-full p-3 text-sm border rounded-xl mb-4"
                          value={resJustif}
                          onChange={e => setResJustif(e.target.value)}
                        />

                        <Button 
                          onClick={handleResoudre}
                          disabled={actionLoading || !resJustif.trim()}
                          className="w-full bg-red-600 hover:bg-red-700 text-white rounded-xl"
                        >
                          {actionLoading ? <Loader2 className="animate-spin" /> : "🔒 Clôturer & Appliquer"}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Reputation & Community Stats */}
            <Card className="rounded-3xl border-slate-200 shadow-xl overflow-hidden">
              <CardHeader className="bg-slate-50 border-b border-slate-100">
                <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider">Engagement Citoyen</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-indigo-50 p-4 rounded-2xl text-center">
                    <p className="text-2xl font-black text-indigo-600">{signalement.nb_votes}</p>
                    <p className="text-[10px] font-bold text-indigo-400 uppercase">Votes</p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-2xl text-center">
                    <p className="text-2xl font-black text-orange-600">{signalement.pct_credible}%</p>
                    <p className="text-[10px] font-bold text-orange-400 uppercase">Fiabilité</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={() => handleVote("CREDIBLE")}
                    disabled={user?.role === "CITOYEN" && user?.certification_status !== "APPROVED"}
                    className="flex-1 h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200"
                  >
                    <ThumbsUp className="w-5 h-5 mr-2" />
                    Crédible
                  </Button>
                  <Button 
                    onClick={() => handleVote("INFONDE")}
                    disabled={user?.role === "CITOYEN" && user?.certification_status !== "APPROVED"}
                    className="flex-1 h-14 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-200"
                  >
                    <ThumbsDown className="w-5 h-5 mr-2" />
                    Infondé
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
