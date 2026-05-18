"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, AlertTriangle, MapPin, Calendar, Users, Camera, CheckCircle2, Download, Loader2, ShieldAlert } from "lucide-react";
import { signalementsApi, type Signalement } from "@/lib/api";
import { SectionCommentaires } from "@/components/ui/SectionCommentaires";

import { useAuth } from "@/lib/auth-context";

export default function SignalementDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { user } = useAuth();
  const [signalement, setSignalement] = useState<Signalement | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDetail = async () => {
    try {
      const res = await signalementsApi.detail(id);
      setSignalement(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);


  if (loading) return (
    <div className="flex flex-col items-center justify-center py-32 gap-4">
      <Loader2 className="w-10 h-10 animate-spin text-primary" />
      <p className="text-sm font-black uppercase tracking-widest text-muted-foreground">Récupération des pièces jointes...</p>
    </div>
  );

  if (!signalement) return (
    <div className="max-w-2xl mx-auto py-20 text-center">
      <div className="bg-red-50 p-8 rounded-[32px] border border-red-100">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-black text-foreground">Signalement introuvable</h3>
        <Link href="/commune/signalements">
          <Button className="mt-6">Retour</Button>
        </Link>
      </div>
    </div>
  );

  return (
    <div className="animate-in fade-in duration-500 max-w-4xl mx-auto pb-12">
      <Link href="/commune/signalements" className="inline-flex items-center text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-primary mb-10 transition-colors">
        <ArrowLeft className="w-5 h-5 mr-2" /> Retour au flux
      </Link>

      <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-12">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <h2 className="text-4xl font-black text-foreground tracking-tight uppercase italic">{signalement.sujet}</h2>
            <Badge variant={signalement.is_reviewed ? "success" : "secondary"} className="h-8 px-4 rounded-full font-black text-[10px] uppercase">
              {signalement.is_reviewed ? "TRAITÉ" : "EN ATTENTE D'ACTION"}
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-6 text-muted-foreground font-bold text-xs uppercase tracking-widest italic">
            <span className="flex items-center gap-2"><MapPin size={16} className="text-primary" /> {signalement.commune_detail?.nom || "Localisation non précisée"}</span>
            <span className="flex items-center gap-2"><Calendar size={16} className="text-primary" /> Signalé le {new Date(signalement.created_at).toLocaleDateString('fr-FR', { dateStyle: 'long' })}</span>
          </div>
        </div>
        <div className="flex flex-col items-center p-6 bg-primary/5 rounded-[32px] border border-primary/10 shadow-xl shadow-primary/5 min-w-[120px]">
          <span className="text-4xl font-black text-primary">{signalement.nb_votes ?? 0}</span>
          <span className="text-[10px] font-black text-primary/60 uppercase tracking-widest mt-1">Votes citoyens</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <Card className="lg:col-span-3 shadow-2xl border-border rounded-[40px] overflow-hidden border bg-card/50 backdrop-blur-xl">
          <CardContent className="p-10">
            <h3 className="text-xl font-black text-foreground mb-8 uppercase tracking-tight italic flex items-center gap-3">
               <Users className="text-primary" size={20} /> Détails de l'incident
            </h3>
            <div className="prose prose-sm max-w-none text-muted-foreground leading-relaxed font-medium italic mb-10" dangerouslySetInnerHTML={{ __html: signalement.description }} />
            
            <div className="pt-10 border-t border-border">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4 italic">Citoyen émetteur</p>
              <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-[24px] border border-border">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary"><Users size={24} /></div>
                <div>
                  <p className="font-black text-foreground uppercase text-xs">{signalement.auteur_detail?.full_name || "Anonyme"}</p>
                  <p className="text-[10px] text-muted-foreground font-bold italic">Compte Citoyen Certifié</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-8">
          <Card className="shadow-2xl border-border rounded-[40px] overflow-hidden border bg-card/50 backdrop-blur-xl">
            <CardContent className="p-10">
              <h3 className="text-xl font-black text-foreground mb-8 uppercase tracking-tight italic flex items-center gap-3">
                <Camera className="text-primary" size={20} /> Pièces Jointes
              </h3>
              {signalement.preuves && signalement.preuves.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {signalement.preuves.map((preuve) => (
                    <a
                      key={preuve.id}
                      href={preuve.ipfs_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-4 bg-muted/50 rounded-2xl border border-border hover:border-primary/50 transition-all group"
                    >
                      {preuve.type_fichier === "image" ? (
                        <Camera className="w-5 h-5 text-primary shrink-0" />
                      ) : (
                        <Download className="w-5 h-5 text-primary shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-black text-foreground truncate">{preuve.nom_fichier}</p>
                        <p className="text-[9px] font-mono text-muted-foreground truncate">{preuve.ipfs_hash}</p>
                      </div>
                      <Download size={14} className="text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                    </a>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Camera className="w-10 h-10 text-muted-foreground/20 mb-3" />
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Aucune preuve jointe</p>
                </div>
              )}
              <p className="mt-4 text-[10px] text-muted-foreground font-bold italic leading-relaxed text-center">
                Les pièces jointes sont certifiées sur IPFS et ne peuvent pas être modifiées après le signalement.
              </p>
            </CardContent>
          </Card>

          <div className="p-8 bg-card border border-border rounded-[32px] text-center space-y-4">
            <ShieldAlert className="w-10 h-10 text-primary mx-auto opacity-20" />
            <div className="space-y-1">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-foreground">Traitement Souverain</p>
              <p className="text-[10px] text-muted-foreground font-bold italic px-4">
                La résolution des signalements est gérée exclusivement par le <span className="text-primary">DGDDL</span> (Contrôle National) pour garantir l'impartialité des enquêtes.
              </p>
            </div>
            
            {signalement.statut === "NOUVEAU" && (
              <Badge className="bg-blue-500/10 text-blue-700 border-blue-500/20 text-[10px] font-black uppercase py-2 px-4 rounded-full">
                🆕 Nouveau — En attente d'examen DGDDL
              </Badge>
            )}

            {signalement.statut === "VIRAL" && (
              <Badge className="bg-amber-500/10 text-amber-700 border-amber-500/20 text-[10px] font-black uppercase py-2 px-4 rounded-full animate-pulse">
                🔥 Viral — Intervention DGDDL recommandée
              </Badge>
            )}

            {signalement.statut === "ENQUETE_DGDDL" && (
              <Badge className="bg-orange-500/10 text-orange-700 border-orange-500/20 text-[10px] font-black uppercase py-2 px-4 rounded-full animate-pulse">
                ⚖️ Enquête DGDDL en cours
              </Badge>
            )}

            {signalement.statut === "VALIDE_FRAUDE" && (
              <Badge className="bg-red-500/10 text-red-700 border-red-500/20 text-[10px] font-black uppercase py-2 px-4 rounded-full">
                🔴 Fraude confirmée par DGDDL
              </Badge>
            )}

            {signalement.statut === "REJETE_FAUX" && (
              <Badge className="bg-zinc-500/10 text-zinc-700 border-zinc-500/20 text-[10px] font-black uppercase py-2 px-4 rounded-full">
                ⚪ Signalement faux
              </Badge>
            )}

            {signalement.statut === "CLOS" && (
              <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-500/20 text-[10px] font-black uppercase py-2 px-4 rounded-full">
                ⚫ Clos
              </Badge>
            )}
          </div>

          {/* IMPACT POUR VOTRE COMMUNE (visible uniquement si verdict rendu) */}
          {signalement.resolution && (
            <div className={`p-6 rounded-[32px] border-2 ${
              signalement.resolution === "FRAUDE"
                ? "bg-red-500/5 border-red-500/30"
                : signalement.resolution === "FAUX"
                ? "bg-emerald-500/5 border-emerald-500/30"
                : "bg-zinc-500/5 border-zinc-500/30"
            }`}>
              <p className="text-[10px] font-black uppercase tracking-widest mb-4 text-muted-foreground">Impact sur votre commune</p>

              {signalement.resolution === "FRAUDE" && (
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center shrink-0">
                      <span className="text-base font-black text-red-600">−20</span>
                    </div>
                    <div>
                      <p className="text-sm font-black text-red-700 dark:text-red-300">Pénalité de réputation</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                        Votre score de réputation personnel a été abaissé de 20 points suite à la confirmation de la fraude.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center shrink-0">
                      <span className="text-lg">📉</span>
                    </div>
                    <div>
                      <p className="text-sm font-black text-red-700 dark:text-red-300">Score de transparence impacté</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                        Le score d'intégrité de votre commune est recalculé automatiquement et baisse pour intégrer cette fraude confirmée.
                      </p>
                    </div>
                  </div>
                  {signalement.resolution_justification && (
                    <div className="mt-3 p-3 bg-card/60 rounded-xl border border-red-500/20">
                      <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-1">Justification DGDDL</p>
                      <p className="text-xs text-foreground/90 leading-relaxed">{signalement.resolution_justification}</p>
                    </div>
                  )}
                </div>
              )}

              {signalement.resolution === "FAUX" && (
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                      <span className="text-base font-black text-emerald-600">+15</span>
                    </div>
                    <div>
                      <p className="text-sm font-black text-emerald-700 dark:text-emerald-300">Bonus de réputation</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                        Le signalement a été jugé abusif. Vous êtes lavé de tout soupçon, +15 points de réputation.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                      <span className="text-lg">✓</span>
                    </div>
                    <div>
                      <p className="text-sm font-black text-emerald-700 dark:text-emerald-300">Score d'intégrité bonifié</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                        Un signalement rejeté apporte un bonus modeste au score de transparence de votre commune.
                      </p>
                    </div>
                  </div>
                  {signalement.resolution_justification && (
                    <div className="mt-3 p-3 bg-card/60 rounded-xl border border-emerald-500/20">
                      <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Justification DGDDL</p>
                      <p className="text-xs text-foreground/90 leading-relaxed">{signalement.resolution_justification}</p>
                    </div>
                  )}
                </div>
              )}

              {signalement.resolution === "INFONDE" && (
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-zinc-500/20 flex items-center justify-center shrink-0">
                      <span className="text-base font-black text-zinc-600">±0</span>
                    </div>
                    <div>
                      <p className="text-sm font-black text-zinc-700 dark:text-zinc-300">Aucune sanction</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                        Le signalement est classé sans suite. Aucun impact sur votre score de réputation ni celui de votre commune.
                      </p>
                    </div>
                  </div>
                  {signalement.resolution_justification && (
                    <div className="mt-3 p-3 bg-card/60 rounded-xl border border-zinc-500/20">
                      <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">Justification DGDDL</p>
                      <p className="text-xs text-foreground/90 leading-relaxed">{signalement.resolution_justification}</p>
                    </div>
                  )}
                </div>
              )}

              {signalement.blockchain_tx_hash_resolution && (
                <>
                  <a
                    href={`https://amoy.polygonscan.com/tx/${signalement.blockchain_tx_hash_resolution}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 mt-4 text-[10px] font-black text-primary hover:underline"
                  >
                    Verifier le verdict sur la blockchain
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
