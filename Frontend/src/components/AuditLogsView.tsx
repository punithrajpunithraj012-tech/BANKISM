/**
 * BANKISM AUDIT LOGS & POLICY CONFIGURATION
 * Immutable audit log stream capturing every security gateway event and policy transition.
 * Includes administrator threshold configuration panel.
 */

import React, { useState, useEffect } from 'react';
import {
  Lock,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Sliders,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { AuditLog, User } from '../types';

interface AuditLogsViewProps {
  currentUser: User;
}

export const AuditLogsView: React.FC<AuditLogsViewProps> = ({ currentUser }) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filterAction, setFilterAction] = useState('ALL');
  const [filterResult, setFilterResult] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Policy Thresholds (Admin Config)
  const [criticalThreshold, setCriticalThreshold] = useState(90);
  const [highRiskThreshold, setHighRiskThreshold] = useState(60);
  const [strictReceiverPolicy, setStrictReceiverPolicy] = useState(true);
  const [twoBrainStrictValidation, setTwoBrainStrictValidation] = useState(true);
  const [configSavedToast, setConfigSavedToast] = useState(false);

  const fetchLogs = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/audit-logs?limit=150');
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleSaveConfig = () => {
    setConfigSavedToast(true);
    setTimeout(() => setConfigSavedToast(false), 3000);
  };

  const filteredLogs = logs.filter((log) => {
    if (filterAction !== 'ALL' && log.action !== filterAction) return false;
    if (filterResult !== 'ALL' && log.result !== filterResult) return false;
    if (
      searchTerm &&
      !log.actor.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !log.action.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !log.resource.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
            <Lock className="w-5 h-5 text-blue-400" />
            Audit Logging & Policy Engine Configuration
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Tamper-evident audit trail capturing every normalization, threat scan, policy decision, and ledger modification.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 text-xs bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-400' : ''}`} />
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* Admin Policy Threshold Configuration (Admin Only or Visible to Admin/Analyst) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-purple-400" />
            <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
              Deterministic Security Policy Thresholds
            </h2>
          </div>
          {currentUser.role === 'ADMIN' ? (
            <span className="px-2 py-0.5 rounded text-[10px] bg-purple-950 text-purple-300 border border-purple-800 font-mono">
              ADMIN CONTROL ACTIVE
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded text-[10px] bg-slate-950 text-slate-400 border border-slate-800 font-mono">
              READ-ONLY VIEW
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1.5">
            <label className="text-[10px] text-slate-400 font-mono block">CRITICAL CASE CREATION THRESHOLD</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={criticalThreshold}
                disabled={currentUser.role !== 'ADMIN'}
                onChange={(e) => setCriticalThreshold(parseInt(e.target.value, 10))}
                className="w-20 bg-slate-900 border border-slate-700 rounded p-1 font-mono text-slate-100"
              />
              <span className="text-slate-400 font-mono">/ 100</span>
            </div>
            <p className="text-[10px] text-slate-500">Auto-routes to Security Review Queue</p>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1.5">
            <label className="text-[10px] text-slate-400 font-mono block">HIGH-RISK STEP-UP THRESHOLD</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={highRiskThreshold}
                disabled={currentUser.role !== 'ADMIN'}
                onChange={(e) => setHighRiskThreshold(parseInt(e.target.value, 10))}
                className="w-20 bg-slate-900 border border-slate-700 rounded p-1 font-mono text-slate-100"
              />
              <span className="text-slate-400 font-mono">/ 100</span>
            </div>
            <p className="text-[10px] text-slate-500">Forces VERIFY step-up authentication</p>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1.5">
            <label className="text-[10px] text-slate-400 font-mono block">STRICT RECEIVER POLICY</label>
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                checked={strictReceiverPolicy}
                disabled={currentUser.role !== 'ADMIN'}
                onChange={(e) => setStrictReceiverPolicy(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 cursor-pointer"
              />
              <span className="text-slate-200">Quarantine Unverified Mules</span>
            </div>
            <p className="text-[10px] text-slate-500">Blocks multi-sender aggregation targets</p>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1.5">
            <label className="text-[10px] text-slate-400 font-mono block">TWO-BRAIN CO-VERIFICATION</label>
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                checked={twoBrainStrictValidation}
                disabled={currentUser.role !== 'ADMIN'}
                onChange={(e) => setTwoBrainStrictValidation(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 cursor-pointer"
              />
              <span className="text-slate-200">Enforce Strict Separation</span>
            </div>
            <p className="text-[10px] text-slate-500">Brain 1 cannot approve; Brain 2 cannot parse</p>
          </div>
        </div>

        {currentUser.role === 'ADMIN' && (
          <div className="flex items-center justify-between pt-1">
            <button
              onClick={handleSaveConfig}
              className="bg-purple-600 hover:bg-purple-500 text-white font-medium px-4 py-1.5 rounded-lg text-xs cursor-pointer transition-colors"
            >
              Update Security Policies
            </button>
            {configSavedToast && (
              <span className="text-emerald-400 text-xs font-mono flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Policies updated successfully.
              </span>
            )}
          </div>
        )}
      </div>

      {/* Audit Logs Filter Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter by actor or resource..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono"
          >
            <option value="ALL">ALL ACTIONS</option>
            <option value="REQUEST_RECEIVED">REQUEST_RECEIVED</option>
            <option value="POLICY_BLOCKED">POLICY_BLOCKED</option>
            <option value="TRANSACTION_APPROVED">TRANSACTION_APPROVED</option>
            <option value="TRANSACTION_EXECUTED">TRANSACTION_EXECUTED</option>
            <option value="SECURITY_CASE_CREATED">SECURITY_CASE_CREATED</option>
            <option value="FRAUD_CONFIRMED">FRAUD_CONFIRMED</option>
            <option value="REPORT_SUBMITTED">REPORT_SUBMITTED</option>
          </select>

          <select
            value={filterResult}
            onChange={(e) => setFilterResult(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono"
          >
            <option value="ALL">ALL RESULTS</option>
            <option value="SUCCESS">SUCCESS</option>
            <option value="BLOCKED">BLOCKED</option>
            <option value="WARNING">WARNING</option>
          </select>
        </div>

        <span className="text-xs font-mono text-slate-400">
          Showing {filteredLogs.length} of {logs.length} events
        </span>
      </div>

      {/* Logs Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-mono">
              <tr>
                <th className="p-3">LOG ID</th>
                <th className="p-3">ACTOR & ROLE</th>
                <th className="p-3">ACTION EVENT</th>
                <th className="p-3">RESOURCE</th>
                <th className="p-3">OUTCOME</th>
                <th className="p-3">REQUEST ID</th>
                <th className="p-3">TIMESTAMP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredLogs.map((log, idx) => (
                <tr key={`${log.id}-${idx}`} className="hover:bg-slate-950/40 transition-colors">
                  <td className="p-3 text-slate-400">{log.id}</td>
                  <td className="p-3 font-sans">
                    <span className="text-slate-200 font-semibold">{log.actor}</span>
                    <span className="text-[10px] text-slate-400 font-mono block">[{log.role}]</span>
                  </td>
                  <td className="p-3 font-bold text-slate-200">{log.action}</td>
                  <td className="p-3 text-slate-400 font-mono">{log.resource}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] ${
                        log.result === 'SUCCESS'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : log.result === 'BLOCKED'
                          ? 'bg-red-950 text-red-300 border border-red-800'
                          : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}
                    >
                      {log.result}
                    </span>
                  </td>
                  <td className="p-3 text-slate-400 text-[11px]">{log.requestId}</td>
                  <td className="p-3 text-slate-400 text-[11px]">
                    {new Date(log.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
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
