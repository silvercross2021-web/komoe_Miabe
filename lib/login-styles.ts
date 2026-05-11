/**
 * Styles centralisés pour les pages login/register.
 *
 * Utilisation:
 *   import { LOGIN_STYLES } from '@/lib/login-styles';
 *   const INPUT = LOGIN_STYLES.INPUT;
 */

export const LOGIN_STYLES = {
  // ── Input fields ──
  INPUT:
    "w-full bg-black/5 dark:bg-white/10 border border-black/15 dark:border-white/25 " +
    "rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white " +
    "placeholder-slate-400 dark:placeholder-white/40 " +
    "focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary " +
    "transition-all",

  // ── Labels ──
  LABEL:
    "block text-[10px] font-black uppercase text-slate-500 dark:text-white/50 " +
    "tracking-widest mb-1.5 ml-1",

  // ── Select fields ──
  SELECT:
    "w-full bg-white dark:bg-[#0d0d2b] border border-black/15 dark:border-white/25 " +
    "rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white " +
    "focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary " +
    "transition-all cursor-pointer",

  // ── Cards ──
  CARD:
    "bg-white dark:bg-white/[0.04] backdrop-blur-2xl " +
    "border border-black/10 dark:border-white/10 " +
    "rounded-[32px] shadow-[0_24px_64px_-12px_rgba(0,0,0,0.12)] " +
    "dark:shadow-[0_24px_64px_-12px_rgba(0,0,0,0.7)]",
} as const;

// ── Variantes de couleurs pour les rôles ──
export const ROLE_COLORS = {
  AGENT_FINANCIER: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-500 dark:text-emerald-400",
    border: "hover:border-emerald-500/50",
  },
  MAIRE: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-500 dark:text-emerald-400",
    border: "hover:border-emerald-500/50",
  },
  DGDDL: {
    bg: "bg-blue-500/10",
    text: "text-blue-500 dark:text-blue-400",
    border: "hover:border-blue-500/50",
  },
  COUR_COMPTES: {
    bg: "bg-red-500/10",
    text: "text-red-500 dark:text-red-400",
    border: "hover:border-red-500/50",
  },
  BAILLEUR: {
    bg: "bg-purple-500/10",
    text: "text-purple-500 dark:text-purple-400",
    border: "hover:border-purple-500/50",
  },
  CITOYEN: {
    bg: "bg-orange-500/10",
    text: "text-orange-500 dark:text-orange-400",
    border: "hover:border-orange-500/50",
  },
  JOURNALISTE: {
    bg: "bg-slate-500/10",
    text: "text-slate-600 dark:text-slate-300",
    border: "hover:border-slate-500/50",
  },
} as const;
