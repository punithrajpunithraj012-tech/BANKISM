/**
 * BANKISM Security Gateway — Login & Authentication Interface
 * Supports email/ID login, demo credentials, and 1-click role selection (Customer, Analyst, Admin, Threat Actor).
 */

import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Lock,
  ArrowRight,
  UserCheck,
  Cpu,
  KeyRound,
  FileText,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { User } from '../types';

interface LoginPageProps {
  users: User[];
  onLogin: (user: User) => void;
  onOpenReportModal?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  users,
  onLogin,
  onOpenReportModal,
}) => {
  const [identifier, setIdentifier] = useState('priya.sharma@apexbank.demo');
  const [password, setPassword] = useState('bankism2026');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    setTimeout(() => {
      // Find matching user by email or ID
      const cleaned = identifier.trim().toLowerCase();
      const matched = users.find(
        (u) =>
          u.email.toLowerCase() === cleaned ||
          u.id.toLowerCase() === cleaned ||
          u.name.toLowerCase().includes(cleaned)
      );

      if (matched) {
        onLogin(matched);
      } else {
        // Fallback default to first user or show error
        setErrorMsg(`Account not found for "${identifier}". Use one of the demo accounts below.`);
        setIsLoading(false);
      }
    }, 350);
  };

  const handleQuickSelect = (user: User) => {
    setIdentifier(user.email);
    setPassword('bankism2026');
    setErrorMsg(null);
    setIsLoading(true);
    setTimeout(() => {
      onLogin(user);
    }, 200);
  };

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col justify-between selection:bg-blue-600 selection:text-white">
      {/* Top Brand Bar */}
      <div className="border-b border-slate-800/80 bg-[#0a0f1d] px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-900 border border-blue-500/40 shadow-sm">
            <ShieldCheck className="w-5 h-5 text-blue-200" />
          </div>
          <div>
            <div className="text-sm font-bold text-white tracking-wider font-mono">BANKISM</div>
            <div className="text-[10px] text-slate-400">Blue-Team AI Banking Firewall</div>
          </div>
        </div>

        {onOpenReportModal && (
          <button
            onClick={onOpenReportModal}
            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1.5 transition-colors cursor-pointer font-medium"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Executive Security Report</span>
          </button>
        )}
      </div>

      {/* Main Login Workspace */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 my-auto">
        <div className="max-w-md w-full bg-[#0d1424] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6 sm:p-8 space-y-6 relative">
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl -z-10 pointer-events-none" />

          {/* Heading */}
          <div className="text-center space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-950/80 text-blue-300 border border-blue-800/60 text-[10px] font-mono tracking-wider uppercase mb-1">
              <Lock className="w-3 h-3 text-blue-400" />
              AUTHENTICATED GATEWAY ACCESS
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Sign In to BANKISM
            </h1>
            <p className="text-xs text-slate-400">
              Select a persona or enter demo credentials to test role-based banking security.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleFormSubmit} className="space-y-4">
            {errorMsg && (
              <div className="p-3 rounded-lg bg-red-950/60 border border-red-800 text-red-200 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>Account Email or User ID</span>
                <span className="text-[10px] font-mono text-slate-500">e.g. USR-1024</span>
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="priya.sharma@apexbank.demo"
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 font-sans"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>Password / Passkey</span>
                <span className="text-[10px] font-mono text-slate-500">Demo: bankism2026</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-3.5 pr-10 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 font-sans"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 text-xs shadow-lg shadow-blue-950/60 transition-all cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Enter Security Console</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Personas Selector */}
          <div className="space-y-2.5 pt-2 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="font-semibold text-slate-300">Quick 1-Click Persona Sign-In:</span>
              <span className="text-[10px] text-slate-500 font-mono">RBAC Sandbox</span>
            </div>

            <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
              {users.map((u, idx) => {
                const isSelected = u.email === identifier;
                let roleColor = 'text-emerald-400 border-emerald-900/60 bg-emerald-950/40';
                let roleLabel = 'Customer (Clean)';

                if (u.role === 'ADMIN') {
                  roleColor = 'text-purple-400 border-purple-900/60 bg-purple-950/40';
                  roleLabel = 'Admin (CSO)';
                } else if (u.role === 'SECURITY_ANALYST') {
                  roleColor = 'text-blue-400 border-blue-900/60 bg-blue-950/40';
                  roleLabel = 'Security Analyst';
                } else if (u.id === 'USR-4091') {
                  roleColor = 'text-red-400 border-red-900/60 bg-red-950/40';
                  roleLabel = 'Adversary (Threat Profile)';
                } else if (u.id === 'USR-3042') {
                  roleColor = 'text-amber-400 border-amber-900/60 bg-amber-950/40';
                  roleLabel = 'Customer (High-Risk History)';
                }

                return (
                  <button
                    key={`${u.id}-${idx}`}
                    type="button"
                    onClick={() => handleQuickSelect(u)}
                    className={`w-full text-left p-2.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-blue-950/40 border-blue-500/80 text-white shadow-sm'
                        : 'bg-slate-950/60 hover:bg-slate-900/80 border-slate-850 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                        <span>{u.name}</span>
                        <span className="text-[10px] text-slate-500 font-mono">({u.id})</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">{u.email}</div>
                    </div>

                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${roleColor}`}>
                      {roleLabel}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-800/80 bg-[#0a0f1d] py-3 text-center text-xs text-slate-500 font-mono">
        BANKISM Blue-Team AI Banking Firewall • Zero Real Money Moved • Simulated Sandbox
      </div>
    </div>
  );
};
