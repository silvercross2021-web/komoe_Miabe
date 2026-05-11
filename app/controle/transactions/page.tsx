"use client";

import { useAuth } from "@/lib/auth-context";
import { TransactionsView } from "@/views/TransactionsView";
import { Role } from "@/types";

export default function ControleTransactionsPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-orange" />
      </div>
    );
  }

  const role = (user?.role ?? "DGDDL") as Role;
  return <TransactionsView role={role} />;
}
