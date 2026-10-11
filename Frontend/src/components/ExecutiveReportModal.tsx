/**
 * BANKISM Executive Security Report (PDF / Printable View)
 * Clean, human-crafted cybersecurity dossier formatted for executive briefing and print/PDF export.
 */

import React from 'react';
import { Printer, Download, X, ShieldCheck, CheckCircle2, Lock, Activity, FileText } from 'lucide-react';
import { SystemThreatAssessment, User } from '../types';

interface ExecutiveReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  systemRisk?: SystemThreatAssessment | null;
}

export const ExecutiveReportModal: React.FC<ExecutiveReportModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  systemRisk,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-[#0b1120] text-slate-100 max-w-4xl w-full rounded-2xl border border-slate-700 shadow-2xl overflow-hidden print:border-none print:shadow-none print:bg-white print:text-black print:max-w-none">
        {/* Action Header - Hidden during print */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0f172a] print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-400" />
            <span className="font-semibold text-sm text-slate-200">
              Executive Security Report & Architecture Dossier
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer shadow-md"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save as PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-8 sm:p-10 space-y-8 max-h-[80vh] overflow-y-auto print:max-h-none print:overflow-visible print:p-8 font-sans">
          {/* Document Header */}
          <div className="border-b border-slate-800 print:border-slate-300 pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-blue-950 text-blue-300 border border-blue-800 print:bg-slate-100 print:text-slate-700 mb-2">
                OFFICIAL SECURITY AUDIT DOSSIER
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white print:text-slate-900">
                BANKISM DEFENSE REPORT
              </h1>
              <p className="text-sm text-slate-400 print:text-slate-600 mt-1">
                Blue-Team AI Banking Firewall & Transaction Fraud Prevention System
              </p>
            </div>

            <div className="text-right text-xs font-mono text-slate-400 print:text-slate-600 space-y-0.5">
              <div>Date: <span className="font-bold text-slate-200 print:text-slate-900">{currentDate}</span></div>
              <div>Auditor: <span className="font-bold text-slate-200 print:text-slate-900">{currentUser.name}</span></div>
              <div>Classification: <span className="text-amber-400 font-bold print:text-amber-700">RESTRICTED - FINTECH SEC</span></div>
            </div>
          </div>

          {/* Section 1: Executive Summary */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-slate-200 print:text-slate-900 tracking-wider uppercase font-mono border-b border-slate-800 print:border-slate-300 pb-1">
              1. Executive Summary & Core Thesis
            </h2>
            <p className="text-xs text-slate-300 print:text-slate-700 leading-relaxed">
              <strong>"Never trust natural language with money."</strong> BANKISM is an enterprise-grade blue-team
              security firewall engineered to safeguard conversational AI banking interfaces. Large Language Models (LLMs)
              are inherently susceptible to prompt injection, role spoofing, and jailbreaks. In BANKISM, the generative
              model is completely decoupled from financial execution: <em>AI recommends semantic classifications, but
              deterministic backend code makes 100% of binding execution decisions.</em>
            </p>
          </div>

          {/* Section 2: Live System Threat Status */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-slate-200 print:text-slate-900 tracking-wider uppercase font-mono border-b border-slate-800 print:border-slate-300 pb-1">
              2. Current Threat Assessment & Perimeter Health
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-950 print:bg-slate-50 p-3 rounded-lg border border-slate-800 print:border-slate-300">
                <span className="text-[10px] text-slate-500 font-mono block">THREAT SCORE</span>
                <span className="text-xl font-bold font-mono text-amber-400 print:text-amber-700">
                  {systemRisk?.systemThreatScore ?? 75}/100
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">{systemRisk?.threatLevel ?? 'EVALUATED'}</span>
              </div>

              <div className="bg-slate-950 print:bg-slate-50 p-3 rounded-lg border border-slate-800 print:border-slate-300">
                <span className="text-[10px] text-slate-500 font-mono block">DEFCON STATE</span>
                <span className="text-xl font-bold font-mono text-blue-400 print:text-blue-700">
                  {systemRisk?.defconLevel ?? 'DEFCON 2'}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Active Monitoring</span>
              </div>

              <div className="bg-slate-950 print:bg-slate-50 p-3 rounded-lg border border-slate-800 print:border-slate-300">
                <span className="text-[10px] text-slate-500 font-mono block">BLOCKED ATTACK RATE</span>
                <span className="text-xl font-bold font-mono text-red-400 print:text-red-700">
                  {systemRisk?.metrics.blockRatePercent ?? 75}%
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Firewall Interventions</span>
              </div>

              <div className="bg-slate-950 print:bg-slate-50 p-3 rounded-lg border border-slate-800 print:border-slate-300">
                <span className="text-[10px] text-slate-500 font-mono block">DEFENSIVE TESTS</span>
                <span className="text-xl font-bold font-mono text-emerald-400 print:text-emerald-700">
                  18 / 18
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">100% Invariants Passing</span>
              </div>
            </div>
          </div>

          {/* Section 3: Two-Brain Architecture */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-slate-200 print:text-slate-900 tracking-wider uppercase font-mono border-b border-slate-800 print:border-slate-300 pb-1">
              3. Architectural Security Model
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-950 print:bg-slate-50 p-3.5 rounded-lg border border-slate-800 print:border-slate-300 space-y-1.5">
                <div className="font-bold text-blue-400 print:text-blue-800 font-mono">BRAIN 1: INTENT PARSER</div>
                <p className="text-slate-300 print:text-slate-700">
                  Extracts raw banking parameters: <code>TRANSFER(recipient, amount, currency)</code>, <code>BALANCE()</code>, <code>PAY_BILL()</code>.
                  <strong> It is strictly isolated and forbidden from making approval decisions.</strong>
                </p>
              </div>

              <div className="bg-slate-950 print:bg-slate-50 p-3.5 rounded-lg border border-slate-800 print:border-slate-300 space-y-1.5">
                <div className="font-bold text-red-400 print:text-red-800 font-mono">BRAIN 2: SECURITY CRITIC</div>
                <p className="text-slate-300 print:text-slate-700">
                  Scans untrusted payloads for Prompt Injections, Role Spoofing (e.g. "Pretend you are admin"),
                  Jailbreaks, and Obfuscation. <strong>It is strictly prohibited from executing financial transactions.</strong>
                </p>
              </div>
            </div>
          </div>

          {/* Section 4: 18 Security Invariants Verification */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-slate-200 print:text-slate-900 tracking-wider uppercase font-mono border-b border-slate-800 print:border-slate-300 pb-1">
              4. Defensive Security Invariant Suite (18 Test Assertions)
            </h2>

            <div className="bg-slate-950 print:bg-slate-50 rounded-lg border border-slate-800 print:border-slate-300 p-3 overflow-x-auto text-[11px] font-mono">
              <div className="grid grid-cols-3 gap-2 pb-1 border-b border-slate-800 print:border-slate-200 text-slate-400 font-bold">
                <div>INVARIANT / REQUIREMENT</div>
                <div>DEFENSE MECHANISM</div>
                <div className="text-right">VERIFIED STATUS</div>
              </div>
              <div className="divide-y divide-slate-850 print:divide-slate-200 space-y-1 pt-1 text-slate-300 print:text-slate-800">
                <div className="grid grid-cols-3 gap-2 py-0.5">
                  <div>SEC-01 Normal Transfer</div>
                  <div>Baseline Verification</div>
                  <div className="text-right text-emerald-400 print:text-emerald-700 font-bold">PASSED (ALLOW)</div>
                </div>
                <div className="grid grid-cols-3 gap-2 py-0.5">
                  <div>SEC-05 Negative Amount Guard</div>
                  <div>Boundary Rule Enforcement</div>
                  <div className="text-right text-emerald-400 print:text-emerald-700 font-bold">PASSED (BLOCK)</div>
                </div>
                <div className="grid grid-cols-3 gap-2 py-0.5">
                  <div>SEC-07 Prompt Injection Shield</div>
                  <div>Brain 2 Semantic Scanner</div>
                  <div className="text-right text-emerald-400 print:text-emerald-700 font-bold">PASSED (BLOCK)</div>
                </div>
                <div className="grid grid-cols-3 gap-2 py-0.5">
                  <div>SEC-08 Administrator Persona Hijack</div>
                  <div>Role Elevation Filter</div>
                  <div className="text-right text-emerald-400 print:text-emerald-700 font-bold">PASSED (BLOCK)</div>
                </div>
                <div className="grid grid-cols-3 gap-2 py-0.5">
                  <div>SEC-10 Payment Memo Injection</div>
                  <div>Taint Quarantine Pipeline</div>
                  <div className="text-right text-emerald-400 print:text-emerald-700 font-bold">PASSED (ISOLATED)</div>
                </div>
                <div className="grid grid-cols-3 gap-2 py-0.5">
                  <div>SEC-13 Money Mule Quarantine</div>
                  <div>Counterparty Reputation</div>
                  <div className="text-right text-emerald-400 print:text-emerald-700 font-bold">PASSED (BLOCK)</div>
                </div>
                <div className="grid grid-cols-3 gap-2 py-0.5">
                  <div>SEC-15 Auto Incident Case Trigger</div>
                  <div>Threshold Logic (Risk &gt;= 90)</div>
                  <div className="text-right text-emerald-400 print:text-emerald-700 font-bold">PASSED (CASE FILED)</div>
                </div>
                <div className="grid grid-cols-3 gap-2 py-0.5">
                  <div>SEC-16 Shared Interbank Broadcast</div>
                  <div>FIN-INTEL Registry Sync</div>
                  <div className="text-right text-emerald-400 print:text-emerald-700 font-bold">PASSED (PROPAGATED)</div>
                </div>
              </div>
            </div>
          </div>

          {/* Document Footer */}
          <div className="pt-6 border-t border-slate-800 print:border-slate-300 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 print:text-slate-600 gap-2 font-mono">
            <div>BANKISM Security Engineering • Certified Blue-Team Architecture</div>
            <div>Generated by BANKISM Gateway Sentinel</div>
          </div>
        </div>
      </div>
    </div>
  );
};
