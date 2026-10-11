/**
 * BANKISM Header Component
 * Brand Shield, Active Persona Selector, Sentinel Status Indicator, Reset Action
 */

import React from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  RefreshCw,
  Cpu,
  Lock,
  FileText,
  LogOut,
} from 'lucide-react';
import { User } from '../types';

interface HeaderProps {
  currentUser: User;
  users: User[];
  onSelectUser: (user: User) => void;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onResetDemo: () => void;
  onOpenReportModal: () => void;
  onLogout?: () => void;
  isResetting: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  users,
  onSelectUser,
  activeTab,
  onSelectTab,
  onResetDemo,
  onOpenReportModal,
  onLogout,
  isResetting,
}) => {
  const navTabs = [
    { id: 'dashboard', label: 'Dashboard & Risk Score', icon: ShieldCheck },
    { id: 'analyzer', label: 'Transaction Firewall', icon: ShieldAlert },
    { id: 'banking', label: 'Accounts & Ledger', icon: UserCheck },
    { id: 'cases', label: 'Security Review Queue', icon: Lock },
    { id: 'network', label: 'Fraud Network Graph', icon: Cpu },
    { id: 'threats', label: 'Threat Intelligence', icon: ShieldAlert },
    { id: 'shared-intel', label: 'Shared Intelligence', icon: Cpu },
    { id: 'attack-lab', label: 'Adversarial Attack Lab', icon: ShieldAlert },
    { id: 'tests', label: 'Security Test Suite', icon: ShieldCheck },
    { id: 'audit', label: 'Audit Logs & Policy', icon: Lock },
  ];

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-900/60 text-purple-300 border-purple-700/60';
      case 'SECURITY_ANALYST':
        return 'bg-blue-900/60 text-blue-300 border-blue-700/60';
      default:
        return 'bg-emerald-900/60 text-emerald-300 border-emerald-700/60';
    }
  };

  return (
    <header className="border-b border-slate-800 bg-[#0a0f1d]/90 backdrop-blur sticky top-0 z-50">
      {/* Top Bar */}
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between border-b border-slate-800/60">
        <div className="flex items-center gap-3">
          {/* Logo Shield */}
          <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-900 border border-blue-500/40 shadow-lg shadow-blue-950/50">
            <ShieldCheck className="w-6 h-6 text-blue-200" />
            <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-[#0a0f1d] rounded-full"></span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-wider bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-300 bg-clip-text text-transparent">
                BANKISM
              </span>
              <span className="px-2 py-0.5 text-[10px] font-mono tracking-wide uppercase rounded bg-blue-950/80 text-blue-300 border border-blue-800/60">
                v2.4 Blue-Team
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              Blue-Team AI Banking Firewall & Fraud Intelligence Platform
            </p>
          </div>
        </div>

        {/* Right Info & Role Selector */}
        <div className="flex items-center gap-3">
          {/* Sentinel Status */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-md bg-slate-900/80 border border-slate-800 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-slate-300">SENTINEL:</span>
            <span className="text-emerald-400 font-semibold">ENFORCING</span>
          </div>

          {/* Active Persona Dropdown */}
          <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 rounded-lg p-1.5 px-2.5">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-semibold text-slate-200">{currentUser.name}</div>
              <div className="text-[10px] text-slate-400 font-mono">{currentUser.id}</div>
            </div>

            <select
              value={currentUser.id}
              onChange={(e) => {
                const u = users.find((x) => x.id === e.target.value);
                if (u) onSelectUser(u);
              }}
              className="bg-slate-950 text-slate-200 text-xs border border-slate-700 rounded px-2 py-1 focus:outline-none focus:border-blue-500 font-sans cursor-pointer"
            >
              {users.map((u, idx) => (
                <option key={`${u.id}-${idx}`} value={u.id}>
                  {u.name} ({u.role === 'CUSTOMER' && u.id === 'USR-4091' ? 'Adversary Profile' : u.role})
                </option>
              ))}
            </select>

            <span className={`text-[10px] px-1.5 py-0.5 rounded border font-mono ${getRoleBadge(currentUser.role)}`}>
              {currentUser.role}
            </span>
          </div>

          {/* Export PDF Report Button */}
          <button
            onClick={onOpenReportModal}
            title="Export Executive Security Report as PDF"
            className="flex items-center gap-1.5 text-xs bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer font-medium"
          >
            <FileText className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Export PDF</span>
          </button>

          {/* Reset Demo Button */}
          <button
            onClick={onResetDemo}
            disabled={isResetting}
            title="Reset database to demo seed state"
            className="flex items-center gap-1.5 text-xs bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin text-blue-400' : ''}`} />
            <span className="hidden md:inline">Reset Baseline</span>
          </button>

          {/* Sign Out Button */}
          {onLogout && (
            <button
              onClick={onLogout}
              title="Sign out to Login Page"
              className="flex items-center gap-1.5 text-xs bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/60 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 text-red-400" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          )}
        </div>
      </div>

      {/* Navigation Sub-bar */}
      <nav className="max-w-7xl mx-auto px-4 flex items-center gap-1 overflow-x-auto py-1 scrollbar-none">
        {navTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-md whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40 shadow-sm shadow-blue-900/30 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-400' : 'text-slate-500'}`} />
              {tab.label}
              {tab.id === 'cases' && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              )}
            </button>
          );
        })}
      </nav>
    </header>
  );
};
