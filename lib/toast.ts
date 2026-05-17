"use client";

export type ToastVariant = "default" | "success" | "warning" | "danger" | "info";

export interface ToastPayload {
  id?: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

const EVENT_NAME = "komoe:toast";

type ToastBus = EventTarget;

function getBus(): ToastBus | null {
  if (typeof window === "undefined") return null;
  const w = window as any;
  if (!w.__komoe_toast_bus__) {
    w.__komoe_toast_bus__ = new EventTarget();
  }
  return w.__komoe_toast_bus__ as ToastBus;
}

export function pushToast(payload: ToastPayload) {
  const bus = getBus();
  if (!bus) return;
  const detail: Required<ToastPayload> = {
    id: payload.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: payload.title,
    description: payload.description ?? "",
    variant: payload.variant ?? "default",
    duration: payload.duration ?? 5500,
  };
  bus.dispatchEvent(new CustomEvent(EVENT_NAME, { detail }));
}

export function subscribeToast(handler: (toast: Required<ToastPayload>) => void) {
  const bus = getBus();
  if (!bus) return () => {};
  const listener = (e: Event) => {
    const ce = e as CustomEvent<Required<ToastPayload>>;
    handler(ce.detail);
  };
  bus.addEventListener(EVENT_NAME, listener);
  return () => bus.removeEventListener(EVENT_NAME, listener);
}

// Helper pour mapper une notification serveur (type_notif) vers un Toast variant
export function notifTypeToVariant(typeNotif: string | undefined): ToastVariant {
  switch (typeNotif) {
    case "SIGNALEMENT": return "warning";
    case "TRANSACTION": return "success";
    case "PROPOSITION": return "info";
    case "VOTE": return "info";
    default: return "default";
  }
}
