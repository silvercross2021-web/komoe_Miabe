"use client";
import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/lib/auth-context';

export default function ControleLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const role = (user?.role ?? 'DGDDL') as any;
  return <AppLayout role={role}>{children}</AppLayout>;
}
