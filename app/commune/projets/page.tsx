"use client";

import { useEffect, useState } from "react";
import { projetsApi, type Projet } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Loader2, Search, Building2, Plus, Edit2, BarChart3, TrendingUp, CheckCircle2, X } from "lucide-react";
import { ProjetCard } from "@/components/projets/ProjetCard";
import { Button } from "@/components/ui/Button";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

const STATUT_OPTIONS = [
  { value: "EN_ATTENTE", label: "En attente" },
  { value: "EN_COURS", label: "En cours" },
  { value: "ACHEVE", label: "Achevé" },
  { value: "ANNULE", label: "Annulé" },
];

export default function CommuneProjetsPage() {
  const { user } = useAuth();
  const [projets, setProjets] = useState<Projet[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [newProjet, setNewProjet] = useState({
    nom: "",
    description: "",
    budget_alloue_fcfa: "",
    statut: "EN_ATTENTE",
  });

  const fetchProjets = async () => {
    setLoading(true);
    try {
      const communeId = user?.commune;
      const data = await projetsApi.list(communeId ? { commune: communeId } : undefined);
      const results = Array.isArray(data) ? data : (data as any)?.results || [];
      setProjets(results);
    } catch (err) {
      console.error("Erreur chargement projets:", err);
      setProjets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.commune) {
      fetchProjets();
    }
  }, [user?.commune]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.commune) return;
    setCreating(true);
    setCreateError(null);
    try {
      await projetsApi.create({
        commune: user.commune as any,
        nom: newProjet.nom,
        description: newProjet.description,
        budget_alloue_fcfa: Number(newProjet.budget_alloue_fcfa),
        statut: newProjet.statut as any,
      });
      setIsModalOpen(false);
      setNewProjet({ nom: "", description: "", budget_alloue_fcfa: "", statut: "EN_ATTENTE" });
      fetchProjets();
    } catch (err: any) {
      setCreateError(err?.message || "Erreur lors de la création du projet.");
    } finally {
      setCreating(false);
    }
  };

  const filtered = projets.filter(p => 
    p.nom.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: projets.length,
    enCours: projets.filter(p => p.statut === "EN_COURS").length,
    termine: projets.filter(p => p.statut === "ACHEVE").length,
    avgTaux: projets.length > 0 
      ? Math.round(projets.reduce((acc, p) => acc + (p.taux_execution || 0), 0) / projets.length) 
      : 0
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-card border border-border p-8 rounded-[32px] shadow-2xl shadow-primary/5">
        <div>
          <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-600 px-3 py-1 rounded-lg w-max mb-4 border border-emerald-500/20">
            <Building2 size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest">Gestion Municipale</span>
          </div>
          <h2 className="text-3xl font-black text-foreground tracking-tight uppercase italic">Gestion des Projets</h2>
          <p className="text-muted-foreground mt-2 font-medium">
            Pilotez l'exécution des projets et mettez à jour l'état d'avancement réel.
          </p>
        </div>
        
        <div className="flex gap-3">
           <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-12 pl-12 pr-4 bg-background border border-border rounded-2xl text-xs font-medium focus:ring-2 focus:ring-primary/20 transition-all outline-none w-64"
              />
           </div>
           {user?.role === "MAIRE" && (
             <Button
               onClick={() => setIsModalOpen(true)}
               className="h-12 px-6 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-primary/20 italic"
             >
                <Plus className="w-4 h-4 mr-2" /> Nouveau Projet
             </Button>
           )}
        </div>
      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Projets Totaux", value: stats.total, icon: Building2, color: "text-blue-600" },
          { label: "En Exécution", value: stats.enCours, icon: TrendingUp, color: "text-orange-600" },
          { label: "Taux Moyen", value: `${stats.avgTaux}%`, icon: BarChart3, color: "text-emerald-600" },
          { label: "Terminés", value: stats.termine, icon: CheckCircle2, color: "text-primary" },
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

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-sm font-black uppercase tracking-widest text-muted-foreground">Chargement des projets...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-32 text-center bg-card rounded-[40px] border border-dashed border-border">
          <Building2 className="w-16 h-16 mx-auto mb-4 opacity-10" />
          <p className="text-sm font-black text-muted-foreground uppercase tracking-widest">Aucun projet à afficher</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((projet, idx) => (
            <motion.div
              key={projet.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="relative group"
            >
              <ProjetCard projet={projet} />
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <Link href={`/commune/projets/${projet.id}`}>
                  <Button variant="secondary" size="icon" className="rounded-full shadow-xl">
                    <Edit2 size={14} />
                  </Button>
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal création de projet */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-card border border-border rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden"
            >
              <div className="flex items-center justify-between p-8 border-b border-border">
                <div>
                  <h3 className="text-xl font-black uppercase italic tracking-tight">Nouveau Projet</h3>
                  <p className="text-xs text-muted-foreground font-medium mt-1">Créez un projet municipal pour votre commune</p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreate} className="p-8 space-y-5">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-muted-foreground mb-2">Nom du projet *</label>
                  <input
                    required
                    type="text"
                    placeholder="Ex: Rénovation du marché central"
                    value={newProjet.nom}
                    onChange={(e) => setNewProjet(p => ({ ...p, nom: e.target.value }))}
                    className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-muted-foreground mb-2">Description</label>
                  <textarea
                    rows={3}
                    placeholder="Décrivez les objectifs et bénéficiaires du projet..."
                    value={newProjet.description}
                    onChange={(e) => setNewProjet(p => ({ ...p, description: e.target.value }))}
                    className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-muted-foreground mb-2">Budget alloué (FCFA) *</label>
                    <input
                      required
                      type="number"
                      min="0"
                      placeholder="Ex: 50000000"
                      value={newProjet.budget_alloue_fcfa}
                      onChange={(e) => setNewProjet(p => ({ ...p, budget_alloue_fcfa: e.target.value }))}
                      className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-muted-foreground mb-2">Statut initial</label>
                    <select
                      value={newProjet.statut}
                      onChange={(e) => setNewProjet(p => ({ ...p, statut: e.target.value }))}
                      className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                    >
                      {STATUT_OPTIONS.map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {createError && (
                  <p className="text-xs font-bold text-red-500 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{createError}</p>
                )}

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 h-12 rounded-2xl font-bold"
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    disabled={creating}
                    className="flex-[2] h-12 rounded-2xl font-black shadow-lg shadow-primary/20"
                  >
                    {creating ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" /> Création...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Plus className="w-4 h-4" /> Créer le projet
                      </span>
                    )}
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

