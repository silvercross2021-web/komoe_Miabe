"use client";

import { useState, useEffect, useCallback } from "react";
import { MessageSquare, Send, Loader2, ShieldCheck, Search, FileText } from "lucide-react";
import { signalementsApi, type Commentaire } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Button } from "./Button";
import { Card, CardContent } from "./Card";

const TYPE_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  AVIS:          { label: "Avis citoyen",          color: "bg-blue-500/10 text-blue-700 border-blue-200",   icon: "💬" },
  JUSTIFICATION: { label: "Justification (Maire)", color: "bg-emerald-500/10 text-emerald-700 border-emerald-200", icon: "📝" },
  ENQUETE:       { label: "Note d'enquête (DGDDL)", color: "bg-purple-500/10 text-purple-700 border-purple-200", icon: "🔍" },
};

const ROLE_TO_TYPE: Record<string, "AVIS" | "JUSTIFICATION" | "ENQUETE"> = {
  CITOYEN:        "AVIS",
  JOURNALISTE:    "AVIS",
  BAILLEUR:       "AVIS",
  AGENT_FINANCIER:"AVIS",
  MAIRE:          "JUSTIFICATION",
  DGDDL:          "ENQUETE",
  COUR_COMPTES:   "AVIS",
};

interface Props {
  signalementId: string;
  commentairesInitiaux?: Commentaire[];
}

export function SectionCommentaires({ signalementId, commentairesInitiaux = [] }: Props) {
  const { user, isAuthenticated } = useAuth();
  const [commentaires, setCommentaires] = useState<Commentaire[]>(commentairesInitiaux);
  const [loading, setLoading] = useState(commentairesInitiaux.length === 0);
  const [contenu, setContenu] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCommentaires = useCallback(async () => {
    try {
      const data = await signalementsApi.listeCommentaires(signalementId);
      setCommentaires(Array.isArray(data) ? data : []);
    } catch {
      // silently ignore — commentaires initiaux restent affichés
    } finally {
      setLoading(false);
    }
  }, [signalementId]);

  useEffect(() => {
    if (commentairesInitiaux.length === 0) {
      fetchCommentaires();
    } else {
      setLoading(false);
    }
  }, [signalementId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contenu.trim() || !user) return;
    setSubmitting(true);
    setError(null);
    try {
      const type_commentaire = ROLE_TO_TYPE[user.role] ?? "AVIS";
      const nouveau = await signalementsApi.ajouterCommentaire(signalementId, {
        contenu: contenu.trim(),
        type_commentaire,
      });
      setCommentaires(prev => [...prev, nouveau]);
      setContenu("");
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'envoi du commentaire.");
    } finally {
      setSubmitting(false);
    }
  };

  const typeInfo = user ? (TYPE_LABELS[ROLE_TO_TYPE[user.role] ?? "AVIS"]) : null;

  return (
    <Card className="shadow-2xl border-border rounded-[40px] overflow-hidden border bg-card/50 backdrop-blur-xl">
      <CardContent className="p-10">
        <h3 className="text-xl font-black text-foreground mb-8 uppercase tracking-tight italic flex items-center gap-3">
          <MessageSquare className="text-primary" size={20} />
          Commentaires ({commentaires.length})
        </h3>

        {/* Liste des commentaires */}
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : commentaires.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3 bg-muted/20 rounded-[24px] border border-dashed border-border">
            <MessageSquare className="text-muted-foreground/30" size={36} />
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
              Aucun commentaire pour l'instant
            </p>
          </div>
        ) : (
          <div className="space-y-4 mb-8">
            {commentaires.map((c) => {
              const meta = TYPE_LABELS[c.type_commentaire] ?? TYPE_LABELS.AVIS;
              return (
                <div key={c.id} className="flex gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 text-base">
                    {meta.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-xs font-black text-foreground uppercase">
                        {c.auteur_nom || "Anonyme"}
                      </span>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${meta.color}`}>
                        {meta.label}
                      </span>
                      <span className="text-[10px] text-muted-foreground italic">
                        {new Date(c.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <p className="text-sm text-foreground/80 leading-relaxed">{c.contenu}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Formulaire */}
        {!isAuthenticated ? (
          <div className="mt-6 pt-6 border-t border-border text-center">
            <p className="text-xs text-muted-foreground font-bold">
              <a href="/login" className="text-primary hover:underline font-black">Connectez-vous</a> pour laisser un commentaire.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 pt-6 border-t border-border space-y-4">
            {typeInfo && (
              <div className={`inline-flex items-center gap-2 text-[10px] font-black px-3 py-1.5 rounded-full border ${typeInfo.color}`}>
                <span>{typeInfo.icon}</span>
                <span>Votre commentaire sera posté en tant que : {typeInfo.label}</span>
              </div>
            )}
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-600 font-bold">
                {error}
              </div>
            )}
            <div className="relative">
              <textarea
                value={contenu}
                onChange={e => setContenu(e.target.value)}
                placeholder="Écrivez votre commentaire..."
                rows={3}
                required
                className="w-full px-4 py-3 bg-background border border-border rounded-2xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={submitting || !contenu.trim()}
                className="bg-primary hover:bg-primary/90 text-white font-black rounded-xl h-10 px-6"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                {submitting ? "Envoi..." : "Publier"}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
