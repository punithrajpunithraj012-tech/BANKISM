/**
 * BANKISM SECURITY REVIEW QUEUE & CASE MANAGEMENT
 * Triage high-risk security incidents (Risk >= 90), inspect forensic evidence packages,
 * update case statuses, add analyst notes, and propagate indicators to Shared Fraud Intelligence.
 */

import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  Lock,
  CheckCircle2,
  Share2,
  FileText,
  Clock,
  Plus,
  Send,
  Database,
  Search,
} from 'lucide-react';
import { FraudCase, CaseStatus, User } from '../types';

interface SecurityCasesViewProps {
  currentUser: User;
  onNavigateToSharedIntel?: () => void;
}

export const SecurityCasesView: React.FC<SecurityCasesViewProps> = ({
  currentUser,
  onNavigateToSharedIntel,
}) => {
  const [cases, setCases] = useState<FraudCase[]>([]);
  const [selectedCase, setSelectedCase] = useState<FraudCase | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [newNote, setNewNote] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [reportSuccessMsg, setReportSuccessMsg] = useState<string | null>(null);

  const fetchCases = async () => {
    try {
      const res = await fetch('/api/security/cases');
      if (res.ok) {
        const data = await res.json();
        setCases(data);
        if (data.length > 0 && !selectedCase) {
          setSelectedCase(data[0]);
        } else if (selectedCase) {
          const updated = data.find((c: FraudCase) => c.caseId === selectedCase.caseId);
          if (updated) setSelectedCase(updated);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

  const handleUpdateStatus = async (newStatus: CaseStatus) => {
    if (!selectedCase) return;
    try {
      const res = await fetch(`/api/security/cases/${selectedCase.caseId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          analystId: currentUser.id,
          analystName: currentUser.name,
          note: `Case transitioned to ${newStatus} by ${currentUser.name}`,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setSelectedCase(updated);
        fetchCases();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase || !newNote.trim()) return;

    try {
      const res = await fetch(`/api/security/cases/${selectedCase.caseId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          note: newNote.trim(),
          analystId: currentUser.id,
          analystName: currentUser.name,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setSelectedCase(updated);
        setNewNote('');
        fetchCases();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReportToSharedIntel = async () => {
    if (!selectedCase) return;
    setIsSubmittingReport(true);
    setReportSuccessMsg(null);

    try {
      const res = await fetch(`/api/security/cases/${selectedCase.caseId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analystId: currentUser.id,
          analystName: currentUser.name,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setReportSuccessMsg(data.message);
        fetchCases();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const filteredCases = cases.filter((c) => {
    if (filterStatus === 'ALL') return true;
    return c.status === filterStatus;
  });

  const getStatusBadge = (status: CaseStatus) => {
    switch (status) {
      case 'OPEN':
        return 'bg-blue-950 text-blue-300 border-blue-800';
      case 'INVESTIGATING':
        return 'bg-amber-950 text-amber-300 border-amber-800';
      case 'CONFIRMED_FRAUD':
        return 'bg-red-950 text-red-300 border-red-800 font-bold';
      case 'FALSE_POSITIVE':
        return 'bg-emerald-950 text-emerald-300 border-emerald-800';
      case 'REPORTED':
        return 'bg-purple-950 text-purple-300 border-purple-800 font-bold';
      case 'CLOSED':
        return 'bg-slate-900 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-400" />
            Security Review Queue & Incident Case Triage
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Critical risk requests (&gt;=90) are quarantined automatically. Authorized analysts investigate evidence and report to Shared Intelligence.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 text-[11px] font-mono">STATUS:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 text-xs font-mono"
          >
            <option value="ALL">ALL CASES ({cases.length})</option>
            <option value="OPEN">OPEN</option>
            <option value="INVESTIGATING">INVESTIGATING</option>
            <option value="CONFIRMED_FRAUD">CONFIRMED_FRAUD</option>
            <option value="REPORTED">REPORTED</option>
            <option value="CLOSED">CLOSED</option>
          </select>
        </div>
      </div>

      {/* 2-Column Workspace: Cases Table + Case Forensic Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Cases List (5 cols) */}
        <div className="lg:col-span-5 space-y-2.5">
          {filteredCases.map((c, idx) => {
            const isSelected = selectedCase?.caseId === c.caseId;
            return (
              <div
                key={`${c.caseId}-${idx}`}
                onClick={() => setSelectedCase(c)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 border-blue-500 shadow-md shadow-blue-950/40'
                    : 'bg-slate-950/80 hover:bg-slate-900/60 border-slate-800/80'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono text-xs font-bold text-slate-200">{c.caseId}</span>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${getStatusBadge(c.status)}`}>
                      {c.status}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-red-950 text-red-300 font-mono font-bold">
                      {c.riskScore}/100
                    </span>
                  </div>
                </div>

                <div className="text-xs font-semibold text-slate-200 line-clamp-1">{c.title}</div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mt-2 pt-2 border-t border-slate-800/60">
                  <span>Target: {c.receiverIdentifier}</span>
                  <span>{new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit' })}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Case Forensic Dossier (7 cols) */}
        <div className="lg:col-span-7">
          {selectedCase ? (
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-5">
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-slate-400">{selectedCase.caseId}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${getStatusBadge(selectedCase.status)}`}>
                      {selectedCase.status}
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-white mt-1">{selectedCase.title}</h2>
                </div>

                {/* Status Transition Control */}
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400 font-mono">Set Status:</span>
                  <select
                    value={selectedCase.status}
                    onChange={(e) => handleUpdateStatus(e.target.value as CaseStatus)}
                    className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 font-mono"
                  >
                    <option value="OPEN">OPEN</option>
                    <option value="INVESTIGATING">INVESTIGATING</option>
                    <option value="CONFIRMED_FRAUD">CONFIRMED_FRAUD</option>
                    <option value="FALSE_POSITIVE">FALSE_POSITIVE</option>
                    <option value="CLOSED">CLOSED</option>
                  </select>
                </div>
              </div>

              {/* Evidence Package */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 uppercase font-mono flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-blue-400" />
                    Forensic Evidence Package
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    Fingerprint: {selectedCase.evidencePackage.transactionFingerprint}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 font-mono">ORIGINAL ADVERSARIAL PROMPT</span>
                    <p className="bg-slate-900 p-2.5 rounded border border-slate-800 font-mono text-slate-200 mt-0.5">
                      "{selectedCase.evidencePackage.originalPrompt}"
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 font-mono">NORMALIZED EVIDENCE</span>
                    <p className="bg-slate-900 p-2 rounded border border-slate-800 font-mono text-slate-300 text-[11px] mt-0.5">
                      "{selectedCase.evidencePackage.normalizedPrompt}"
                    </p>
                  </div>

                  {/* Signals */}
                  <div>
                    <span className="text-[10px] text-slate-400 font-mono">DETECTED ADVERSARIAL SIGNALS</span>
                    <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px] mt-1">
                      {selectedCase.evidencePackage.detectedSignals.map((sig, idx) => (
                        <li key={idx}>{sig}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Shared Intelligence Action Box */}
              <div className="p-4 rounded-xl border border-purple-900/60 bg-gradient-to-r from-purple-950/40 to-slate-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-purple-400" />
                    <span className="text-xs font-bold text-purple-200">Shared Interbank Fraud Intelligence</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Propagate pseudonymous indicator ({selectedCase.receiverIdentifier}) to member banks to prevent multi-institution drain.
                  </p>
                </div>

                {selectedCase.reportedToIntelligence ? (
                  <span className="px-3 py-1.5 rounded-lg bg-purple-900/60 text-purple-200 border border-purple-700/60 text-xs font-mono font-bold flex items-center gap-1.5 whitespace-nowrap">
                    <CheckCircle2 className="w-4 h-4 text-purple-300" />
                    REPORTED ({selectedCase.reportId})
                  </span>
                ) : (
                  <button
                    onClick={handleReportToSharedIntel}
                    disabled={isSubmittingReport}
                    className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap shadow-md shadow-purple-950"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Report to Shared Intelligence</span>
                  </button>
                )}
              </div>

              {reportSuccessMsg && (
                <div className="p-2.5 rounded bg-purple-950/80 border border-purple-800 text-purple-200 text-xs font-mono">
                  {reportSuccessMsg}
                </div>
              )}

              {/* Analyst Notes Thread */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <span className="text-xs font-bold text-slate-200 uppercase font-mono block">
                  Analyst Investigation Notes ({selectedCase.notes.length})
                </span>

                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {selectedCase.notes.map((note, nIdx) => (
                    <div key={`${note.id}-${nIdx}`} className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-xs space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                        <span className="font-semibold text-slate-300">{note.analystName}</span>
                        <span>{new Date(note.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-slate-300 text-[11px]">{note.note}</p>
                    </div>
                  ))}
                </div>

                {/* Add Note Form */}
                <form onSubmit={handleAddNote} className="flex gap-2">
                  <input
                    type="text"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Log analyst observation or forensics..."
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="submit"
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer"
                  >
                    Add Note
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="text-center py-16 text-slate-500 text-xs">Select a case from the review queue.</div>
          )}
        </div>
      </div>
    </div>
  );
};
