/**
 * BANKISM THREAT INTELLIGENCE & REPUTATION PROFILES
 * Explores Sender Security History (Threat Memory) and Receiver Reputation Profile.
 * Clearly separates SUSPICIOUS, BLOCKED, and CONFIRMED_FRAUD.
 */

import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Search,
  Lock,
  AlertTriangle,
  History,
  Users,
  CheckCircle2,
  Database,
  Radio,
} from 'lucide-react';
import { SenderHistoryProfile, ReceiverReputationProfile, SecurityEvent } from '../types';

export const ThreatProfilesView: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('Account X');
  const [receiverRep, setReceiverRep] = useState<ReceiverReputationProfile | null>(null);
  const [allEvents, setAllEvents] = useState<SecurityEvent[]>([]);
  const [selectedUserEvents, setSelectedUserEvents] = useState<SecurityEvent[]>([]);
  const [activeProfileTab, setActiveProfileTab] = useState<'RECEIVER' | 'SENDER'>('RECEIVER');

  const fetchReputation = async (target: string) => {
    try {
      const res = await fetch(`/api/security/reputation/${encodeURIComponent(target)}`);
      if (res.ok) {
        const data = await res.json();
        setReceiverRep(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/security/events');
      if (res.ok) {
        const data = await res.json();
        setAllEvents(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchReputation(searchTerm);
    fetchEvents();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      fetchReputation(searchTerm.trim());
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-blue-400" />
            Threat Intelligence & Counterparty Reputation
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            BANKISM Threat Memory: Inspect dynamic sender history, receiver mule signatures, and interbank threat intelligence.
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search user, account, or handle..."
              className="bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 font-sans w-64"
            />
          </div>
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            Lookup
          </button>
        </form>
      </div>

      {/* Quick Lookup Chips */}
      <div className="flex items-center gap-2 flex-wrap text-xs">
        <span className="text-slate-400 text-[11px]">Quick Profiles:</span>
        {[
          { label: 'Account X (Hostile Mule)', q: 'Account X' },
          { label: 'Rahul (Clean Recipient)', q: 'Rahul' },
          { label: 'FastEscrow (Mule Proxy)', q: 'FastEscrow' },
          { label: 'Aditya Roy (Threat Actor)', q: 'USR-4091' },
          { label: 'Vikram Mehta (High Risk)', q: 'USR-3042' },
          { label: 'Priya Sharma (Clean)', q: 'USR-1024' },
        ].map((chip, idx) => (
          <button
            key={idx}
            onClick={() => {
              setSearchTerm(chip.q);
              fetchReputation(chip.q);
            }}
            className="px-2.5 py-1 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer text-[11px]"
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Two Column Layout: Receiver Profile + Threat Memory */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* RECEIVER REPUTATION PROFILE */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                COUNTERPARTY REPUTATION DOSSIER
              </span>
              <h2 className="text-base font-bold text-white flex items-center gap-2 mt-0.5">
                <Users className="w-4 h-4 text-blue-400" />
                {receiverRep ? receiverRep.identifier : searchTerm}
              </h2>
            </div>

            {receiverRep && (
              <span
                className={`px-2.5 py-1 rounded text-xs font-mono font-bold border ${
                  receiverRep.riskScore >= 90
                    ? 'bg-red-950 text-red-300 border-red-800'
                    : receiverRep.riskScore >= 60
                    ? 'bg-amber-950 text-amber-300 border-amber-800'
                    : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                }`}
              >
                SCORE {receiverRep.riskScore}/100 ({receiverRep.riskLevel})
              </span>
            )}
          </div>

          {receiverRep ? (
            <div className="space-y-4">
              {/* Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-400 font-mono">CONFIRMED FRAUDS</div>
                  <div className="text-lg font-bold text-red-400 font-mono mt-0.5">
                    {receiverRep.confirmedFraudAssociations}
                  </div>
                </div>

                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-400 font-mono">SUSPICIOUS TXNS</div>
                  <div className="text-lg font-bold text-amber-400 font-mono mt-0.5">
                    {receiverRep.previousSuspiciousTransactions}
                  </div>
                </div>

                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-400 font-mono">UNIQUE SENDERS</div>
                  <div className="text-lg font-bold text-slate-200 font-mono mt-0.5">
                    {receiverRep.uniqueSendersInvolved}
                  </div>
                </div>
              </div>

              {/* Status and Flags */}
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Account Classification:</span>
                  <span className="font-semibold text-slate-200">
                    {receiverRep.isKnownMuleAccount ? 'Identified Mule Account Ring' : 'Standard Counterparty'}
                  </span>
                </div>

                {receiverRep.bankName && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Routing Institution:</span>
                    <span className="font-mono text-slate-300">{receiverRep.bankName}</span>
                  </div>
                )}

                {receiverRep.sharedIntelligenceFlag && (
                  <div className="flex items-center gap-2 p-2 rounded bg-red-950/60 border border-red-800/80 text-red-200 text-xs mt-2">
                    <Database className="w-4 h-4 text-red-400 shrink-0" />
                    <div>
                      <div className="font-bold">Interbank Intelligence Hit</div>
                      <div className="text-[11px] text-red-300">{receiverRep.sharedIntelligenceSource}</div>
                    </div>
                  </div>
                )}
              </div>

              <div className="text-[11px] text-slate-400 leading-relaxed">
                Bankism checks both sender and receiver prior to authorizing execution. Even if a sender has an spotless
                track record, transfers to high-risk or mule counterparty accounts are intercepted deterministically.
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500 text-xs">No dossier loaded.</div>
          )}
        </div>

        {/* BANKISM THREAT MEMORY LOG */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                IMMUTABLE SECURITY EVENT AUDIT
              </span>
              <h2 className="text-base font-bold text-white flex items-center gap-2 mt-0.5">
                <History className="w-4 h-4 text-amber-400" />
                Bankism Threat Memory Stream
              </h2>
            </div>
            <span className="text-xs font-mono text-slate-400">{allEvents.length} Events Logged</span>
          </div>

          <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
            {allEvents.map((evt, idx) => (
              <div
                key={`${evt.eventId || 'evt'}-${idx}`}
                className="bg-slate-950 p-3 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                        evt.decision === 'BLOCK'
                          ? 'bg-red-950 text-red-300 border border-red-800'
                          : evt.decision === 'VERIFY'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      }`}
                    >
                      {evt.decision}
                    </span>
                    <span className="font-semibold text-slate-200">{evt.eventType}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    {new Date(evt.timestamp).toLocaleDateString('en-US', {
                      month: 'short',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <div className="text-[11px] text-slate-400 font-mono truncate">
                  User: <span className="text-slate-300">{evt.userId}</span> • Score:{' '}
                  <span className="text-amber-400">{evt.riskScore}/100</span>
                </div>

                <p className="text-[11px] text-slate-300 bg-slate-900/80 p-2 rounded border border-slate-850">
                  "{evt.originalInput}"
                </p>

                <div className="text-[10px] text-slate-400">
                  <span className="text-slate-500">Reason:</span> {evt.reason}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
