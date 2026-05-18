"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Role } from '@/types';
import {
  LayoutDashboard, Receipt, FileText, Building2,
  ShieldCheck, PieChart, AlertTriangle, Users, Shield,
  Network, Globe, BarChart3, Download, MapPin,
  X, ChevronLeft, ChevronRight, LogOut, Banknote, CheckCircle, UserCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  role: Role;
  isMobileOpen: boolean;
  setIsMobileOpen: (v: boolean) => void;
  isCollapsed: boolean;
  setIsCollapsed: (v: boolean) => void;
}

interface NavItem {
  name: string;
  href: string;
  icon: any;
  onlyFor?: Role[];
  exact?: boolean;
}

const NAV_CONTROLE: NavItem[] = [
  { name: 'Vue nationale',           href: '/controle/dashboard',      icon: LayoutDashboard },
  { name: 'Dotations & Budgets',     href: '/controle/dotations',      icon: Banknote,       onlyFor: ['DGDDL'] },
  { name: 'Gestion des accès',       href: '/controle/comptes',        icon: Users,          onlyFor: ['DGDDL'] },
  { name: 'Validation Sentinelle',   href: '/controle/certification',   icon: ShieldCheck,    onlyFor: ['DGDDL'] },
  { name: 'Les communes',            href: '/controle/communes',       icon: Globe },
  { name: 'Classement',              href: '/controle/classement',     icon: BarChart3 },
  { name: 'Alertes & retards',       href: '/controle/alertes',        icon: AlertTriangle },
  { name: 'Transactions',            href: '/controle/transactions',   icon: Receipt },
  { name: 'Engagements citoyens',    href: '/controle/engagements',    icon: CheckCircle },
  { name: 'Signalements',            href: '/controle/signalements',   icon: AlertTriangle },
  { name: 'Preuves blockchain',      href: '/controle/preuves',        icon: ShieldCheck },
  { name: 'Anomalies',               href: '/controle/anomalies',      icon: AlertTriangle },
  { name: 'Réseau Polygon',          href: '/controle/blockchain',     icon: Network },
  { name: 'Rapports officiels',      href: '/controle/rapports',       icon: FileText },
  { name: 'Export / API',            href: '/controle/export',         icon: Download },
  { name: 'Mon profil',              href: '/controle/profil',         icon: Building2 },
];

const NAV_COMMUNE: NavItem[] = [
  { name: 'Tableau de bord',         href: '/commune/dashboard',    icon: LayoutDashboard },
  { name: 'Validation Sentinelle',   href: '/controle/certification', icon: ShieldCheck,     onlyFor: ['MAIRE', 'AGENT_FINANCIER'] },
  { name: 'Saisies Financières',     href: '/commune/saisies',      icon: Receipt,        onlyFor: ['AGENT_FINANCIER', 'MAIRE'] },
  { name: 'Gestion des Projets',     href: '/commune/projets',      icon: Building2 },
  { name: 'Budget Participatif',     href: '/commune/engagements',  icon: CheckCircle },
  { name: 'Citoyens & Rôles',        href: '/commune/citoyens',     icon: Users,          onlyFor: ['MAIRE'] },
  { name: 'Signalements',            href: '/commune/signalements', icon: AlertTriangle,  onlyFor: ['MAIRE'] },
  { name: 'Budget & Audit',          href: '/commune/budget',       icon: PieChart },
  { name: 'Réseau Polygon',          href: '/commune/blockchain',   icon: Network },
  { name: 'Mon profil',              href: '/commune/profil',       icon: UserCircle },
];

