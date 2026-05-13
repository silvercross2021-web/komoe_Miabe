"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2, Landmark, Briefcase, ShieldCheck,
  Globe, Users, Eye, EyeOff, LogIn, Loader2,
  Lock, Zap, BarChart3, ArrowRight,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { getRoleDashboard } from "@/lib/auth-context";
import type { ApiError } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { cn } from "@/lib/utils";
import { LOGIN_STYLES, ROLE_COLORS } from "@/lib/login-styles";

// ─── Styles ─────────────────────────────────────────────────────────
const INPUT  = LOGIN_STYLES.INPUT;
const LABEL  = LOGIN_STYLES.LABEL;

// ─── Comptes démo ─────────────────────────────────────────────────────────────
const DEMO_GROUPS = [
  {
    label: "La Mairie",
    color: "text-emerald-500 dark:text-emerald-400",
    accounts: [
      { key: "AGENT_FINANCIER", email: "agent.abobo@komoe.ci", label: "Agent Financier", dest: "/commune/dashboard", icon: Building2, bgColor: ROLE_COLORS.AGENT_FINANCIER.bg, textColor: ROLE_COLORS.AGENT_FINANCIER.text, borderHover: ROLE_COLORS.AGENT_FINANCIER.border, desc: "Saisit les dépenses. Soumet au Maire." },
      { key: "MAIRE",           email: "maire.abobo@komoe.ci",  label: "Maire",           dest: "/commune/dashboard", icon: ShieldCheck, bgColor: ROLE_COLORS.MAIRE.bg, textColor: ROLE_COLORS.MAIRE.text, borderHover: ROLE_COLORS.MAIRE.border, desc: "Valide les transactions sur Polygon." },
    ],
  },
  {
    label: "Contrôle & Audit",
    color: "text-blue-500 dark:text-blue-400",
    accounts: [
      { key: "DGDDL",        email: "dgddl@komoe.ci",         label: "DGDDL",           dest: "/controle/dashboard", icon: Globe,       bgColor: ROLE_COLORS.DGDDL.bg, textColor: ROLE_COLORS.DGDDL.text, borderHover: ROLE_COLORS.DGDDL.border, desc: "Supervise les 201 communes." },
      { key: "COUR_COMPTES", email: "cour.comptes@komoe.ci",  label: "Cour des Comptes", dest: "/controle/dashboard", icon: ShieldCheck, bgColor: ROLE_COLORS.COUR_COMPTES.bg, textColor: ROLE_COLORS.COUR_COMPTES.text, borderHover: ROLE_COLORS.COUR_COMPTES.border, desc: "Auditeur indépendant. Vue totale." },
    ],
  },
  {
    label: "Public & Bailleurs",
    color: "text-purple-500 dark:text-purple-400",
    accounts: [
      { key: "BAILLEUR",     email: "bailleur@komoe.ci",      label: "Bailleur",    dest: "/public/dashboard", icon: Briefcase, bgColor: ROLE_COLORS.BAILLEUR.bg, textColor: ROLE_COLORS.BAILLEUR.text, borderHover: ROLE_COLORS.BAILLEUR.border, desc: "Suit les projets financés." },
      { key: "CITOYEN",      email: "citoyen@komoe.ci",       label: "Citoyen",     dest: "/public/dashboard", icon: Users,     bgColor: ROLE_COLORS.CITOYEN.bg, textColor: ROLE_COLORS.CITOYEN.text, borderHover: ROLE_COLORS.CITOYEN.border, desc: "Consulte le budget public." },
      { key: "JOURNALISTE",  email: "journaliste@komoe.ci",   label: "Presse / ONG", dest: "/public/dashboard", icon: Landmark,  bgColor: ROLE_COLORS.JOURNALISTE.bg, textColor: ROLE_COLORS.JOURNALISTE.text, borderHover: ROLE_COLORS.JOURNALISTE.border, desc: "Accès public avec export CSV." },
    ],
  },
];

