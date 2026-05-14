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
  "Infrastructure",
  "Éducation",
  "Santé",
  "Environnement",
  "Social",
  "Culture & Sport",
  "Autre",
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
    categorie: "",
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
      console.error("Fetch error:", err);
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
        setForm({ titre: "", description: "", communeId: "", categorie: "", budget: "" });
        setFichiers([]);
        fetchPublications();
      }, 2000);
    } catch (err: any) {
      setFormError(err.message || "Une erreur est survenue");
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
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
              Engagement Citoyen
            </h1>
            <p className="text-slate-500">Exprimez-vous, signalez et proposez pour votre commune.</p>
          </div>
          <Button 
            onClick={() => setIsDrawerOpen(true)}
            className="rounded-full px-6 py-6 h-auto text-lg shadow-lg hover:shadow-xl transition-all gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <Plus className="w-6 h-6" />
            Nouvelle Publication
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-xl">
            {(["TOUT", "SIGNALEMENTS", "PROPOSITIONS"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filter === t 
                    ? "bg-white text-indigo-600 shadow-sm" 
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {t.charAt(0) + t.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Rechercher une publication..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-white"
            />
          </div>

          <select
            value={selectedCommune}
            onChange={(e) => setSelectedCommune(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
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
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
            <p>Chargement du fil d'actualité...</p>
          </div>
        ) : filteredPubs.length === 0 ? (
          <div className="text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm text-slate-300">
              <MessageSquare className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-semibold text-slate-700">Aucune publication trouvée</h3>
            <p className="text-slate-500 mt-2">Soyez le premier à publier dans cette catégorie !</p>
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
      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
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
                <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5 shrink-0" />
                  <div className="text-sm text-orange-800">
                    <p className="font-bold">Certification Sentinelle Requise</p>
                    <p>Pour soumettre un engagement, votre compte doit être vérifié. Veuillez soumettre vos documents dans votre profil.</p>
                    <Button variant="link" className="p-0 h-auto text-orange-700 font-bold underline" onClick={() => window.location.href = '/profile'}>
                      Aller au profil
                    </Button>
                  </div>
                </div>
              )}
              
              <div className="flex gap-4 bg-slate-100 p-1.5 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setPubType("PROPOSITION")}
                  disabled={user?.role === "CITOYEN" && user?.certification_status !== "APPROVED"}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all ${
                    pubType === "PROPOSITION" 
                      ? "bg-white text-blue-600 shadow-md" 
                      : "text-slate-500 hover:text-slate-700 disabled:opacity-50"
                  }`}
                >
                  <Lightbulb className="w-5 h-5" />
                  Idée / Projet
                </button>
                <button
                  type="button"
                  onClick={() => setPubType("SIGNALEMENT")}
                  disabled={user?.role === "CITOYEN" && user?.certification_status !== "APPROVED"}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all ${
                    pubType === "SIGNALEMENT" 
                      ? "bg-white text-orange-600 shadow-md" 
                      : "text-slate-500 hover:text-slate-700 disabled:opacity-50"
                  }`}
                >
                  <AlertTriangle className="w-5 h-5" />
                  Signalement
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 pb-10">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Titre de la publication</label>
                <input 
                  required
                  placeholder={pubType === "PROPOSITION" ? "Ex: Installation de lampadaires solaires" : "Ex: Dépôt d'ordures sauvage près de l'école"}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  value={form.titre}
                  onChange={e => setForm({...form, titre: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Commune</label>
                  <select 
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl"
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
                  <label className="text-sm font-semibold text-slate-700">Catégorie</label>
                  <select 
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl"
                    value={form.categorie}
                    onChange={e => setForm({...form, categorie: e.target.value})}
                  >
                    <option value="">Choisir...</option>
                    {(pubType === "PROPOSITION" ? CATEGORIES_PROPOSITION : CATEGORIES_SIGNALEMENT).map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {pubType === "PROPOSITION" && (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Budget estimé (FCFA)</label>
                  <input 
                    type="number"
                    required
                    placeholder="Montant en FCFA"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl"
                    value={form.budget}
                    onChange={e => setForm({...form, budget: e.target.value})}
                  />
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Description détaillée</label>
                <textarea 
                  required
                  rows={4}
                  placeholder="Décrivez votre publication en quelques lignes..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl resize-none"
                  value={form.description}
                  onChange={e => setForm({...form, description: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Pièces jointes (Preuves)</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {fichiers.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg text-sm border border-slate-200">
                      <ImageIcon className="w-4 h-4 text-slate-500" />
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
                      className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-indigo-500 hover:text-indigo-600 transition-all text-sm"
                    >
                      <Paperclip className="w-4 h-4" />
                      Ajouter
                    </button>
                  )}
                </div>
                <input ref={fileRef} type="file" multiple className="hidden" onChange={handleAddFichier} accept="image/*,application/pdf" />
                <p className="text-xs text-slate-400">PDF, JPG, PNG acceptés (Max 10Mo par fichier).</p>
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
                  className="w-full py-6 rounded-2xl text-lg font-bold shadow-xl bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50"
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

function PublicationCard({ pub }: { pub: Publication }) {
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
      <Link href={detailUrl}>
        <Card className="group border-slate-200 hover:border-indigo-300 transition-all shadow-sm hover:shadow-md rounded-3xl overflow-hidden bg-white">
          <CardContent className="p-0">
            <div className="p-5 md:p-6 flex flex-col md:flex-row gap-6">
              {/* Interaction Left Bar */}
              <div className="flex md:flex-col items-center justify-center gap-4 border-r md:border-r border-slate-100 pr-0 md:pr-6 md:w-16">
                <div className="flex flex-col items-center">
                  <button className="p-2 hover:bg-indigo-50 rounded-xl text-slate-400 hover:text-indigo-600 transition-all">
                    <ChevronDown className="w-6 h-6 rotate-180" />
                  </button>
                  <span className="font-bold text-lg my-1">{pub.votes}</span>
                  <button className="p-2 hover:bg-red-50 rounded-xl text-slate-400 hover:text-red-600 transition-all">
                    <ChevronDown className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Main Content */}
              <div className="flex-1 space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge className={`rounded-full px-3 py-1 font-semibold ${
                    pub.type === "SIGNALEMENT" 
                      ? "bg-orange-100 text-orange-700 border-orange-200" 
                      : "bg-blue-100 text-blue-700 border-blue-200"
                  }`}>
                    {pub.type === "SIGNALEMENT" ? "⚠️ Signalement" : "💡 Proposition"}
                  </Badge>
                  
                  <div className="flex items-center gap-2 text-slate-400 text-sm">
                    <User className="w-4 h-4" />
                    <span>{pub.auteur}</span>
                    <span>•</span>
                    <Clock className="w-4 h-4" />
                    <span>{formatDateShort(pub.date)}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                    {pub.titre}
                  </h3>
                  <p className="text-slate-600 line-clamp-3 leading-relaxed">
                    {pub.description}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-50 mt-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="rounded-lg gap-1 border-slate-200 text-slate-500">
                      <MapPin className="w-3 h-3" />
                      {pub.commune}
                    </Badge>
                    {pub.badges.map(b => (
                      <Badge key={b} variant="secondary" className={`rounded-lg border-slate-100 ${
                        b === "ENQUETE_DGDDL" ? "bg-orange-100 text-orange-700 animate-pulse" :
                        b === "VALIDE_FRAUDE" ? "bg-red-100 text-red-700" :
                        b === "VIRAL" ? "bg-rose-100 text-rose-700" :
                        "text-slate-500"
                      }`}>
                        {b}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex items-center gap-4 text-slate-400 text-sm font-medium">
                    <div className="flex items-center gap-1.5 hover:text-indigo-600 transition-colors cursor-pointer">
                      <MessageSquare className="w-4 h-4" />
                      {pub.commentairesCount} commentaires
                    </div>
                    <div className="flex items-center gap-1.5 hover:text-indigo-600 transition-colors cursor-pointer">
                      <Share2 className="w-4 h-4" />
                      Partager
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
