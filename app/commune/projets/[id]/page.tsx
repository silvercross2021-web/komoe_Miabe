"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { projetsApi, transactionsApi, type Projet } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { 
  Building2, 
  Activity, 
  Target, 
  ShieldCheck, 
  ChevronLeft, 
  Loader2, 
  Save, 
  ExternalLink,
  Calendar,
  Wallet,
  TrendingUp,
  History,
  CheckCircle2
} from "lucide-react";
import { formatFCFA, formatDateShort, polygonscanTxUrl } from "@/lib/constants";
import { motion, AnimatePresence } from "framer-motion";
import { ipfsService } from "@/lib/ipfs";

export default function ProjetDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [projet, setProjet] = useState<Projet | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [completionProof, setCompletionProof] = useState<File | null>(null);
  const [executionRate, setExecutionRate] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pData, tData] = await Promise.all([
          projetsApi.getDetail(id as string),
          transactionsApi.list({ projet: Number(id), statut: "VALIDEE" })
        ]);
        setProjet(pData);
        setExecutionRate(pData.taux_execution);
        setTransactions(tData.results || []);
      } catch (err) {
        console.error("Erreur chargement données:", err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchData();
  }, [id]);

  const handleUpdateProgress = async () => {
    if (projet && executionRate < projet.taux_execution) {
      alert("Erreur : La progression ne peut qu'augmenter.");
      return;
    }
    setUpdating(true);
    try {
      const updated = await projetsApi.update(id as string, { 
        taux_execution: executionRate,
        statut: executionRate === 100 ? "ACHEVE" : "EN_COURS"
      });
      setProjet(updated);
      alert("Progression physique mise à jour !");
    } catch (err: any) {
      alert("Erreur: " + err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleCloseProject = async () => {
    if (!completionProof) return alert("Veuillez joindre une preuve de fin de travaux (photo, rapport).");
    if (!window.confirm("Voulez-vous clore définitivement ce projet ? Cette action est irréversible.")) return;

    setUpdating(true);
    try {
      const cid = await ipfsService.uploadFile(completionProof);
      const proofUrl = `https://ipfs.io/ipfs/${cid}`;
      
      const updated = await projetsApi.update(id as string, { 
        taux_execution: 100,
        statut: "ACHEVE",
        blockchain_audit_hash: cid // On utilise le CID comme hash d'audit de fin
      });
      setProjet(updated);
      setExecutionRate(100);
      alert("Projet clos avec succès ! La preuve a été ancrée sur IPFS.");
    } catch (err: any) {
      alert("Erreur lors de la clôture: " + err.message);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Loader2 className="w-10 h-10 animate-spin text-primary" />
      <p className="text-sm font-black uppercase tracking-widest text-muted-foreground">Ouverture du dossier projet...</p>
    </div>
  );

  if (!projet) return (
    <div className="text-center py-20">
      <h2 className="text-2xl font-black text-foreground italic uppercase">Projet introuvable</h2>
      <Button onClick={() => router.back()} variant="ghost" className="mt-4">
        Retour aux projets
      </Button>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-24">
      {/* Top Nav */}
      <button 
        onClick={() => router.back()}
        className="group flex items-center gap-2 text-muted-foreground hover:text-primary transition-all font-black uppercase text-[10px] tracking-widest"
      >
        <div className="p-2 bg-muted rounded-xl group-hover:bg-primary group-hover:text-white transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </div>
        Retour au plan d'investissement
      </button>

      {/* Header Card */}
      <div className="relative overflow-hidden bg-card rounded-[40px] border border-border shadow-2xl shadow-primary/5">
        {/* Abstract Background element */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />
        
        <div className="relative p-8 md:p-12 space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <Badge className="bg-primary/10 text-primary border-primary/20 rounded-full px-5 py-1.5 font-black text-[10px] uppercase tracking-wider">
                  <Target className="w-3 h-3 mr-2" /> Projet Municipal
                </Badge>
                <Badge variant="outline" className="rounded-full px-5 py-1.5 border-border font-black text-[10px] uppercase tracking-wider text-muted-foreground">
                  Statut: {projet.statut}
                </Badge>
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tight italic uppercase leading-none">
                {projet.nom}
              </h1>
            </div>
            
            <div className="flex flex-col items-end gap-2">
              <div className="bg-foreground text-background px-6 py-4 rounded-[28px] shadow-xl">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Budget Total Alloué</p>
                <p className="text-2xl font-black italic">{formatFCFA(projet.budget_alloue_fcfa)}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 border-t border-border/50">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-muted rounded-3xl text-primary">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Inauguré le</p>
                <p className="font-black text-foreground uppercase italic">{formatDateShort(projet.created_at)}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="p-4 bg-muted rounded-3xl text-emerald-600">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Contrôle</p>
                <p className="font-black text-emerald-600 uppercase italic">Certifié On-Chain</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="p-4 bg-muted rounded-3xl text-blue-600">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Localité</p>
                <p className="font-black text-foreground uppercase italic">{projet.commune_detail?.nom || "Commune"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Progress Management */}
          <Card className="rounded-[40px] border-border bg-card shadow-lg overflow-hidden">
            <CardHeader className="p-8 border-b border-border bg-muted/30">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3 text-sm font-black uppercase tracking-[0.2em] italic">
                  <Activity className="w-5 h-5 text-primary" />
                  Mise à jour de l'exécution
                </CardTitle>
                <div className="text-3xl font-black text-primary italic">
                  {executionRate}%
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-10">
              <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                Ajustez le curseur pour refléter l'avancement physique réel constaté sur le terrain. 
                Ce taux est visible par tous les citoyens de la commune.
              </p>
              
              <div className="space-y-6">
                <div className="flex justify-between items-center mb-2">
                   <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">Avancement Physique (Réel)</span>
                   <span className="text-xl font-black text-primary">{executionRate}%</span>
                </div>
                <div className="h-4 w-full bg-muted rounded-full overflow-hidden relative border border-border/50">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${executionRate}%` }}
                    className="h-full bg-gradient-to-r from-primary to-blue-600 rounded-full"
                  />
                  <input 
                    type="range"
                    min={projet.taux_execution}
                    max="100"
                    step="5"
                    value={executionRate}
                    onChange={(e) => setExecutionRate(parseInt(e.target.value))}
                    disabled={projet.statut === "ACHEVE"}
                    className="absolute inset-0 w-full h-full cursor-pointer accent-primary opacity-50 hover:opacity-100 transition-opacity"
                  />
                </div>
                <p className="text-[9px] font-black uppercase text-amber-500/70 tracking-tighter italic">
                  Note: La progression est irréversible. Vous ne pouvez pas revenir en arrière.
                </p>

                <div className="pt-4 space-y-4">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                     <span className="text-muted-foreground italic">Indicateur Financier (Dépensé)</span>
                     <span className="text-foreground">{((projet.budget_consomme_fcfa / projet.budget_alloue_fcfa) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(projet.budget_consomme_fcfa / projet.budget_alloue_fcfa) * 100}%` }}
                      className="h-full bg-foreground opacity-30"
                    />
                  </div>
                </div>
              </div>

              {projet.statut !== "ACHEVE" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button 
                    onClick={handleUpdateProgress}
                    disabled={updating || executionRate === projet.taux_execution}
                    className="h-16 rounded-2xl bg-primary text-white hover:opacity-90 font-black uppercase tracking-widest text-xs transition-all flex items-center gap-3 shadow-xl"
                  >
                    {updating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    Enregistrer la progression
                  </Button>
                  
                  <div className="flex flex-col gap-2">
                    <input 
                      type="file" 
                      id="proof" 
                      className="hidden" 
                      onChange={(e) => setCompletionProof(e.target.files?.[0] || null)}
                    />
                    <label 
                      htmlFor="proof" 
                      className={`h-16 rounded-2xl border-2 border-dashed flex items-center justify-center cursor-pointer transition-all ${completionProof ? 'border-emerald-500 bg-emerald-500/5 text-emerald-600' : 'border-border hover:border-primary/30'}`}
                    >
                      <span className="text-[10px] font-black uppercase tracking-widest">
                        {completionProof ? `✓ ${completionProof.name.slice(0, 15)}...` : "Joindre preuve de fin"}
                      </span>
                    </label>
                    <Button 
                      onClick={handleCloseProject}
                      disabled={updating || !completionProof}
                      className={`h-12 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${!completionProof ? 'bg-muted text-muted-foreground cursor-not-allowed' : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg'}`}
                    >
                      {updating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      Clôturer le Projet
                    </Button>
                    {!completionProof && (
                      <p className="text-[9px] font-bold text-amber-500 uppercase text-center mt-1 italic">
                        Joindre une preuve pour clore
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-6 bg-emerald-500/10 border-2 border-emerald-500/30 rounded-3xl flex items-center justify-center gap-3 text-emerald-600 font-black uppercase tracking-widest text-sm">
                   <CheckCircle2 className="w-6 h-6" /> Projet Terminé & Archivé
                </div>
              )}
            </CardContent>
          </Card>

          {/* Description */}
          <Card className="rounded-[40px] border-border bg-card shadow-lg">
            <CardHeader className="p-8 pb-0">
              <CardTitle className="text-sm font-black uppercase tracking-[0.2em] italic">
                Description & Objectifs
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <p className="text-lg leading-relaxed text-foreground/80 font-medium italic">
                {projet.description}
              </p>
            </CardContent>
          </Card>

          {/* Transactions History */}
          <div id="transactions-list" className="space-y-6 scroll-mt-20">
            <h3 className="text-sm font-black uppercase tracking-[0.3em] italic flex items-center gap-3 ml-4">
              <History className="w-5 h-5 text-primary" />
              Historique des Saisies Validées
            </h3>
            
            {transactions.length === 0 ? (
              <Card className="rounded-[32px] border-dashed border-2 border-border p-12 text-center bg-transparent">
                <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Aucune dépense enregistrée pour le moment</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {transactions.map((tx) => (
                  <motion.div 
                    key={tx.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-6 bg-card border border-border rounded-[32px] flex items-center justify-between group hover:border-primary/30 transition-all shadow-sm"
                  >
                    <div className="flex items-center gap-4">
                       <div className={`p-3 rounded-2xl ${tx.type === 'DEPENSE' ? 'bg-red-500/10 text-red-600' : 'bg-emerald-500/10 text-emerald-600'}`}>
                          <Wallet className="w-5 h-5" />
                       </div>
                       <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                            {tx.categorie} • {formatDateShort(tx.created_at)}
                          </p>
                          <p className="font-bold text-foreground">{tx.description || "Sans description"}</p>
                       </div>
                    </div>
                    <div className="text-right">
                       <p className={`text-lg font-black italic ${tx.type === 'DEPENSE' ? 'text-red-600' : 'text-emerald-600'}`}>
                          {tx.type === 'DEPENSE' ? '-' : '+'}{formatFCFA(tx.montant_fcfa)}
                       </p>
                       <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Montant TTC</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-8">
          {/* Financial Summary */}
          <Card className="rounded-[40px] border-border bg-foreground text-background shadow-2xl overflow-hidden">
            <CardContent className="p-8 space-y-6">
              <div className="flex items-center gap-3 text-primary">
                <Wallet className="w-6 h-6" />
                <span className="text-[10px] font-black uppercase tracking-widest">Suivi Financier</span>
              </div>
              
              <div className="space-y-4">
                <div className="p-5 bg-background/10 rounded-3xl border border-background/20">
                  <p className="text-[10px] font-black text-background/50 uppercase tracking-widest mb-1">Budget Initial</p>
                  <p className="text-xl font-black">{formatFCFA(projet.budget_alloue_fcfa)}</p>
                </div>
                
                <div className="p-5 bg-background/10 rounded-3xl border border-background/20">
                  <p className="text-[10px] font-black text-background/50 uppercase tracking-widest mb-1">Dépenses Réelles</p>
                  <p className="text-xl font-black">{formatFCFA(projet.budget_consomme_fcfa)}</p>
                  <p className="text-[9px] font-bold text-emerald-400 mt-1 uppercase italic">Validé par l'audit</p>
                </div>
              </div>
              
              <Button 
                className="w-full h-14 rounded-2xl bg-white text-black hover:bg-white/90 font-black uppercase text-[10px] tracking-widest shadow-lg"
                onClick={() => {
                   const el = document.getElementById('transactions-list');
                   el?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Consulter les saisies <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          {/* Blockchain Audit */}
          <Card className="rounded-[40px] border-border bg-card shadow-lg">
            <CardContent className="p-8 space-y-6">
              <div className="flex items-center gap-3 text-emerald-600">
                <ShieldCheck className="w-6 h-6" />
                <span className="text-[10px] font-black uppercase tracking-widest">Transparence Blockchain</span>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  <p className="text-[10px] font-black text-foreground uppercase tracking-widest">Audit On-Chain Actif</p>
                </div>
                <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                  Chaque étape de ce projet est ancrée sur la blockchain Polygon pour garantir l'intégrité des données et prévenir les détournements.
                </p>
                
                {projet.blockchain_audit_hash ? (
                  <a 
                    href={polygonscanTxUrl(projet.blockchain_audit_hash)}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-between p-4 bg-muted rounded-2xl border border-border group hover:border-primary/30 transition-all"
                  >
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-primary">Voir Certificat</span>
                    <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                  </a>
                ) : (
                  <div className="p-4 bg-muted/50 rounded-2xl border border-dashed border-border text-center">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Ancrage Initial...</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
