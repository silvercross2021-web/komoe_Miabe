"use client";

import { useState, useEffect, useMemo } from "react";
import { signalementsApi, propositionsApi, type Signalement, type Proposition } from "@/lib/api";
import { useCommunesList } from "@/lib/hooks/useCommunes";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/Drawer";
import { 
  Users, 
  MessageSquare, 
  ThumbsUp, 
  ThumbsDown, 
  Plus, 
  Search, 
  Filter, 
  AlertTriangle, 
  Lightbulb, 
  Clock, 
  MapPin, 
  Send, 
  Paperclip, 
  X,
  Loader2,
  Share2,
  Eye,
  CheckCircle2,
  ShieldCheck,
  ChevronDown,
  User,
  Image as ImageIcon,
  FileText
} from "lucide-react";
import { formatDateShort } from "@/lib/constants";
import Link from "next/link";
import { useRef } from "react";
import { ipfsService } from "@/lib/ipfs";
import { motion, AnimatePresence } from "framer-motion";

type PublicationType = "SIGNALEMENT" | "PROPOSITION";

interface Publication {
  id: string;
  type: PublicationType;
  titre: string;
  description: string;
  commune: string;
  communeId: number;
  auteur: string;
  auteurAvatar?: string;
  date: string;
  votes: number;
  commentairesCount: number;
  badges: string[];
  data: Signalement | Proposition;
}

const CATEGORIES_SIGNALEMENT = [
  "Dépense suspecte",
  "Montant anormal",
  "Transaction sans justificatif",
  "Retard de publication",
  "Projet non réalisé",
  "Autre anomalie",
];

const CATEGORIES_PROPOSITION = [
  { label: "Infrastructure", value: "INFRASTRUCTURE" },
  { label: "Éducation", value: "EDUCATION" },
  { label: "Santé", value: "SANTE" },
  { label: "Eau & Assainissement", value: "EAU_ASSAINISSEMENT" },
  { label: "Sécurité", value: "SECURITE" },
  { label: "Environnement", value: "ENVIRONNEMENT" },
  { label: "Social", value: "SOCIAL" },
  { label: "Culture & Sport", value: "CULTURE_SPORT" },
  { label: "Agriculture", value: "AGRICULTURE" },
  { label: "Administration", value: "ADMINISTRATION" },
  { label: "Autre", value: "AUTRE" },
];

