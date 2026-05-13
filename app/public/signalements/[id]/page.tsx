"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  ArrowLeft, AlertTriangle, MapPin, Calendar, Users,
  Camera, Loader2, CheckCircle2, Clock,
} from "lucide-react";
import { signalementsApi, type Signalement } from "@/lib/api";
import { SectionCommentaires } from "@/components/ui/SectionCommentaires";

export default function PublicSignalementDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [signalement, setSignalement] = useState<Signalement | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const sig = await signalementsApi.detail(id);
        setSignalement(sig);
      } catch {
        setSignalement(null);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

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
        <p className="text-sm text-muted-foreground mt-2">Ce signalement n'existe pas ou n'est pas accessible.</p>
        <Link href="/public/signalements">
          <Button className="mt-6">Retour aux signalements</Button>
        </Link>
      </div>
    </div>
  );

  return (
    <div className="animate-in fade-in duration-500 max-w-4xl mx-auto pb-12">
      <Link
        href="/public/signalements"
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
            <Badge
              variant={signalement.is_reviewed ? "success" : "secondary"}
              className="h-8 px-4 rounded-full font-black text-[10px] uppercase"
            >
              {signalement.is_reviewed ? (
                <><CheckCircle2 size={12} className="mr-1" /> Traité</>
              ) : (
                <><Clock size={12} className="mr-1" /> En attente</>
              )}
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-6 text-muted-foreground font-bold text-xs uppercase tracking-widest italic">
            <span className="flex items-center gap-2">
              <MapPin size={16} className="text-primary" />
              {signalement.commune_detail?.nom || "Localisation non précisée"}
            </span>
            <span className="flex items-center gap-2">
              <Calendar size={16} className="text-primary" />
              Signalé le {new Date(signalement.created_at).toLocaleDateString("fr-FR", { dateStyle: "long" })}
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-4 shrink-0">
          {signalement.nb_votes > 0 && (
            <div className="flex flex-col items-center p-6 bg-amber-500/10 rounded-[32px] border border-amber-500/20 min-w-[100px]">
              <span className="text-3xl font-black text-amber-600">{signalement.nb_votes}</span>
              <span className="text-[10px] font-black text-amber-600/70 uppercase tracking-widest mt-1">Vote(s)</span>
            </div>
          )}
          {signalement.pct_credible > 0 && (
            <div className="flex flex-col items-center p-6 bg-primary/5 rounded-[32px] border border-primary/10 min-w-[100px]">
              <span className="text-3xl font-black text-primary">{signalement.pct_credible}%</span>
              <span className="text-[10px] font-black text-primary/60 uppercase tracking-widest mt-1">Crédible</span>
            </div>
          )}
        </div>
      </div>

      {/* Contenu */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
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

            <div className="pt-10 border-t border-border">
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
          </CardContent>
        </Card>

        {/* Preuves */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="shadow-2xl border-border rounded-[40px] overflow-hidden border bg-card/50 backdrop-blur-xl">
            <CardContent className="p-10">
              <h3 className="text-xl font-black text-foreground mb-8 uppercase tracking-tight italic flex items-center gap-3">
                <Camera className="text-primary" size={20} /> Pièces Jointes ({signalement.nb_preuves})
              </h3>

              {signalement.nb_preuves === 0 ? (
                <div className="aspect-video bg-muted/30 rounded-[24px] flex flex-col items-center justify-center border-2 border-dashed border-border">
                  <Camera className="text-muted-foreground/40" size={40} />
                  <p className="mt-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                    Aucune pièce jointe
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 gap-3 bg-muted/20 rounded-[24px] border border-border">
                  <Camera className="text-primary" size={36} />
                  <p className="text-2xl font-black text-primary">{signalement.nb_preuves}</p>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                    Preuve(s) IPFS certifiée(s)
                  </p>
                </div>
              )}

              <p className="mt-6 text-[10px] text-muted-foreground font-bold italic leading-relaxed text-center">
                Les pièces jointes sont stockées de manière décentralisée sur IPFS pour garantir leur intégrité.
              </p>
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
