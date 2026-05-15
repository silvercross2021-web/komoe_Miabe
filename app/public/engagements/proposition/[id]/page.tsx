"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { propositionsApi, type Proposition, type CommentaireProposition } from "@/lib/api";
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
  Image as ImageIcon,
  Lightbulb,
  Wallet
} from "lucide-react";
import { formatFCFA, formatDateShort } from "@/lib/constants";
import { ipfsService } from "@/lib/ipfs";
import { motion } from "framer-motion";
import { useWriteContract, useAccount } from "wagmi";
import { parseGwei } from "viem";
import { BUDGET_LEDGER_ABI, BUDGET_LEDGER_ADDRESS } from "@/lib/blockchain";

export default function PropositionDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [proposition, setProposition] = useState<Proposition | null>(null);
  const [loading, setLoading] = useState(true);
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentContent, setCommentContent] = useState("");
  const [proposedBudget, setProposedBudget] = useState<string>("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [governanceLoading, setGovernanceLoading] = useState(false);

  const { writeContractAsync } = useWriteContract();
  const { isConnected } = useAccount();

  const fetchData = async () => {
    try {
      const data = await propositionsApi.detail(id as string);
      setProposition(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  const handleVote = async (type: "SOUTIEN" | "OPPOSITION") => {
    if (!user) return router.push("/login");
    try {
      await propositionsApi.voter(id as string, type);
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleOfficialiser = async () => {
    if (!isConnected) return alert("Veuillez connecter votre portefeuille MetaMask.");
    if (!proposition) return;

    if (!proposedBudget || Number(proposedBudget) <= 0) {
      return alert("Veuillez saisir le budget alloué pour ce projet (Estimation municipale).");
    }

    setGovernanceLoading(true);
    try {
      // 1. Signature Blockchain
      console.log("📝 Signature d'engagement Maire sur Polygon...");
      const hash = await writeContractAsync({
        address: BUDGET_LEDGER_ADDRESS,
        abi: BUDGET_LEDGER_ABI,
        functionName: "officialiserProposition",
        args: [
          proposition.id,
          String(proposition.commune),
          `Engagement Budgetaire: ${proposedBudget} FCFA`
        ],
        gas: 300000n,
        maxPriorityFeePerGas: parseGwei('25'),
        maxFeePerGas: parseGwei('30'),
      });

      // 2. Notification Backend
      await propositionsApi.officialiser(proposition.id, {
        tx_hash: hash,
        budget_alloue_fcfa: Number(proposedBudget)
      });
      alert("Félicitations ! La proposition est désormais officielle avec un budget de " + proposedBudget + " FCFA. Le vote décisionnel est ouvert.");
      fetchData();
    } catch (err: any) {
      console.error(err);
      alert("Erreur lors de l'officialisation : " + (err.shortMessage || err.message));
    } finally {
      setGovernanceLoading(false);
    }
  };

  const handleCloturer = async () => {
    if (!proposition) return;
    if (!window.confirm("Voulez-vous clôturer le vote et appliquer le résultat ?")) return;

    setGovernanceLoading(true);
    try {
      const res = await propositionsApi.cloturer(proposition.id);
      alert(`Vote clôturé ! Résultat : ${res.statut === "APPROUVEE" ? "PROJET ADOPTÉ ✅" : "PROJET REJETÉ ❌"}`);
      fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setGovernanceLoading(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !commentContent.trim()) return;
    setCommentLoading(true);
    setCommentError(null);
    try {
      let imageUrl = "";
      if (selectedImage) {
        const cid = await ipfsService.uploadFile(selectedImage);
        imageUrl = `https://ipfs.io/ipfs/${cid}`;
      }

      await propositionsApi.ajouterCommentaire(id as string, {
        contenu: commentContent,
        image_url: imageUrl
      });
      setCommentContent("");
      setSelectedImage(null);
      fetchData();
    } catch (err: any) {
      setCommentError(err.message);
    } finally {
      setCommentLoading(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Loader2 className="w-10 h-10 animate-spin text-primary" />
      <p className="text-muted-foreground">Chargement de la publication...</p>
    </div>
  );

  if (!proposition) return (
    <div className="text-center py-20">
      <h2 className="text-2xl font-bold">Proposition introuvable</h2>
      <Button onClick={() => router.back()} variant="ghost" className="mt-4">
        Retour au flux
      </Button>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 pb-24 space-y-8">
      <button 
        onClick={() => router.back()}
        className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
      >
        <ChevronLeft className="w-5 h-5" />
        Retour aux engagements
      </button>

      {/* Main Content */}
      <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden">
        <div className="p-6 md:p-8 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Badge className="bg-blue-100 text-blue-700 border-blue-200 rounded-full px-4 py-1">
                💡 Proposition
              </Badge>
              <Badge variant="outline" className="rounded-full border-slate-200 text-slate-500">
                {proposition.statut}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Clock className="w-4 h-4" />
              <span>Publié le {formatDateShort(proposition.created_at)}</span>
            </div>
          </div>

          <div className="space-y-4">
            <h1 className="text-3xl font-bold text-foreground">{proposition.titre}</h1>
            <div className="flex items-center gap-2 text-primary font-bold bg-primary/10 w-fit px-4 py-2 rounded-2xl border border-primary/20">
              <Wallet className="w-5 h-5" />
              <span>Budget demandé: {formatFCFA(proposition.budget_demande_fcfa)}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-6 items-center text-slate-600">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-primary font-bold">
                {proposition.soumis_par_detail?.full_name?.charAt(0) || "C"}
              </div>
              <div>
                <p className="font-semibold text-sm leading-none text-foreground">{proposition.soumis_par_detail?.full_name || "Anonyme"}</p>
                <p className="text-xs text-muted-foreground mt-1">Citoyen engagé</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm bg-muted px-3 py-1.5 rounded-xl border border-border">
              <MapPin className="w-4 h-4 text-primary" />
              <span>{proposition.commune_detail?.nom}</span>
            </div>
          </div>

          <div className="prose prose-slate dark:prose-invert max-w-none">
            <p className="text-lg leading-relaxed text-foreground/80 whitespace-pre-wrap">
              {proposition.description}
            </p>
          </div>

          {/* Attachments */}
          <div className="space-y-4 pt-6 border-t border-slate-100">
            <h3 className="font-bold flex items-center gap-2 text-foreground">
              <Paperclip className="w-5 h-5 text-primary" />
              Pièces jointes et Preuves ({proposition.nb_preuves})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {proposition.preuves?.map((preuve) => (
                <a 
                  key={preuve.id} 
                  href={preuve.ipfs_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 border border-border rounded-2xl hover:bg-muted transition-all group"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    {preuve.type_fichier === "image" ? <ImageIcon className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate text-foreground">{preuve.nom_fichier || "Document Proposition"}</p>
                    <p className="text-xs text-muted-foreground">Certifié via IPFS</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                </a>
              ))}
              {proposition.preuves?.length === 0 && (
                <p className="text-slate-400 text-sm italic col-span-full">Aucun document joint.</p>
              )}
            </div>
          </div>
        </div>

        {/* Action Bar - Community Voting */}
        <div className="bg-muted border-t border-border p-6 flex flex-wrap items-center justify-between gap-6">
          <div className="flex-1 space-y-2">
             <div className="flex items-center justify-between text-sm font-semibold mb-1">
                <span className="text-blue-500 font-black italic uppercase tracking-tighter">{proposition.pct_soutien}% de soutien citoyen</span>
                <span className="text-muted-foreground font-bold">{proposition.nb_soutiens + proposition.nb_oppositions} votes exprimés</span>
             </div>
             <div className="w-full bg-border h-4 rounded-full overflow-hidden flex shadow-inner">
                <div 
                  className="bg-blue-600 h-full transition-all duration-700 ease-out" 
                  style={{ width: `${proposition.pct_soutien}%` }} 
                />
                <div 
                  className="bg-rose-500 h-full transition-all duration-700 ease-out" 
                  style={{ width: `${100 - proposition.pct_soutien}%` }} 
                />
             </div>
          </div>

          <div className="flex gap-3">
            <Button 
              onClick={() => handleVote("SOUTIEN")}
              disabled={user?.role === "CITOYEN" && user?.certification_status !== "APPROVED"}
              className={`rounded-2xl gap-2 h-14 px-8 font-black uppercase tracking-widest text-xs transition-all ${
                proposition.mon_vote === "SOUTIEN" ? "bg-blue-800 scale-95" : "bg-blue-600 hover:bg-blue-700 hover:scale-105"
              } text-white shadow-xl shadow-blue-600/20 disabled:opacity-50`}
            >
              <ThumbsUp className="w-5 h-5" />
              Soutenir
            </Button>
            <Button 
              onClick={() => handleVote("OPPOSITION")}
              disabled={user?.role === "CITOYEN" && user?.certification_status !== "APPROVED"}
              variant="outline"
              className={`rounded-2xl border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:scale-105 gap-2 h-14 px-8 font-black uppercase tracking-widest text-xs transition-all disabled:opacity-50 ${
                proposition.mon_vote === "OPPOSITION" ? "ring-4 ring-rose-500/20 bg-rose-100 scale-95" : ""
              }`}
            >
              <ThumbsDown className="w-5 h-5" />
              S'opposer
            </Button>
          </div>
        </div>
      </div>

      {/* Mayor Governance Panel */}
      {user?.role === "MAIRE" && Number(user.commune) === proposition.commune && (
        <Card className="border-2 border-primary/30 bg-primary/5 rounded-[32px] overflow-hidden shadow-xl animate-in zoom-in-95 duration-500">
          <CardHeader className="bg-primary/10 border-b border-primary/10 p-6">
            <CardTitle className="text-primary flex items-center gap-2 text-sm font-black uppercase tracking-[0.2em]">
              <ShieldCheck className="w-5 h-5" />
              Panneau de Gouvernance Municipale
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex-1 space-y-2">
                <h3 className="text-xl font-black text-foreground italic uppercase leading-none">
                  {proposition.statut === "SUGGESTION" ? "Officialiser cette idée ?" : "Suivi du vote décisionnel"}
                </h3>
                <p className="text-sm text-muted-foreground font-medium leading-relaxed max-w-xl">
                  {proposition.statut === "SUGGESTION" 
                    ? "En officialisant cette proposition, vous engagez votre signature blockchain et fixez l'enveloppe budgétaire estimée par la mairie."
                    : "Le vote est en phase finale. Si le seuil d'approbation est atteint à la clôture, KOMOE créera automatiquement la fiche projet et allouera le budget fixé."}
                </p>

                {proposition.statut === "SUGGESTION" && (
                  <div className="pt-4 max-w-xs">
                    <label className="text-[10px] font-black uppercase tracking-widest text-primary mb-2 block">Budget Estimé (FCFA)</label>
                    <div className="relative">
                      <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                      <input 
                        type="number"
                        placeholder="Ex: 5000000"
                        value={proposedBudget}
                        onChange={(e) => setProposedBudget(e.target.value)}
                        className="w-full h-12 pl-11 pr-4 bg-white/50 border border-primary/20 rounded-xl font-black text-primary focus:ring-2 focus:ring-primary outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="shrink-0 flex flex-col gap-3 min-w-[240px]">
                {proposition.statut === "SUGGESTION" && (
                  <Button 
                    onClick={handleOfficialiser}
                    disabled={governanceLoading}
                    className="w-full h-16 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 flex items-center gap-3 transition-all hover:scale-105 active:scale-95"
                  >
                    {governanceLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <CheckCircle2 className="w-6 h-6" />}
                    Signer & Officialiser
                  </Button>
                )}

                {proposition.statut === "OFFICIELLE" && (
                  <Button 
                    onClick={handleCloturer}
                    disabled={governanceLoading}
                    className="w-full h-16 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-emerald-600/20 flex items-center gap-3 transition-all hover:scale-105 active:scale-95"
                  >
                    {governanceLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <CheckCircle2 className="w-6 h-6" />}
                    Clôturer & Lancer Projet
                  </Button>
                )}

                {proposition.statut === "APPROUVEE" && (
                  <div className="flex items-center justify-center p-6 bg-emerald-500/10 border-2 border-emerald-500/30 rounded-2xl text-emerald-600 font-black text-xs uppercase tracking-widest gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    Projet Adopté & Planifié
                  </div>
                )}
                
                {proposition.maire_signature_hash && (
                  <a 
                    href={`https://amoy.polygonscan.com/tx/${proposition.maire_signature_hash}`}
                    target="_blank" rel="noopener noreferrer"
                    className="text-[10px] font-bold text-muted-foreground hover:text-primary text-center underline flex items-center justify-center gap-1 group"
                  >
                    Preuve Blockchain <ExternalLink size={10} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </a>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Discussion Section */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold flex items-center gap-3 text-foreground">
          <MessageSquare className="w-6 h-6 text-primary" />
          Discussions ({proposition.commentaires?.length || 0})
        </h2>

        {/* Comment Form */}
        {user ? (
          <div className="space-y-4">
            {(user.role === "CITOYEN" && user.certification_status !== "APPROVED") && (
              <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5 shrink-0" />
                <p className="text-sm text-orange-800">
                  Votre compte doit être certifié **Sentinelle** pour participer aux débats sur les propositions.
                </p>
              </div>
            )}
            <form onSubmit={handleAddComment} className={`bg-card rounded-2xl border border-border p-4 shadow-sm ${(user.role === "CITOYEN" && user.certification_status !== "APPROVED") ? "opacity-50 pointer-events-none" : ""}`}>
              <textarea 
                required
                disabled={user.role === "CITOYEN" && user.certification_status !== "APPROVED"}
                rows={3}
                placeholder="Que pensez-vous de ce projet ? Partagez vos idées..."
                className="w-full p-4 bg-muted border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none text-foreground"
                value={commentContent}
                onChange={e => setCommentContent(e.target.value)}
              />
              <div className="flex items-center justify-between mt-3">
                <input 
                  type="file" 
                  id="image-comment" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={(e) => setSelectedImage(e.target.files?.[0] || null)}
                />
                <label 
                  htmlFor="image-comment"
                  className="p-2 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                >
                  <ImageIcon className="w-5 h-5" />
                </label>
                
                {selectedImage && (
                  <div className="flex items-center gap-2 bg-muted px-3 py-1 rounded-lg border border-border">
                    <ImageIcon className="w-4 h-4 text-primary" />
                    <span className="text-xs truncate max-w-[150px]">{selectedImage.name}</span>
                    <button type="button" onClick={() => setSelectedImage(null)} className="text-rose-500 hover:text-rose-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <div className="flex-1" />

                <Button disabled={commentLoading || (user.role === "CITOYEN" && user.certification_status !== "APPROVED")} className="rounded-xl px-6 bg-primary hover:bg-primary/90 text-primary-foreground">
                  {commentLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Envoyer"}
                  <Send className="w-4 h-4 ml-2" />
                </Button>
              </div>
              {commentError && <p className="text-red-500 text-xs mt-2">{commentError}</p>}
            </form>
          </div>
        ) : (
          <div className="bg-muted p-6 rounded-2xl text-center border border-dashed border-border">
            <p className="text-muted-foreground">Vous devez être connecté pour participer à la discussion.</p>
            <Button onClick={() => router.push("/login")} variant="link" className="text-primary font-bold">
              Se connecter
            </Button>
          </div>
        )}

        {/* Comments List */}
        <div className="space-y-4">
          {(proposition.commentaires || []).map((comment) => (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              key={comment.id} 
              className="p-4 rounded-2xl border border-border bg-card shadow-sm"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                    {comment.auteur_nom?.charAt(0)}
                  </div>
                  <span className="font-bold text-sm text-foreground">{comment.auteur_nom}</span>
                </div>
                <span className="text-xs text-muted-foreground">{formatDateShort(comment.created_at)}</span>
              </div>
              <p className="text-slate-700 text-sm leading-relaxed mb-3">
                {comment.contenu}
              </p>
              {comment.image_url && (
                <div className="mt-3 rounded-xl overflow-hidden border border-border max-w-sm">
                  <img src={comment.image_url} alt="Preuve commentaire" className="w-full h-auto object-cover hover:scale-105 transition-transform duration-500" />
                </div>
              )}
            </motion.div>
          ))}
          {proposition.commentaires?.length === 0 && (
            <div className="text-center py-10 text-slate-400 italic">
              Aucun commentaire pour le moment.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