export default function EngagementsCitoyensPage() {
  const { user } = useAuth();
  const { communes } = useCommunesList();
  const [loading, setLoading] = useState(true);
  const [publications, setPublications] = useState<Publication[]>([]);
  const [filter, setFilter] = useState<"TOUT" | "SIGNALEMENTS" | "PROPOSITIONS">("TOUT");
  const [search, setSearch] = useState("");
  const [selectedCommune, setSelectedCommune] = useState<string>("");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [pubType, setPubType] = useState<PublicationType>("PROPOSITION");

  // Form state
  const [form, setForm] = useState({
    titre: "",
    description: "",
    communeId: "",
    categorie: "INFRASTRUCTURE",
    budget: "",
  });
  const [fichiers, setFichiers] = useState<File[]>([]);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchPublications = async () => {
    setLoading(true);
    try {
      const [resS, resP] = await Promise.all([
        signalementsApi.list({ commune: selectedCommune ? Number(selectedCommune) : undefined }),
        propositionsApi.list({ commune: selectedCommune ? Number(selectedCommune) : undefined })
      ]);

      const signalements: Publication[] = (resS.results ?? []).map(s => ({
        id: s.id,
        type: "SIGNALEMENT",
        titre: s.sujet,
        description: s.description,
        commune: s.commune_detail?.nom ?? "Commune inconnue",
        communeId: s.commune,
        auteur: s.auteur_detail?.full_name ?? "Citoyen Anonyme",
        date: s.created_at,
        votes: s.nb_votes,
        commentairesCount: s.commentaires?.length ?? 0,
        badges: [
          s.statut,
          s.is_prioritaire ? "🚨 PRIORITAIRE" : null,
          s.pct_credible >= 70 ? "🛡️ CRÉDIBLE" : null,
          s.created_by_profession === "JOURNALISTE" ? "📰 PRESSE" : null
        ].filter(Boolean) as string[],
        data: s
      }));

      const propositions: Publication[] = (resP.results ?? []).map(p => ({
        id: p.id,
        type: "PROPOSITION",
        titre: p.titre,
        description: p.description,
        commune: p.commune_detail?.nom ?? "Commune inconnue",
        communeId: p.commune,
        auteur: p.soumis_par_detail?.full_name ?? "Citoyen Anonyme",
        date: p.created_at,
        votes: p.nb_soutiens - p.nb_oppositions,
        commentairesCount: p.commentaires?.length ?? 0,
        badges: [
          p.statut, 
          p.categorie,
          p.pct_soutien >= 80 ? "🔥 POPULAIRE" : null
        ].filter(Boolean) as string[],
        data: p
      }));

      const merged = [...signalements, ...propositions].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      setPublications(merged);
    } catch (err) {
      console.error("Fetch error (engagements):", err instanceof Error ? err.message : err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublications();
  }, [selectedCommune]);

  const filteredPubs = useMemo(() => {
    return publications.filter(p => {
      const matchType = filter === "TOUT" || 
                        (filter === "SIGNALEMENTS" && p.type === "SIGNALEMENT") ||
                        (filter === "PROPOSITIONS" && p.type === "PROPOSITION");
      const matchSearch = p.titre.toLowerCase().includes(search.toLowerCase()) || 
                          p.description.toLowerCase().includes(search.toLowerCase());
      return matchType && matchSearch;
    });
  }, [publications, filter, search]);

  // Handlers
  const handleVote = async (pubId: string, voteValue: string) => {
    if (!user) return;
    try {
      const pub = publications.find(p => p.id === pubId);
      if (!pub) return;

      if (pub.type === "SIGNALEMENT") {
        await signalementsApi.voter(pubId, voteValue === "CREDIBLE" ? "CREDIBLE" : "INFONDE");
      } else {
        await propositionsApi.voter(pubId, voteValue === "SOUTIEN" ? "SOUTIEN" : "OPPOSITION");
      }
      fetchPublications();
    } catch (err: any) {
      console.error("Vote error:", err);
    }
  };

  const handleAddFichier = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(f => f.size <= 10 * 1024 * 1024);
    setFichiers(prev => [...prev, ...validFiles].slice(0, 5));
  };

  const handleRemoveFichier = (idx: number) => {
    setFichiers(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    // Validation locale
    if (!form.communeId) {
      setFormError("Veuillez sélectionner une commune.");
      setFormLoading(false);
      return;
    }
    if (pubType === "PROPOSITION" && !form.categorie) {
      setFormError("Veuillez sélectionner une catégorie.");
      setFormLoading(false);
      return;
    }

    setFormLoading(true);
    setFormError(null);

    try {
      let createdId = "";
      
      if (pubType === "SIGNALEMENT") {
        const res = await signalementsApi.create({
          commune: Number(form.communeId),
          sujet: form.titre,
          description: form.description,
        });
        createdId = res.id;

        // Upload preuves
        for (const f of fichiers) {
          const cid = await ipfsService.uploadFile(f);
          await signalementsApi.ajouterPreuve(createdId, {
            ipfs_hash: cid,
            ipfs_url: `https://ipfs.io/ipfs/${cid}`,
            nom_fichier: f.name,
            type_fichier: f.type.startsWith("image/") ? "image" : f.type === "application/pdf" ? "pdf" : "autre"
          });
        }
      } else {
        const res = await propositionsApi.create({
          commune: Number(form.communeId),
          titre: form.titre,
          description: form.description,
          categorie: form.categorie,
          budget_demande_fcfa: Number(form.budget),
        });
        createdId = res.id;

        // Upload preuves
        for (const f of fichiers) {
          const cid = await ipfsService.uploadFile(f);
          await propositionsApi.ajouterPreuve(createdId, {
            ipfs_hash: cid,
            ipfs_url: `https://ipfs.io/ipfs/${cid}`,
            nom_fichier: f.name,
            type_fichier: f.type.startsWith("image/") ? "image" : f.type === "application/pdf" ? "pdf" : "autre"
          });
        }
      }

      setFormSuccess(true);
      setTimeout(() => {
        setIsDrawerOpen(false);
        setFormSuccess(false);
        setForm({ titre: "", description: "", communeId: "", categorie: "INFRASTRUCTURE", budget: "" });
        setFichiers([]);
        fetchPublications();
      }, 2000);
    } catch (err: any) {
      console.error("Submit error:", err);
      // Extraire l'erreur spécifique si possible
      let msg = err.message || "Une erreur est survenue";
      if (err.data && typeof err.data === 'object') {
        const firstError = Object.entries(err.data)[0];
        if (firstError) {
          msg = `${firstError[0]}: ${Array.isArray(firstError[1]) ? firstError[1][0] : firstError[1]}`;
        }
      }
      setFormError(msg);
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 pb-24">
      {/* Header */}
      <header className="mb-8 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground dark:text-white">
              Engagement Citoyen
            </h1>
            <p className="text-muted-foreground font-medium italic">Exprimez-vous, signalez et proposez pour votre commune.</p>
          </div>
          <Button 
            onClick={() => setIsDrawerOpen(true)}
            className="rounded-full px-6 py-6 h-auto text-lg shadow-lg hover:shadow-xl transition-all gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Plus className="w-6 h-6" />
            Nouvelle Publication
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-muted p-1 rounded-xl">
            {(["TOUT", "SIGNALEMENTS", "PROPOSITIONS"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filter === t 
                    ? "bg-card text-primary shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.charAt(0) + t.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text"
              placeholder="Rechercher une publication..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-card text-foreground"
            />
          </div>

          <select
            value={selectedCommune}
            onChange={(e) => setSelectedCommune(e.target.value)}
            className="px-4 py-2 border border-border rounded-xl bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">Toutes les communes</option>
            {communes.map(c => (
              <option key={c.id} value={c.id}>{c.nom}</option>
            ))}
          </select>
        </div>
      </header>

      {/* Feed */}
      <div className="space-y-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p>Chargement du fil d'actualité...</p>
          </div>
        ) : filteredPubs.length === 0 ? (
          <div className="text-center py-24 bg-muted/30 rounded-[32px] border-2 border-dashed border-border">
            <div className="w-20 h-20 bg-card rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl text-muted-foreground/20">
              <MessageSquare className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-black text-foreground italic">Aucune publication trouvée</h3>
            <p className="text-muted-foreground mt-2 font-medium">Soyez le premier à publier dans cette catégorie !</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredPubs.map((pub) => (
              <PublicationCard key={`${pub.type}-${pub.id}`} pub={pub} />
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Drawer Form */}
      <Drawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)}>
        <DrawerContent className="max-h-[90vh]">
          <div className="mx-auto w-full max-w-2xl overflow-y-auto p-6">
            <DrawerHeader className="px-0">
              <DrawerTitle className="text-2xl">Créer une publication</DrawerTitle>
              <DrawerDescription>
                Partagez un signalement d'anomalie ou proposez un projet pour votre commune.
              </DrawerDescription>
            </DrawerHeader>

            <div className="space-y-4 mb-8">
              {(user?.role === "CITOYEN" && user?.certification_status !== "APPROVED") && (
                <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5 shrink-0" />
                  <div className="text-sm text-orange-500">
                    <p className="font-bold">Certification Sentinelle Requise</p>
                    <p>Pour soumettre un engagement, votre compte doit être vérifié. Veuillez soumettre vos documents dans votre profil.</p>
                    <Button variant="link" className="p-0 h-auto text-orange-500 font-bold underline" onClick={() => window.location.href = '/profile'}>
                      Aller au profil
                    </Button>
                  </div>
                </div>
              )}
              
              <div className="flex gap-4 bg-muted p-1.5 rounded-2xl">
                <button
                  type="button"
                  onClick={() => {
                    setPubType("PROPOSITION");
                    setForm(prev => ({ ...prev, categorie: "INFRASTRUCTURE" }));
                  }}
                  disabled={user?.role === "CITOYEN" && user?.certification_status !== "APPROVED"}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all ${
                    pubType === "PROPOSITION" 
                      ? "bg-card text-blue-600 shadow-md" 
                      : "text-muted-foreground hover:text-foreground disabled:opacity-50"
                  }`}
                >
                  <Lightbulb className="w-5 h-5" />
                  Idée / Projet
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPubType("SIGNALEMENT");
                    setForm(prev => ({ ...prev, categorie: CATEGORIES_SIGNALEMENT[0] }));
                  }}
                  disabled={user?.role === "CITOYEN" && user?.certification_status !== "APPROVED"}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all ${
                    pubType === "SIGNALEMENT" 
                      ? "bg-card text-orange-600 shadow-md" 
                      : "text-muted-foreground hover:text-foreground disabled:opacity-50"
                  }`}
                >
                  <AlertTriangle className="w-5 h-5" />
                  Signalement
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 pb-10">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Titre de la publication</label>
                <input 
                  required
                  placeholder={pubType === "PROPOSITION" ? "Ex: Installation de lampadaires solaires" : "Ex: Dépôt d'ordures sauvage près de l'école"}
                  className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground"
                  value={form.titre}
                  onChange={e => setForm({...form, titre: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">Commune</label>
                  <select 
                    required
                    className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl text-foreground"
                    value={form.communeId}
                    onChange={e => setForm({...form, communeId: e.target.value})}
                  >
                    <option value="">Sélectionner</option>
                    {communes.map(c => (
                      <option key={c.id} value={c.id}>{c.nom}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">Catégorie</label>
                  <select 
                    required
                    className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl text-foreground"
                    value={form.categorie}
                    onChange={e => setForm({...form, categorie: e.target.value})}
                  >
                    <option value="">Choisir...</option>
                    {pubType === "PROPOSITION" ? (
                      CATEGORIES_PROPOSITION.map(c => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))
                    ) : (
                      CATEGORIES_SIGNALEMENT.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              {pubType === "PROPOSITION" && (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">Budget estimé (FCFA)</label>
                  <input 
                    type="number"
                    required
                    placeholder="Montant en FCFA"
                    className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl text-foreground"
                    value={form.budget}
                    onChange={e => setForm({...form, budget: e.target.value})}
                  />
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Description détaillée</label>
                <textarea 
                  required
                  rows={4}
                  placeholder="Décrivez votre publication en quelques lignes..."
                  className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl resize-none text-foreground"
                  value={form.description}
                  onChange={e => setForm({...form, description: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Pièces jointes (Preuves)</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {fichiers.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-lg text-sm border border-border">
                      <ImageIcon className="w-4 h-4 text-muted-foreground" />
                      <span className="max-w-[150px] truncate">{f.name}</span>
                      <button type="button" onClick={() => handleRemoveFichier(i)}>
                        <X className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  ))}
                  {fichiers.length < 5 && (
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-border rounded-xl text-muted-foreground hover:border-primary hover:text-primary transition-all text-sm"
                    >
                      <Paperclip className="w-4 h-4" />
                      Ajouter
                    </button>
                  )}
                </div>
                <input ref={fileRef} type="file" multiple className="hidden" onChange={handleAddFichier} accept="image/*,application/pdf" />
                <p className="text-xs text-muted-foreground">PDF, JPG, PNG acceptés (Max 10Mo par fichier).</p>
              </div>

              {formError && (
                <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  {formError}
                </div>
              )}

              {formSuccess ? (
                <div className="p-4 bg-green-50 text-green-600 rounded-xl font-bold flex items-center justify-center gap-3 animate-bounce">
                  <CheckCircle2 className="w-6 h-6" />
                  Publication publiée avec succès !
                </div>
              ) : (
                <Button 
                  disabled={formLoading || (user?.role === "CITOYEN" && user?.certification_status !== "APPROVED")}
                  className="w-full py-6 rounded-2xl text-lg font-bold shadow-xl bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50"
                >
                  {formLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Publier maintenant"}
                </Button>
              )}
            </form>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}

function PublicationCard({ pub, onVote }: { pub: Publication; onVote?: (type: "UP" | "DOWN") => void }) {
  const detailUrl = pub.type === "SIGNALEMENT" 
    ? `/public/engagements/signalement/${pub.id}` 
    : `/public/engagements/proposition/${pub.id}`;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <div className="group border-border hover:border-primary/50 transition-all shadow-sm hover:shadow-md rounded-3xl overflow-hidden bg-card border relative">
        <Link href={detailUrl} className="absolute inset-0 z-0" />
        <div className="p-0 relative z-10 pointer-events-none">
          <div className="p-5 md:p-6 flex flex-col md:flex-row gap-6">
            {/* Interaction Left Bar */}
            <div className="flex md:flex-col items-center justify-center gap-4 border-r md:border-r border-border pr-0 md:pr-6 md:w-16 pointer-events-auto">
              <div className="flex flex-col items-center">
                <button 
                  onClick={(e) => { e.preventDefault(); onVote?.("UP"); }}
                  className="p-2 hover:bg-primary/10 rounded-xl text-muted-foreground hover:text-primary transition-all"
                >
                  <ChevronDown className="w-6 h-6 rotate-180" />
                </button>
                <span className="font-bold text-lg my-1 text-foreground">{pub.votes}</span>
                <button 
                  onClick={(e) => { e.preventDefault(); onVote?.("DOWN"); }}
                  className="p-2 hover:bg-red-500/10 rounded-xl text-muted-foreground hover:text-red-500 transition-all"
                >
                  <ChevronDown className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 space-y-4 pointer-events-auto">
              <Link href={detailUrl} className="block space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge className={`rounded-full px-3 py-1 font-semibold ${
                    pub.type === "SIGNALEMENT" 
                      ? "bg-orange-500/10 text-orange-500 border-orange-500/20" 
                      : "bg-blue-500/10 text-blue-500 border-blue-500/20"
                  }`}>
                    {pub.type === "SIGNALEMENT" ? "⚠️ Signalement" : "💡 Proposition"}
                  </Badge>
                  
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <User className="w-4 h-4" />
                    <span>{pub.auteur}</span>
                    <span>•</span>
                    <Clock className="w-4 h-4" />
                    <span>{formatDateShort(pub.date)}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                    {pub.titre}
                  </h3>
                  <p className="text-muted-foreground line-clamp-3 leading-relaxed">
                    {pub.description}
                  </p>
                </div>
              </Link>

              <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-border mt-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="rounded-lg gap-1 border-border text-muted-foreground">
                    <MapPin className="w-3 h-3" />
                    {pub.commune}
                  </Badge>
                  {pub.badges.map(b => (
                    <Badge key={b} variant="secondary" className={`rounded-lg border-border ${
                      b === "ENQUETE_DGDDL" ? "bg-orange-500/20 text-orange-500 animate-pulse" :
                      b === "VALIDE_FRAUDE" ? "bg-red-500/20 text-red-500" :
                      b === "VIRAL" ? "bg-rose-500/20 text-rose-500" :
                      "text-muted-foreground"
                    }`}>
                      {b}
                    </Badge>
                  ))}
                </div>

                <div className="flex items-center gap-4 text-muted-foreground text-sm font-medium">
                  <Link href={detailUrl} className="flex items-center gap-1.5 hover:text-primary transition-colors cursor-pointer">
                    <MessageSquare className="w-4 h-4" />
                    {pub.commentairesCount}
                  </Link>
                  <div className="flex items-center gap-1.5 hover:text-primary transition-colors cursor-pointer">
                    <Share2 className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
