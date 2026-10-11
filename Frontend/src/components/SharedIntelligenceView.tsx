/**
 * BANKISM SHARED FRAUD INTELLIGENCE NETWORK (FIN-INTEL)
 * Visualizes the interbank threat intelligence propagation flow:
 * Bank A detects → Report Created → Shared Intel Database → Bank B checks indicator → Victim Protected!
 */

import React, { useState, useEffect } from 'react';
import {
  Database,
  Building2,
  Share2,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Radio,
  Lock,
  Layers,
} from 'lucide-react';
import { FraudIntelligenceReport } from '../types';

export const SharedIntelligenceView: React.FC = () => {
  const [reports, setReports] = useState<FraudIntelligenceReport[]>([]);

  useEffect(() => {
    fetch('/api/security/shared-intelligence')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setReports(data);
      })
      .catch((err) => console.error(err));
  }, []);

  const flowSteps = [
    {
      step: 1,
      title: 'BANK A (Apex National)',
      desc: 'Detects high-risk injection and mule aggregation to Account X.',
      status: 'Threat Intercepted',
      color: 'border-blue-700 bg-blue-950/30 text-blue-300',
    },
    {
      step: 2,
      title: 'FRAUD REPORT CREATED',
      desc: 'Analyst verifies case and submits evidence package with pseudonymous identifiers.',
      status: 'Evidence Packaged',
      color: 'border-purple-700 bg-purple-950/30 text-purple-300',
    },
    {
      step: 3,
      title: 'SHARED INTELLIGENCE REGISTRY',
      desc: 'Indicator enters decentralized FIN-INTEL registry across participating financial institutions.',
      status: 'Propagated (4 Banks)',
      color: 'border-indigo-700 bg-indigo-950/30 text-indigo-300',
    },
    {
      step: 4,
      title: 'BANK B (Partner Bank)',
      desc: 'A new user tries to transfer money to Account X. Bank B queries shared intel, discovers indicator, and blocks the attack.',
      status: 'Victim Protected',
      color: 'border-emerald-700 bg-emerald-950/30 text-emerald-300',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
            <Database className="w-5 h-5 text-purple-400" />
            Interbank Shared Fraud Intelligence Network (FIN-INTEL)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Simulates inter-institution threat intelligence sharing. Preventing cross-bank money mule syndicates through cooperative defense.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-950/60 border border-purple-800/80 text-xs font-mono text-purple-300">
          <Radio className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
          <span>NETWORK SYNC: 4 MEMBER INSTITUTIONS</span>
        </div>
      </div>

      {/* Visual Interbank Flow Diagram */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
        <h2 className="text-xs font-bold text-slate-200 uppercase font-mono tracking-wider">
          Collaborative Protection Architecture
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 relative">
          {flowSteps.map((f, i) => (
            <div
              key={f.step}
              className={`p-4 rounded-xl border flex flex-col justify-between ${f.color} relative`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-950 font-bold border border-slate-800">
                    PHASE 0{f.step}
                  </span>
                  <span className="text-[10px] font-mono font-semibold">{f.status}</span>
                </div>
                <h3 className="text-xs font-bold text-white mt-1">{f.title}</h3>
                <p className="text-[11px] text-slate-300 mt-1.5 leading-relaxed">{f.desc}</p>
              </div>

              {i < flowSteps.length - 1 && (
                <div className="hidden md:block absolute -right-2 top-1/2 -translate-y-1/2 z-10 text-slate-500">
                  <ArrowRight className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Shared Indicators Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Share2 className="w-4 h-4 text-purple-400" />
              Active Indicators in FIN-INTEL Threat Registry
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Live indicators verified by fraud analysts and propagated across participating banking gateways.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">{reports.length} Reports Registered</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-mono">
              <tr>
                <th className="p-3">REPORT ID</th>
                <th className="p-3">INDICATOR / PSEUDONYM</th>
                <th className="p-3">REPORTING INSTITUTION</th>
                <th className="p-3">THREAT VECTOR</th>
                <th className="p-3">RISK SCORE</th>
                <th className="p-3">NETWORK STATUS</th>
                <th className="p-3">TIMESTAMP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {reports.map((r, idx) => (
                <tr key={`${r.reportId}-${idx}`} className="hover:bg-slate-950/40 transition-colors">
                  <td className="p-3 font-mono font-bold text-purple-300">{r.reportId}</td>
                  <td className="p-3 font-mono font-bold text-slate-200">{r.receiverPseudonym}</td>
                  <td className="p-3 text-slate-300">{r.reportingBank}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-red-950 text-red-300 border border-red-800">
                      {r.threatCategories.join(', ')}
                    </span>
                  </td>
                  <td className="p-3 font-mono font-bold text-red-400">{r.riskScore}/100</td>
                  <td className="p-3">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-mono">
                      <CheckCircle2 className="w-3 h-3" /> {r.status}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-slate-400 text-[11px]">
                    {new Date(r.timestamp).toLocaleDateString('en-US', {
                      month: 'short',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