const NAV_PUBLIC: NavItem[] = [
  { name: 'Tableau de bord',         href: '/public/dashboard',             icon: LayoutDashboard },
  { name: 'Budget Participatif',     href: '/public/engagements',           icon: Users },
  { name: 'Projets de la Commune',   href: '/public/projets',               icon: Building2 },
  { name: 'Transactions (Réel)',     href: '/public/transactions',          icon: Receipt },
  { name: 'Budget Temps Réel',       href: '/public/budget',                icon: PieChart },
  { name: 'Vérifier preuve KOMOE',   href: '/public/verifier-preuve',       icon: ShieldCheck },
  { name: 'Réseau Polygon',          href: '/public/blockchain',            icon: Network },
  { name: 'Mon profil',              href: '/public/profil',                icon: Building2 },
];

function getNavItems(role: Role): NavItem[] {
  switch (role) {
    case 'DGDDL':
    case 'COUR_COMPTES':
      return NAV_CONTROLE.filter(item => !item.onlyFor || item.onlyFor.includes(role));
    case 'MAIRE':
    case 'AGENT_FINANCIER':
      return NAV_COMMUNE.filter(item => !item.onlyFor || item.onlyFor.includes(role));
    case 'BAILLEUR':
    case 'CITOYEN':
    case 'JOURNALISTE':
    default:
      return NAV_PUBLIC.filter(item => !item.onlyFor || item.onlyFor.includes(role));
  }
}

export const Sidebar = ({ role, isMobileOpen, setIsMobileOpen, isCollapsed, setIsCollapsed }: SidebarProps) => {
  const pathname = usePathname();
  const navItems = getNavItems(role);
  console.log("SIDEBAR ROLE:", role, "ITEMS:", navItems.map(i => i.name));

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300" 
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col bg-background text-foreground border-r border-border transition-all duration-300 ease-in-out lg:static lg:translate-x-0",
          isMobileOpen ? "translate-x-0" : "-translate-x-full",
          isCollapsed ? "w-[80px]" : "w-[260px]"
        )}
      >
        {/* Header Logo Area */}
        <div className={cn(
          "h-16 flex items-center border-b border-border px-4",
          isCollapsed ? "justify-center" : "justify-between"
        )}>
          {!isCollapsed && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center">
                <img src="/img/logo_elephant.jpeg" alt="KOMOE" className="w-full h-full object-contain drop-shadow-md" />
              </div>
              <h1 className="text-lg font-bold tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-foreground to-muted-foreground">KOMOE</h1>
            </div>
          )}
          {isCollapsed && (
            <div className="w-10 h-10 flex items-center justify-center">
              <img src="/img/logo_elephant.jpeg" alt="K" className="w-full h-full object-contain" />
            </div>
          )}

          {/* Desktop Collapse Toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>

          {/* Mobile Close Button */}
          <button
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Area */}
        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (!item.exact && pathname.startsWith(item.href + '/'));

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                title={isCollapsed ? item.name : undefined}
                className={cn(
                  "flex items-center rounded-lg transition-all duration-200 group relative",
                  isCollapsed ? "justify-center p-3" : "px-3 py-2.5",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-md font-semibold" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground font-medium"
                )}
              >
                <Icon className={cn(
                  "shrink-0 transition-colors duration-200",
                  isCollapsed ? "w-6 h-6" : "w-5 h-5 mr-3",
                  isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                )} />
                
                {!isCollapsed && <span>{item.name}</span>}

                {/* Active indicator dot for collapsed mode */}
                {isActive && isCollapsed && (
                  <div className="absolute right-1 top-1 w-1.5 h-1.5 bg-accent rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border bg-muted/20">
          {isCollapsed ? (
            <div className="flex flex-col items-center gap-4">
              <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" title="Polygon Amoy" />
              <Link href="/login" className="text-muted-foreground hover:text-foreground" title="Déconnexion">
                <LogOut size={20} />
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></span>
                <span className="text-xs text-muted-foreground font-medium tracking-wide uppercase">Polygon Amoy</span>
              </div>
              
              <Link
                href="/login"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors p-2 rounded-lg hover:bg-muted"
              >
                <LogOut size={16} />
                <span>Changer de profil</span>
              </Link>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