function LoginForm() {
  const { login, logout } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "";

  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [showPwd, setShowPwd]     = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingKey, setLoadingKey]     = useState<string | null>(null);
  const [mode, setMode]           = useState<"auth" | "demo">("auth");

  // Vider les champs + déconnecter quand on revient sur la page login
  const switchToAuth = () => {
    logout();
    setEmail("");
    setPassword("");
    setError(null);
    setMode("auth");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login({ email, password });
      const { authApi } = await import("@/lib/api");
      const profile = await authApi.me();
      router.push(redirect || getRoleDashboard(profile.role));
    } catch (err) {
      setError((err as ApiError).message ?? "Email ou mot de passe incorrect.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const loginAs = async (accEmail: string, dest: string, key: string) => {
    setLoadingKey(key);
    setError(null);
    try {
      await login({ email: accEmail, password: "Komoe@2024!" });
      router.push(dest);
    } catch (err) {
      setError((err as ApiError).message ?? `Échec connexion démo (${accEmail}).`);
      setLoadingKey(null);
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center p-4 md:p-8 bg-slate-50 dark:bg-[#070718] text-slate-900 dark:text-white overflow-hidden transition-colors duration-300">

      {/* Ambient background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-primary/10 dark:bg-primary/15 rounded-full blur-[150px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-accent/8 dark:bg-accent/10 rounded-full blur-[130px]" />
      </div>

      {/* ── Toggle thème — coin supérieur droit ── */}
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <AnimatePresence mode="wait">
        {mode === "auth" ? (

          /* ══════════════════════════════════════
             MODE CONNEXION — layout 2 colonnes
          ══════════════════════════════════════ */
          <motion.div
            key="auth"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-10 relative z-10"
          >
            {/* ── COLONNE GAUCHE ── */}
            <div className="lg:col-span-5 flex flex-col justify-center py-8">
              <div className="flex items-center gap-3 mb-10">
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center shadow-lg shadow-primary/30">
                  <img src="/img/logo_elephant.jpeg" alt="KOMOE" className="w-8 h-8 object-contain" />
                </div>
                <span className="text-4xl font-black tracking-widest">KOMOE</span>
              </div>

              <h1 className="text-4xl md:text-5xl font-black leading-tight mb-6 tracking-tight">
                Transparence. <span className="text-primary italic">Blockchain.</span><br />Intégrité.
              </h1>
              <p className="text-slate-500 dark:text-white/50 font-medium leading-relaxed mb-10 text-base max-w-md">
                Connectez-vous pour accéder à votre espace personnalisé et contribuer à la gouvernance transparente des communes ivoiriennes.
              </p>

              <div className="space-y-6">
                {[
                  { icon: Lock,      t: "Accès Sécurisé JWT",    d: "Vos données sont protégées et chiffrées." },
                  { icon: BarChart3, t: "Tableau de bord adapté", d: "Interface personnalisée selon votre rôle." },
                  { icon: Zap,       t: "Temps réel Polygon",     d: "Transactions vérifiables instantanément." },
                ].map((x, i) => (
                  <div key={i} className="flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex items-center justify-center shrink-0">
                      <x.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-black text-base">{x.t}</p>
                      <p className="text-sm text-slate-500 dark:text-white/40">{x.d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── COLONNE DROITE — formulaire ── */}
            <div className="lg:col-span-7">
              <Card className="bg-white dark:bg-white/[0.04] backdrop-blur-2xl border border-black/10 dark:border-white/10 rounded-[32px] shadow-[0_24px_64px_-12px_rgba(0,0,0,0.12)] dark:shadow-[0_24px_64px_-12px_rgba(0,0,0,0.7)]">
                <CardContent className="p-8 md:p-12">
                  <div className="mb-8">
                    <h2 className="text-2xl font-black italic uppercase tracking-tighter mb-2 text-slate-900 dark:text-white">
                      Connexion
                    </h2>
                    <p className="text-slate-500 dark:text-white/40 text-xs">
                      Entrez vos identifiants pour accéder à votre espace.
                    </p>
                  </div>

                  {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-500 dark:text-red-400 font-bold text-center">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Inputs pièges invisibles — empêchent Chrome d'autofill les vrais champs */}
                    <input type="text" name="fake_email" style={{ display: "none" }} readOnly tabIndex={-1} />
                    <input type="password" name="fake_pwd" style={{ display: "none" }} readOnly tabIndex={-1} />

                    <div>
                      <label className={LABEL}>Adresse email</label>
                      <input
                        type="text"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                        autoComplete="off"
                        name="komoe_email"
                        placeholder="vous@komoe.ci"
                        className={INPUT}
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className={LABEL.replace("mb-1.5 ml-1", "ml-1")}>Mot de passe</label>
                        <Link href="/forgot-password" className="text-[10px] font-black uppercase text-primary hover:underline tracking-widest">
                          Oublié ?
                        </Link>
                      </div>
                      <div className="relative">
                        <input
                          type={showPwd ? "text" : "password"}
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          required
                          autoComplete="new-password"
                          name="komoe_password"
                          placeholder="••••••••"
                          className={INPUT + " pr-11"}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPwd(!showPwd)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/30 hover:text-slate-600 dark:hover:text-white/80 transition-colors"
                        >
                          {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full h-14 bg-gradient-to-r from-primary to-accent hover:opacity-90 font-black uppercase tracking-widest text-base text-white shadow-2xl shadow-primary/20 mt-4 group"
                    >
                      {isSubmitting ? (
                        <><Loader2 className="w-5 h-5 animate-spin mr-2" />Connexion en cours...</>
                      ) : (
                        <span className="flex items-center gap-2">
                          <LogIn size={18} />
                          Se connecter
                          <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </span>
                      )}
                    </Button>
                  </form>

                  <div className="my-8 flex items-center gap-4">
                    <div className="flex-1 h-px bg-black/10 dark:bg-white/10" />
                    <span className="text-slate-400 dark:text-white/30 text-xs font-bold uppercase tracking-widest">ou</span>
                    <div className="flex-1 h-px bg-black/10 dark:bg-white/10" />
                  </div>

                  <button
                    onClick={() => setMode("demo")}
                    className="w-full py-3 rounded-xl border border-black/10 dark:border-white/15 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white text-sm font-bold transition-all"
                  >
                    Explorer en Mode Démo →
                  </button>

                  <div className="pt-6 border-t border-black/8 dark:border-white/8 text-center mt-6">
                    <p className="text-slate-500 dark:text-white/40 text-sm font-medium">
                      Pas encore de compte ?{" "}
                      <Link href="/register" className="text-primary font-black hover:underline transition-colors">
                        S'inscrire
                      </Link>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>

        ) : (

          /* ══════════════════════════════════════
             MODE DÉMO — pleine largeur
          ══════════════════════════════════════ */
          <motion.div
            key="demo"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-5xl relative z-10"
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center">
                    <img src="/img/logo_elephant.jpeg" alt="KOMOE" className="w-7 h-7 object-contain" />
                  </div>
                  <span className="text-2xl font-black tracking-widest">KOMOE</span>
                </div>
                <h2 className="text-xl font-black italic uppercase tracking-tighter text-slate-900 dark:text-white">Mode Démo</h2>
                <p className="text-slate-500 dark:text-white/40 text-xs mt-1">
                  Mot de passe universel : <span className="font-mono text-slate-700 dark:text-white/70">Komoe@2024!</span>
                </p>
              </div>
              <button
                onClick={switchToAuth}
                className="px-4 py-2 rounded-xl border border-black/10 dark:border-white/15 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white text-sm font-bold transition-all"
              >
                ← Retour connexion
              </button>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-500 dark:text-red-400 font-bold text-center">
                {error}
              </div>
            )}

            <div className="space-y-8">
              {DEMO_GROUPS.map((group, idx) => (
                <motion.div
                  key={group.label}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.08 }}
                >
                  <p className={cn("text-xs font-bold uppercase tracking-widest mb-4 ml-1", group.color)}>
                    {group.label}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {group.accounts.map((acc) => {
                      const Icon = acc.icon;
                      const isLoading = loadingKey === acc.key;
                      return (
                        <button
                          key={acc.key}
                          onClick={() => loginAs(acc.email, acc.dest, acc.key)}
                          disabled={!!loadingKey}
                          className={cn(
                            "group text-left bg-white dark:bg-white/[0.04] backdrop-blur-md",
                            "border border-black/10 dark:border-white/10 rounded-2xl p-5",
                            "flex flex-col gap-4 transition-all duration-300",
                            "hover:shadow-xl hover:-translate-y-1",
                            "hover:border-black/20 dark:hover:border-white/20",
                            acc.borderHover,
                            "disabled:opacity-50 disabled:cursor-not-allowed"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110", acc.bgColor, acc.textColor)}>
                              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Icon className="w-6 h-6" />}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900 dark:text-white">{acc.label}</p>
                              <p className="text-[11px] text-slate-400 dark:text-white/40 font-mono mt-0.5">{acc.email}</p>
                            </div>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-white/40 leading-relaxed group-hover:text-slate-700 dark:group-hover:text-white/70 transition-colors">
                            {acc.desc}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-black/10 dark:border-white/10 text-center">
              <p className="text-slate-500 dark:text-white/40 text-sm">
                Pas encore de compte ?{" "}
                <Link href="/register" className="text-primary font-black hover:underline">
                  S'inscrire
                </Link>
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#070718]">
        <Loader2 className="animate-spin text-primary w-8 h-8" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
