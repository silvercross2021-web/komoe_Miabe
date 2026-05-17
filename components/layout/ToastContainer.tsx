"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X, Bell } from "lucide-react";
import { subscribeToast, type ToastPayload, type ToastVariant } from "@/lib/toast";

type ActiveToast = Required<ToastPayload>;

const VARIANT_STYLES: Record<ToastVariant, { bg: string; border: string; text: string; iconBg: string; icon: any; }> = {
  default: { bg: "bg-card",              border: "border-border",            text: "text-foreground",       iconBg: "bg-zinc-500/15",   icon: Bell },
  success: { bg: "bg-emerald-50 dark:bg-emerald-950/40", border: "border-emerald-500/40",    text: "text-emerald-700 dark:text-emerald-300", iconBg: "bg-emerald-500/20", icon: CheckCircle2 },
  warning: { bg: "bg-amber-50 dark:bg-amber-950/40",     border: "border-amber-500/40",      text: "text-amber-700 dark:text-amber-300",     iconBg: "bg-amber-500/20",   icon: AlertTriangle },
  danger:  { bg: "bg-red-50 dark:bg-red-950/40",         border: "border-red-500/40",        text: "text-red-700 dark:text-red-300",         iconBg: "bg-red-500/20",     icon: AlertCircle },
  info:    { bg: "bg-blue-50 dark:bg-blue-950/40",       border: "border-blue-500/40",       text: "text-blue-700 dark:text-blue-300",       iconBg: "bg-blue-500/20",    icon: Info },
};

export function ToastContainer() {
  const [toasts, setToasts] = useState<ActiveToast[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeToast((toast) => {
      setToasts((prev) => [...prev, toast]);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
      }, toast.duration);
    });
    return unsubscribe;
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="fixed bottom-4 right-4 z-[10000] flex flex-col gap-2.5 w-[calc(100vw-32px)] sm:w-[380px] pointer-events-none">
      <AnimatePresence initial={false}>
        {toasts.map((toast) => {
          const style = VARIANT_STYLES[toast.variant] ?? VARIANT_STYLES.default;
          const Icon = style.icon;
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 60, scale: 0.92 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 60, scale: 0.92 }}
              transition={{ type: "spring", stiffness: 320, damping: 26 }}
              className={`pointer-events-auto relative overflow-hidden rounded-2xl border-2 shadow-2xl backdrop-blur-md ${style.bg} ${style.border}`}
            >
              <div className="flex items-start gap-3 p-4 pr-10">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${style.iconBg}`}>
                  <Icon className={`w-4 h-4 ${style.text}`} />
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <p className={`text-sm font-black leading-tight ${style.text}`}>{toast.title}</p>
                  {toast.description && (
                    <p className="text-[11px] text-muted-foreground mt-1 leading-snug">{toast.description}</p>
                  )}
                </div>
                <button
                  onClick={() => removeToast(toast.id)}
                  className="absolute top-3 right-3 w-6 h-6 rounded-md flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 text-muted-foreground"
                  aria-label="Fermer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <motion.div
                initial={{ scaleX: 1 }}
                animate={{ scaleX: 0 }}
                transition={{ duration: toast.duration / 1000, ease: "linear" }}
                style={{ transformOrigin: "left" }}
                className={`absolute bottom-0 left-0 right-0 h-0.5 ${style.iconBg.replace('/20', '/40')}`}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
