"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, ShieldCheck, Globe, Sparkles, Loader2, UserPlus, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import type { ApiError } from "@/lib/api";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LOGIN_STYLES } from "@/lib/login-styles";

type Profession = "JOURNALISTE" | "ONG" | "BAILLEUR" | "CHERCHEUR";
interface PublicCommune { id: number; nom: string; region: string; }

const PROFESSIONS = [
  { value: "JOURNALISTE", label: "Journaliste / Presse" },
  { value: "ONG",         label: "ONG / Société civile" },
  { value: "BAILLEUR",    label: "Bailleur de fonds" },
  { value: "CHERCHEUR",   label: "Analyste / Chercheur" },
];

const INPUT  = LOGIN_STYLES.INPUT;
const SELECT = LOGIN_STYLES.SELECT;
const LABEL  = LOGIN_STYLES.LABEL;

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [communes, setCommunes] = useState<PublicCommune[]>([]);
  const [communesLoading, setCommunesLoading] = useState(true);
  const [communeSearch, setCommuneSearch] = useState("");
  const [isCommuneDropdownOpen, setIsCommuneDropdownOpen] = useState(false);

  useEffect(() => {
    import("@/lib/api").then(({ communesApi }) => {
      communesApi.list({ limit: 300 })
        .then(d => {
          setCommunes(d || []);
        })
        .catch((err) => {
          setError(`Impossible de charger les communes: ${err.message}`);
          setCommunes([]);
        })
        .finally(() => setCommunesLoading(false));
    });
  }, []);

  const [professions, setProfessions] = useState<Profession[]>([]);
  const [form, setForm] = useState({
    email: "",
    nom: "",
    prenom: "",
    telephone: "",
    commune: "",
    media_organisation: "",
    password: "",
    password_confirm: ""
  });
  
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const upd = (f: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [f]: e.target.value }));

  const toggleProfession = (prof: Profession) => {
    setProfessions(p =>
      p.includes(prof) ? p.filter(x => x !== prof) : [...p, prof]
    );
  };

  const needsMedia = professions.includes("JOURNALISTE") || professions.includes("ONG");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    if (!form.commune || Number(form.commune) === 0) {
      setError("La sélection d'une commune est obligatoire.");
      return;
    }

    if (needsMedia && !form.media_organisation) {
      setFieldErrors({ media_organisation: "Le nom du média/organisation est obligatoire pour votre profil." });
      return;
    }

    if (form.password !== form.password_confirm) {
      setFieldErrors({ password_confirm: "Les mots de passe ne correspondent pas." });
      return;
    }

    setIsSubmitting(true);
    try {
      const communeId = form.commune && Number(form.commune) > 0 ? Number(form.commune) : undefined;
      await register({
        email: form.email,
        nom: form.nom,
        prenom: form.prenom,
        role: "CITOYEN",
        professions: professions.length > 0 ? professions : undefined,
        password: form.password,
        password_confirm: form.password_confirm,
        telephone: form.telephone || undefined,
        commune: communeId,
        media_organisation: needsMedia ? form.media_organisation : undefined,
      });
      router.push("/public/dashboard");
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr.data && typeof apiErr.data === "object") {
        const f: Record<string, string> = {};
        for (const [k, v] of Object.entries(apiErr.data)) f[k] = Array.isArray(v) ? v.join(" ") : String(v);
        setFieldErrors(f);
      }
      setError(apiErr.message ?? "Erreur lors de la création du profil.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const FE = ({ field }: { field: string }) =>
    fieldErrors[field] ? <p className="text-[10px] font-bold text-red-400 mt-1 ml-1">{fieldErrors[field]}</p> : null;

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center p-4 md:p-8 bg-slate-50 dark:bg-[#070718] text-slate-900 dark:text-white overflow-hidden transition-colors duration-300">
      {/* Theme toggle */}
      <div className="absolute top-4 right-4 z-50"><ThemeToggle /></div>
      {/* Ambient background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-primary/15 rounded-full blur-[150px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-accent/10 rounded-full blur-[130px]" />
      </div>

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-10 relative z-10">

        {/* ── LEFT COLUMN ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-5 flex flex-col justify-center py-8">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center shadow-lg shadow-primary/30">
              <img src="/img/logo_elephant.jpeg" alt="KOMOE" className="w-8 h-8 object-contain" />
            </div>
            <span className="text-4xl font-black tracking-widest text-slate-900 dark:text-white">KOMOE</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-black leading-tight mb-6 tracking-tight text-slate-900 dark:text-white">
            Rejoignez la <span className="text-primary italic">Sentinelle</span>.
          </h1>
          <p className="text-slate-500 dark:text-white/50 font-medium leading-relaxed mb-10 text-base max-w-md">
            Créez votre compte en quelques secondes et commencez à auditer la transparence de votre commune sur la blockchain.
          </p>

          <div className="space-y-6">
            {[
              { icon: ShieldCheck, t: "Identité Blockchain", d: "Vos actions sont certifiées et immuables." },
              { icon: Globe, t: "Impact National", d: "Contribuez à la transparence des 201 communes." },
              { icon: Sparkles, t: "Réputation & Points", d: "Gagnez en influence au sein de la communauté." },
            ].map((x, i) => (
              <div key={i} className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex items-center justify-center shrink-0">
                  <x.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-black text-base text-slate-900 dark:text-white">{x.t}</p>
                  <p className="text-sm text-slate-500 dark:text-white/40">{x.d}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── RIGHT FORM ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-7">
          <Card className="bg-white dark:bg-white/[0.04] backdrop-blur-2xl border border-black/10 dark:border-white/10 rounded-[32px] shadow-[0_24px_64px_-12px_rgba(0,0,0,0.15)] dark:shadow-[0_24px_64px_-12px_rgba(0,0,0,0.7)]">
            <CardContent className="p-8 md:p-12">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <h2 className="text-2xl font-black italic uppercase tracking-tighter mb-2 text-slate-900 dark:text-white">Inscription</h2>
                  <p className="text-slate-500 dark:text-white/40 text-xs mb-8">Remplissez les champs ci-dessous pour créer votre profil citoyen.</p>
                </div>

                {error && <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 font-bold text-center">{error}</div>}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={LABEL}>Prénom *</label>
                    <input type="text" value={form.prenom} onChange={upd("prenom")} required placeholder="Mamadou" className={INPUT} />
                    <FE field="prenom" />
                  </div>
                  <div>
                    <label className={LABEL}>Nom *</label>
                    <input type="text" value={form.nom} onChange={upd("nom")} required placeholder="Koné" className={INPUT} />
                    <FE field="nom" />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className={LABEL}>Adresse email *</label>
                    <input type="email" value={form.email} onChange={upd("email")} required placeholder="vous@exemple.ci" className={INPUT} />
                    <FE field="email" />
                  </div>
                </div>

                <div>
                  <label className={LABEL}>Rôles Additionnels</label>
                  <p className="text-xs text-slate-500 dark:text-white/40 mb-3 ml-1">Vous êtes citoyen par défaut. Sélectionnez les rôles additionnels qui vous correspondent :</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {PROFESSIONS.map(p => (
                      <label key={p.value} className="flex items-center gap-3 p-3 rounded-lg border border-black/10 dark:border-white/10 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                        <input
                          type="checkbox"
                          checked={professions.includes(p.value as Profession)}
                          onChange={() => toggleProfession(p.value as Profession)}
                          className="w-4 h-4 rounded accent-primary"
                        />
                        <span className="text-sm text-slate-900 dark:text-white font-medium">{p.label}</span>
                      </label>
                    ))}
                  </div>
                  <FE field="professions" />
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className={LABEL}>Téléphone</label>
                    <input type="tel" value={form.telephone} onChange={upd("telephone")} placeholder="+225 07..." className={INPUT} />
                  </div>
                </div>

                <div className="relative">
                  <label className={LABEL}>Commune / Ville * (Obligatoire)</label>
                  {communesLoading ? (
                    <div className="flex items-center gap-2 px-4 py-3 bg-black/5 dark:bg-white/10 border border-black/15 dark:border-white/20 rounded-xl">
                      <Loader2 className="w-4 h-4 animate-spin text-slate-400 dark:text-white/50" />
                      <span className="text-sm text-slate-400 dark:text-white/50">Chargement...</span>
                    </div>
                  ) : (
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Où vivez-vous ? (Rechercher...)"
                        value={communeSearch}
                        onChange={(e) => {
                          setCommuneSearch(e.target.value);
                          setIsCommuneDropdownOpen(true);
                        }}
                        onFocus={() => setIsCommuneDropdownOpen(true)}
                        onBlur={() => setTimeout(() => setIsCommuneDropdownOpen(false), 200)}
                        className={INPUT}
                        required={!form.commune}
                      />
                      {isCommuneDropdownOpen && (
                        <div className="absolute z-50 w-full mt-2 max-h-48 overflow-y-auto bg-white dark:bg-[#0d0d2b] border border-black/15 dark:border-white/25 rounded-xl shadow-2xl divide-y divide-black/5 dark:divide-white/5">
                          {communes
                            .filter(c => c.nom.toLowerCase().includes(communeSearch.toLowerCase()) || c.region.toLowerCase().includes(communeSearch.toLowerCase()))
                            .sort((a, b) => a.nom.localeCompare(b.nom))
                            .map(c => (
                            <div
                              key={c.id}
                              className="px-4 py-3 text-sm text-slate-900 dark:text-white hover:bg-primary hover:text-white cursor-pointer transition-colors"
                              onMouseDown={() => {
                                setForm(p => ({ ...p, commune: String(c.id) }));
                                setCommuneSearch(c.nom);
                                setIsCommuneDropdownOpen(false);
                              }}
                            >
                              <span className="font-bold">{c.nom}</span>
                            </div>
                          ))}
                          {communes.filter(c => c.nom.toLowerCase().includes(communeSearch.toLowerCase())).length === 0 && (
                            <div className="px-4 py-3 text-sm text-slate-400 dark:text-white/40 italic">Aucune commune trouvée</div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  <FE field="commune" />
                </div>

                {needsMedia && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
                    <label className={LABEL}>Média / Organisation * (Obligatoire)</label>
                    <input
                      type="text"
                      value={form.media_organisation}
                      onChange={upd("media_organisation")}
                      required={needsMedia}
                      placeholder="Nom de votre média ou ONG"
                      className={INPUT}
                    />
                    <FE field="media_organisation" />
                  </motion.div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={LABEL}>Mot de passe *</label>
                    <div className="relative">
                      <input type={showPwd ? "text" : "password"} value={form.password} onChange={upd("password")} required placeholder="••••••••" className={INPUT + " pr-11"} />
                      <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/30 hover:text-slate-700 dark:hover:text-white/80 transition-colors">
                        {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    <FE field="password" />
                  </div>
                  <div>
                    <label className={LABEL}>Confirmation *</label>
                    <input type="password" value={form.password_confirm} onChange={upd("password_confirm")} required placeholder="••••••••" className={INPUT} />
                    <FE field="password_confirm" />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="w-full h-14 bg-gradient-to-r from-primary to-accent hover:opacity-90 font-black uppercase tracking-widest text-base shadow-2xl shadow-primary/20 mt-4 group"
                >
                  {isSubmitting ? (
                    <><Loader2 className="w-5 h-5 animate-spin mr-2" />Création en cours...</>
                  ) : (
                    <span className="flex items-center gap-2">
                      S'inscrire <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </span>
                  )}
                </Button>

                <div className="pt-6 border-t border-black/8 dark:border-white/8 text-center">
                  <p className="text-slate-500 dark:text-white/40 text-sm font-medium">
                    Déjà inscrit ?{" "}
                    <Link href="/login" className="text-primary font-black hover:underline transition-colors">Se connecter</Link>
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
