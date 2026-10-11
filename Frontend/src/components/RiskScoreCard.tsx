/**
 * BANKISM SYSTEM-WIDE RISK SCORE COMPONENT
 * Visualizes the current system-wide threat level based on recent firewall activity logs,
 * active threat vectors, rolling block ratios, and critical review queue status.
 */

import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Flame,
  Radio,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowRight,
  Activity,
  Lock,
  Layers,
  Crosshair,
} from 'lucide-react';
import { SystemThreatAssessment, SecurityDecision } from '../types';

interface RiskScoreCardProps {
  onNavigateToAnalyzer?: (prompt?: string, userId?: string) => void;
  onNavigateToCases?: () => void;
}

export const RiskScoreCard: React.FC<RiskScoreCardProps> = ({
  onNavigateToAnalyzer,
  onNavigateToCases,
}) => {
  const [assessment, setAssessment] = useState<SystemThreatAssessment | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchThreatAssessment = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/security/system-risk');
      if (res.ok) {
        const data: SystemThreatAssessment = await res.json();
        setAssessment(data);
      }
    } catch (err) {
      console.error('Failed to load system threat assessment:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchThreatAssessment();
    const interval = setInterval(fetchThreatAssessment, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, []);

  const getThreatColor = (level?: string) => {
    switch (level) {
      case 'SEVERE':
        return {
          text: 'text-red-400',
          bg: 'bg-red-950/50',
          border: 'border-red-600/60',
          glow: 'glow-red',
          badge: 'bg-red-950 text-red-200 border-red-700',
          stroke: '#ef4444',
          defconBg: 'bg-red-600 text-white',
        };
      case 'HIGH':
        return {
          text: 'text-orange-400',
          bg: 'bg-orange-950/50',
          border: 'border-orange-600/60',
          glow: 'glow-amber',
          badge: 'bg-orange-950 text-orange-200 border-orange-700',
          stroke: '#f97316',
          defconBg: 'bg-orange-600 text-white',
        };
      case 'ELEVATED':
        return {
          text: 'text-amber-400',
          bg: 'bg-amber-950/50',
          border: 'border-amber-600/60',
          glow: 'glow-amber',
          badge: 'bg-amber-950 text-amber-200 border-amber-700',
          stroke: '#f59e0b',
          defconBg: 'bg-amber-600 text-slate-900',
        };
      default:
        return {
          text: 'text-emerald-400',
          bg: 'bg-emerald-950/50',
          border: 'border-emerald-600/60',
          glow: 'glow-emerald',
          badge: 'bg-emerald-950 text-emerald-200 border-emerald-700',
          stroke: '#10b981',
          defconBg: 'bg-emerald-600 text-slate-950',
        };
    }
  };

  const colors = getThreatColor(assessment?.threatLevel);
  const score = assessment?.systemThreatScore ?? 25;

  // SVG Gauge calculations (semi-circle / 240 degree gauge)
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  // Use a 240-degree arc:
  const arcLength = circumference * 0.75;
  const strokeDashoffset = arcLength - (arcLength * score) / 100;

  return (
    <div
      className={`bg-slate-900/95 border ${colors.border} rounded-xl p-5 ${colors.glow} transition-all relative overflow-hidden`}
    >
      {/* Background Cyber Mesh Accent */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/5 rounded-full blur-3xl -z-10 pointer-events-none" />

      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3.5 mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-slate-950 border border-slate-800 text-blue-400 shadow-inner">
            <Crosshair className="w-5 h-5 text-blue-400 animate-spin-slow" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                System-Wide Threat Level & Risk Score
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono tracking-wider uppercase bg-blue-950 text-blue-300 border border-blue-800">
                SENTINEL LOGS SYNTHESIS
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Live threat index synthesized continuously from recent firewall logs, blocked vectors, and counterparty reputation.
            </p>
          </div>
        </div>

        {/* DEFCON & Refresh */}
        <div className="flex items-center gap-2.5">
          {assessment && (
            <div className="flex items-center gap-2">
              <span
                className={`px-2.5 py-1 rounded text-xs font-mono font-black tracking-widest uppercase shadow-md ${colors.defconBg}`}
              >
                {assessment.defconLevel}
              </span>
              <span className={`px-2.5 py-1 rounded text-xs font-mono font-bold border ${colors.badge}`}>
                {assessment.threatLevel}
              </span>
            </div>
          )}

          <button
            onClick={fetchThreatAssessment}
            disabled={isLoading}
            title="Refresh System Threat Index"
            className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Middle Grid: Circular Gauge (Left) + Metrics & Status (Middle) + Active Vectors (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
        {/* 1. Circular Threat Gauge (4 cols) */}
        <div className="lg:col-span-4 bg-slate-950/80 rounded-xl p-4 border border-slate-850 flex flex-col items-center justify-center text-center relative">
          <div className="relative w-40 h-40 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 160 160">
              {/* Background Track */}
              <circle
                cx="80"
                cy="80"
                r={radius}
                fill="none"
                stroke="#1e293b"
                strokeWidth="12"
                strokeDasharray={`${arcLength} ${circumference}`}
                strokeLinecap="round"
              />
              {/* Dynamic Value Arc */}
              <circle
                cx="80"
                cy="80"
                r={radius}
                fill="none"
                stroke={colors.stroke}
                strokeWidth="12"
                strokeDasharray={`${arcLength} ${circumference}`}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
              />
            </svg>

            {/* Inner Gauge Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[10px] font-mono text-slate-400 tracking-wider uppercase">
                THREAT SCORE
              </span>
              <span className={`text-3xl font-black font-mono tracking-tight ${colors.text}`}>
                {score}
              </span>
              <span className="text-[10px] font-mono text-slate-400">/ 100</span>

              {assessment && (
                <div className="flex items-center gap-1 text-[10px] font-mono mt-1 text-slate-300">
                  {assessment.trend === 'INCREASING' ? (
                    <TrendingUp className="w-3 h-3 text-red-400" />
                  ) : assessment.trend === 'DECREASING' ? (
                    <TrendingDown className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Minus className="w-3 h-3 text-amber-400" />
                  )}
                  <span>{assessment.trend}</span>
                </div>
              )}
            </div>
          </div>

          <div className="text-[11px] text-slate-400 font-mono mt-2">
            Perimeter Security: <span className="text-slate-200 font-bold">{assessment?.threatLevel || 'EVALUATING'}</span>
          </div>
        </div>

        {/* 2. System Status & Metrics Grid (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          {/* Status Message Box */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
              DEFENSIVE SENTINEL DIRECTIVE
            </span>
            <p className="text-xs text-slate-200 font-medium mt-1 leading-relaxed">
              {assessment?.statusMessage || 'Analyzing recent firewall logs...'}
            </p>
          </div>

          {/* 4 Rolling Metric Tiles */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-500 font-mono block">RECENT BLOCK RATE</span>
              <span className="text-base font-bold font-mono text-red-400">
                {assessment?.metrics.blockRatePercent ?? 0}%
              </span>
              <span className="text-[10px] text-slate-500 block font-mono">
                {assessment?.metrics.blockedCount} of {assessment?.metrics.totalEvaluated} blocked
              </span>
            </div>

            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-500 font-mono block">AVG EVENT RISK</span>
              <span className="text-base font-bold font-mono text-amber-400">
                {assessment?.metrics.avgRiskScore ?? 0}
              </span>
              <span className="text-[10px] text-slate-500 block font-mono">
                Peak: {assessment?.metrics.peakRiskScore ?? 0}/100
              </span>
            </div>

            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-500 font-mono block">VERIFIED PASS RATE</span>
              <span className="text-base font-bold font-mono text-emerald-400">
                {assessment?.metrics.allowCount ?? 0}
              </span>
              <span className="text-[10px] text-slate-500 block font-mono">Approved transfers</span>
            </div>

            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-500 font-mono block">ACTIVE FRAUD CASES</span>
              <span className="text-base font-bold font-mono text-rose-400">
                {assessment?.metrics.activeCriticalCases ?? 0}
              </span>
              <span className="text-[10px] text-slate-500 block font-mono">Pending review queue</span>
            </div>
          </div>
        </div>

        {/* 3. Recent Activity Logs & Active Threat Vectors (4 cols) */}
        <div className="lg:col-span-4 bg-slate-950/80 rounded-xl p-3.5 border border-slate-850 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200 font-mono uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-blue-400" />
              Recent Firewall Interventions
            </span>
            <span className="text-[10px] font-mono text-slate-500">Live Feed</span>
          </div>

          {/* Activity Logs Stream */}
          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 text-xs">
            {assessment?.recentLogs && assessment.recentLogs.length > 0 ? (
              assessment.recentLogs.map((log, idx) => (
                <div
                  key={`${log.id || 'log'}-${idx}`}
                  className="bg-slate-900/90 p-2 rounded border border-slate-800/80 flex items-center justify-between text-[11px] hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-2 truncate pr-2">
                    <span
                      className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold ${
                        log.decision === 'BLOCK'
                          ? 'bg-red-950 text-red-300 border border-red-800'
                          : log.decision === 'VERIFY'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      }`}
                    >
                      {log.decision}
                    </span>
                    <span className="text-slate-300 font-medium truncate max-w-[150px]">
                      {log.type}
                    </span>
                  </div>
                  <span className="font-mono text-amber-400 text-[10px] whitespace-nowrap">
                    {log.riskScore} pts
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-slate-500 text-xs">
                No recent activity logged yet.
              </div>
            )}
          </div>

          {/* Action Links */}
          <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80 text-[11px]">
            {onNavigateToAnalyzer && (
              <button
                onClick={() => onNavigateToAnalyzer()}
                className="flex-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 py-1.5 rounded transition-all cursor-pointer font-medium flex items-center justify-center gap-1"
              >
                <span>Live Firewall</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}

            {onNavigateToCases && (
              <button
                onClick={onNavigateToCases}
                className="flex-1 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 py-1.5 rounded transition-all cursor-pointer font-medium flex items-center justify-center gap-1"
              >
                <span>Review Queue</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
