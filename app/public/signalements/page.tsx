"use client";

import { useState, useEffect, useMemo } from "react";
import { signalementsApi, transactionsApi, type Signalement, type Transaction } from "@/lib/api";
import { useCommunesList } from "@/lib/hooks/useCommunes";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/Drawer";
import { ShieldAlert, Loader2, Building2, Clock, CheckCircle2, AlertTriangle, ExternalLink, Search, Plus, Send, Paperclip, X } from "lucide-react";
import { formatDateShort } from "@/lib/constants";
import Link from "next/link";
import { useRef } from "react";
import { ipfsService } from "@/lib/ipfs";

const CATEGORIES = [
  "Dépense suspecte",
  "Montant anormal",
  "Transaction sans justificatif",
  "Retard de publication",
  "Projet non réalisé",
  "Autre anomalie",
];

export default function SignalementsConsolidatedPage() {
  const { user } = useAuth();
  const { communes } = useCommunesList();
  const [signalements, setSignalements] = useState<Signalement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCommune, setSelectedCommune] = useState("");
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"tous" | "mes">("tous");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Form state
  const [form, setForm] = useState({
    categorie: "",
    description: "",
    communeId: "",
    sujet: "",
    transactionId: "",
  });
  const [fichiers, setFichiers] = useState<File[]>([]);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Transactions disponibles de la commune choisie (pour rattacher le signalement)
  const [communeTransactions, setCommuneTransactions] = useState<Transaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  // Recharge la liste des transactions quand la commune change dans le formulaire
  useEffect(() => {
    if (!form.communeId) {
      setCommuneTransactions([]);
      setForm((f) => ({ ...f, transactionId: "" }));
      return;
    }
    setLoadingTransactions(true);
    transactionsApi
      .list({ commune: Number(form.communeId), limit: 100 })
      .then((res) => setCommuneTransactions(res.results ?? []))
      .catch(() => setCommuneTransactions([]))
      .finally(() => setLoadingTransactions(false));
    // Si on change de commune, on reset la transaction choisie
    setForm((f) => ({ ...f, transactionId: "" }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.communeId]);

  // Fetch signalements
  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await signalementsApi.list({
          commune: selectedCommune ? Number(selectedCommune) : undefined,
          mes_signalements: tab === "mes",
        });
        setSignalements(res.results ?? []);
      } catch {
        setSignalements([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [selectedCommune, tab]);

  const filtered = useMemo(() => {
    return signalements.filter(s =>
      s.sujet.toLowerCase().includes(search.toLowerCase()) ||
      (s.commune_detail?.nom ?? "").toLowerCase().includes(search.toLowerCase())
    );
  }, [signalements, search]);

  const stats = useMemo(() => ({
    enAttente: filtered.filter(s => !s.is_reviewed).length,
    traites: filtered.filter(s => s.is_reviewed).length,
  }), [filtered]);

  // Form handlers
  const handleAddFichier = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(f => f.size <= 10 * 1024 * 1024);
    setFichiers(prev => [...prev, ...validFiles].slice(0, 5));
  };

  const handleRemoveFichier = (idx: number) => {
    setFichiers(prev => prev.filter((_, i) => i !== idx));
  };

  const uploadFichierToIPFS = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/ipfs", { method: "POST", body: formData });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Échec upload ${file.name}`);
    }
    const data = await res.json();
    return {
      ipfs_hash: data.ipfsHash,
      ipfs_url: `https://gateway.pinata.cloud/ipfs/${data.ipfsHash}`,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.communeId) return;
    setFormLoading(true);
    setFormError(null);
    try {
      const signalement = await signalementsApi.create({
        commune: Number(form.communeId),
        sujet: form.sujet || form.categorie || "Anomalie",
        description: form.description,
        transaction: form.transactionId || null,
      });

      if (fichiers.length > 0) {
        for (let i = 0; i < fichiers.length; i++) {
          const file = fichiers[i];
          const { ipfs_hash, ipfs_url } = await uploadFichierToIPFS(file);
          const type_fichier = file.type.startsWith("image/") ? "image" : file.type === "application/pdf" ? "pdf" : "autre";
          await signalementsApi.ajouterPreuve(signalement.id, {
            ipfs_hash,
            ipfs_url,
            nom_fichier: file.name,
            type_fichier,
          });
        }
      }

      setFormSuccess(true);
      setTimeout(() => {
        setIsDrawerOpen(false);
        setForm({ categorie: "", description: "", communeId: "", sujet: "", transactionId: "" });
        setFichiers([]);
        setFormSuccess(false);
      }, 1500);
    } catch (err: any) {
      setFormError(err.message || "Erreur lors de la création du signalement");
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* En-tête */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-card border border-border p-8 rounded-[32px] shadow-2xl shadow-primary/5">
        <div>
          <div className="flex items-center gap-2 bg-amber-500/10 text-amber-600 px-3 py-1 rounded-lg w-max mb-4 border border-amber-500/20">
            <ShieldAlert size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest">Transparence Communautaire</span>
          </div>
          <h2 className="text-3xl font-black text-foreground tracking-tight uppercase italic">Signalements</h2>
          <p className="text-muted-foreground mt-2 font-medium">Signalez des anomalies et suivez leur traitement.</p>
        </div>
        <div className="flex gap-3 shrink-0">
          <Button
            onClick={() => setIsDrawerOpen(true)}
            className="bg-amber-600 hover:bg-amber-700 text-white shadow-xl shadow-amber-600/20 rounded-2xl h-14 px-8 font-black text-base"
          >
            <Plus className="w-5 h-5 mr-2" /> Signaler
          </Button>
        </div>
      </div>

      {/* Onglets */}
      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => setTab("tous")}
          className={`px-4 py-3 font-black text-sm uppercase tracking-widest transition-all ${
            tab === "tous" ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Tous les signalements
        </button>
        {user && (
          <button
            onClick={() => setTab("mes")}
            className={`px-4 py-3 font-black text-sm uppercase tracking-widest transition-all ${
              tab === "mes" ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Mes signalements
          </button>
        )}
      </div>

      {/* Stats */}
      {tab === "tous" && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-amber-500/10 p-4 rounded-2xl border border-amber-200 text-center">
            <p className="text-2xl font-black text-amber-600">{stats.enAttente}</p>
            <p className="text-[10px] font-black text-amber-700 uppercase">En attente</p>
          </div>
          <div className="bg-emerald-500/10 p-4 rounded-2xl border border-emerald-200 text-center">
            <p className="text-2xl font-black text-emerald-600">{stats.traites}</p>
            <p className="text-[10px] font-black text-emerald-700 uppercase">Traités</p>
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un signalement..."
            className="w-full bg-card border border-border rounded-2xl pl-11 pr-4 h-12 text-sm outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <select
          value={selectedCommune}
          onChange={e => setSelectedCommune(e.target.value)}
          className="bg-card border border-border rounded-2xl px-4 h-12 text-sm outline-none focus:ring-2 focus:ring-primary min-w-[200px]"
        >
          <option value="">Toutes les communes</option>
          {communes.map((c: any) => (
            <option key={c.id} value={c.id}>{c.nom}</option>
          ))}
        </select>
      </div>

      {/* Liste */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <ShieldAlert className="w-16 h-16 mb-4 opacity-20" />
          <p className="font-black uppercase tracking-widest text-xs">Aucun signalement trouvé</p>
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
                          <Building2 size={11} /> {s.commune_detail.nom}
                        </span>
                      )}
                      {(s as any).nb_preuves > 0 && (
                        <Badge className="bg-purple-500/10 text-purple-700 border-purple-500/20 text-[10px] font-black">
                          📎 {(s as any).nb_preuves} preuve(s) IPFS
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-black text-foreground">{s.sujet}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">{s.description}</p>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Clock size={11} /> {formatDateShort(s.created_at)}
                    </p>
                  </div>
                  <Link href={`/public/signalements/${s.id}`}>
                    <Button variant="outline" className="rounded-xl h-9 px-4 text-[10px] font-bold">
                      <ExternalLink size={12} /> Détail
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Drawer */}
      <Drawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)}>
        <DrawerContent className="max-w-2xl mx-auto rounded-t-[32px] border-x border-t border-border bg-card shadow-2xl p-0 overflow-hidden">
          <div className="mx-auto w-12 h-1.5 bg-muted rounded-full mt-4 mb-2" />
          <DrawerHeader className="px-10 pt-6 pb-2">
            <DrawerTitle className="text-2xl font-black uppercase tracking-tight italic">Nouveau Signalement</DrawerTitle>
            <DrawerDescription className="text-muted-foreground font-medium italic mt-1">
              Signalez une anomalie avec preuves. Ajoutez des fichiers (images, PDF) pour +points de réputation.
            </DrawerDescription>
          </DrawerHeader>

          <div className="px-10 py-6 space-y-6 max-h-[80vh] overflow-y-auto">
            {formSuccess ? (
              <div className="py-8 text-center">
                <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <p className="font-black text-foreground">Signalement créé avec succès!</p>
                <p className="text-sm text-muted-foreground mt-2">Merci de votre contribution à la transparence.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {formError && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-600 font-bold">
                    {formError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-black uppercase text-muted-foreground tracking-widest mb-2">Commune *</label>
                  <select
                    value={form.communeId}
                    onChange={e => setForm({...form, communeId: e.target.value})}
                    required
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Sélectionnez une commune</option>
                    {communes.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.nom}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-muted-foreground tracking-widest mb-2">Catégorie *</label>
                  <select
                    value={form.categorie}
                    onChange={e => setForm({...form, categorie: e.target.value})}
                    required
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Sélectionnez une catégorie</option>
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Transaction concernee (optionnel) - active uniquement si commune choisie */}
                <div>
                  <label className="block text-xs font-black uppercase text-muted-foreground tracking-widest mb-2">
                    Transaction concernée <span className="text-muted-foreground/60 normal-case font-bold">(optionnel)</span>
                  </label>
                  <select
                    value={form.transactionId}
                    onChange={e => setForm({...form, transactionId: e.target.value})}
                    disabled={!form.communeId || loadingTransactions}
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {!form.communeId ? (
                      <option value="">Choisissez d'abord une commune</option>
                    ) : loadingTransactions ? (
                      <option value="">Chargement des transactions…</option>
                    ) : (
                      <>
                        <option value="">Aucune transaction spécifique</option>
                        {communeTransactions.map((tx) => (
                          <option key={tx.id} value={tx.id}>
                            {tx.type === "DEPENSE" ? "📤" : "📥"} {tx.montant_fcfa.toLocaleString()} FCFA — {tx.categorie} — {tx.statut} ({(tx.periode ?? "").slice(0, 7)})
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                  {form.communeId && !loadingTransactions && communeTransactions.length === 0 && (
                    <p className="text-[10px] text-muted-foreground mt-1.5">
                      Aucune transaction trouvée pour cette commune.
                    </p>
                  )}
                  {form.transactionId && (
                    <p className="text-[10px] text-emerald-600 font-bold mt-1.5">
                      ✓ Signalement rattaché à cette transaction. Le verdict DGDDL aura un impact direct sur la transaction et ses responsables.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-muted-foreground tracking-widest mb-2">Sujet</label>
                  <input
                    type="text"
                    value={form.sujet}
                    onChange={e => setForm({...form, sujet: e.target.value})}
                    placeholder="Titre du signalement"
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-muted-foreground tracking-widest mb-2">Description *</label>
                  <textarea
                    value={form.description}
                    onChange={e => setForm({...form, description: e.target.value})}
                    required
                    placeholder="Décrivez l'anomalie en détail..."
                    rows={4}
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-muted-foreground tracking-widest mb-2">Preuves (Images/PDF)</label>
                  <input
                    ref={fileRef}
                    type="file"
                    multiple
                    onChange={handleAddFichier}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileRef.current?.click()}
                    className="w-full"
                  >
                    <Paperclip className="w-4 h-4 mr-2" /> Ajouter des fichiers
                  </Button>
                  {fichiers.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {fichiers.map((f, i) => (
                        <div key={i} className="flex items-center justify-between p-2 bg-background border border-border rounded-lg text-sm">
                          <span className="truncate">{f.name}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveFichier(i)}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Button type="submit" disabled={formLoading} className="w-full bg-primary hover:bg-primary/90 text-white font-black">
                  {formLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                  {formLoading ? "Envoi..." : "Créer le signalement"}
                </Button>
              </form>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
