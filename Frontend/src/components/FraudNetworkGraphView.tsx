/**
 * BANKISM FRAUD RELATIONSHIP GRAPH
 * Visual network investigation canvas representing Users, Accounts,
 * Transactions, and Mule Aggregation Rings.
 * Allows analysts to click nodes and inspect forensic metrics and edges.
 */

import React, { useState, useEffect } from 'react';
import {
  Share2,
  Users,
  CreditCard,
  AlertTriangle,
  Lock,
  ArrowRight,
  ShieldAlert,
  Info,
} from 'lucide-react';
import { GraphNode, GraphEdge } from '../types';

export const FraudNetworkGraphView: React.FC = () => {
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  useEffect(() => {
    fetch('/api/security/graph')
      .then((res) => res.json())
      .then((data) => {
        if (data.nodes && data.edges) {
          setNodes(data.nodes);
          setEdges(data.edges);
          // Default select the mule account node
          const mule = data.nodes.find((n: GraphNode) => n.id === 'ACC-8821');
          if (mule) setSelectedNode(mule);
        }
      })
      .catch((err) => console.error(err));
  }, []);

  // Compute connected edges for selected node
  const connectedEdges = selectedNode
    ? edges.filter((e) => e.source === selectedNode.id || e.target === selectedNode.id)
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
            <Share2 className="w-5 h-5 text-blue-400" />
            Fraud Relationship Graph & Mule Network Topology
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Visual forensic graph tracing multi-sender funneling into centralized mule aggregation accounts.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Users ({nodes.filter((n) => n.type === 'USER').length})
          </span>
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Accounts
          </span>
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Flagged Mules (2)
          </span>
        </div>
      </div>

      {/* Main Workspace: Visual Canvas + Inspector Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Interactive SVG Network Canvas (8 cols) */}
        <div className="lg:col-span-8 bg-slate-900/90 border border-slate-800 rounded-xl p-4 min-h-[480px] flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-2">
            <span>GRAPH TOPOLOGY (CLICK NODE TO INSPECT)</span>
            <span>PSEUDONYMOUS DEMO IDENTIFIERS</span>
          </div>

          {/* SVG Diagram */}
          <div className="w-full flex-1 flex items-center justify-center p-4">
            <svg viewBox="0 0 740 400" className="w-full h-auto max-h-[380px] select-none">
              <defs>
                <marker id="arrow" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b" />
                </marker>
                <marker id="arrow-red" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#ef4444" />
                </marker>
              </defs>

              {/* Connecting Lines (Edges) */}
              {/* User USR-1024 -> Account ACC-1024 */}
              <line x1="120" y1="80" x2="300" y2="80" stroke="#334155" strokeWidth="2" strokeDasharray="4 4" />
              {/* ACC-1024 -> Rahul (ACC-1002) - CLEAN */}
              <line x1="300" y1="80" x2="520" y2="80" stroke="#10b981" strokeWidth="2.5" markerEnd="url(#arrow)" />
              <text x="410" y="70" fill="#10b981" fontSize="10" fontFamily="monospace" textAnchor="middle">
                ₹500 (Clean)
              </text>

              {/* User USR-3042 -> Account ACC-3042 */}
              <line x1="120" y1="200" x2="300" y2="200" stroke="#334155" strokeWidth="2" strokeDasharray="4 4" />
              {/* ACC-3042 -> ACC-8821 (Mule X) - BLOCKED */}
              <line x1="300" y1="200" x2="520" y2="230" stroke="#ef4444" strokeWidth="3" markerEnd="url(#arrow-red)" />
              <text x="400" y="195" fill="#ef4444" fontSize="10" fontFamily="monospace" textAnchor="middle">
                ₹95,000 (Blocked)
              </text>

              {/* User USR-4091 (Attacker) -> Account ACC-4091 */}
              <line x1="120" y1="320" x2="300" y2="320" stroke="#334155" strokeWidth="2" strokeDasharray="4 4" />
              {/* ACC-4091 -> ACC-8821 (Mule X) */}
              <line x1="300" y1="320" x2="520" y2="230" stroke="#ef4444" strokeWidth="3" markerEnd="url(#arrow-red)" />
              <text x="400" y="295" fill="#ef4444" fontSize="10" fontFamily="monospace" textAnchor="middle">
                ₹50,000 (Blocked Inj)
              </text>

              {/* ACC-8821 -> ACC-5512 (FastEscrow Mule Link) */}
              <line x1="520" y1="230" x2="650" y2="310" stroke="#f59e0b" strokeWidth="2" strokeDasharray="3 3" markerEnd="url(#arrow)" />
              <text x="610" y="260" fill="#f59e0b" fontSize="9" fontFamily="monospace">
                ₹120K (Drain Ring)
              </text>

              {/* Node: USR-1024 (Priya Sharma) */}
              <g
                onClick={() => setSelectedNode(nodes.find((n) => n.id === 'USR-1024') || null)}
                className="cursor-pointer"
              >
                <circle cx="120" cy="80" r="22" fill="#1e293b" stroke="#3b82f6" strokeWidth="2" />
                <text x="120" y="84" textAnchor="middle" fill="#93c5fd" fontSize="11" fontWeight="bold">PS</text>
                <text x="120" y="115" textAnchor="middle" fill="#cbd5e1" fontSize="10">USR-1024</text>
              </g>

              {/* Node: USR-3042 (Vikram Mehta) */}
              <g
                onClick={() => setSelectedNode(nodes.find((n) => n.id === 'USR-3042') || null)}
                className="cursor-pointer"
              >
                <circle cx="120" cy="200" r="22" fill="#1e293b" stroke="#f59e0b" strokeWidth="2" />
                <text x="120" y="204" textAnchor="middle" fill="#fcd34d" fontSize="11" fontWeight="bold">VM</text>
                <text x="120" y="235" textAnchor="middle" fill="#cbd5e1" fontSize="10">USR-3042</text>
              </g>

              {/* Node: USR-4091 (Aditya Roy) */}
              <g
                onClick={() => setSelectedNode(nodes.find((n) => n.id === 'USR-4091') || null)}
                className="cursor-pointer"
              >
                <circle cx="120" cy="320" r="22" fill="#1e293b" stroke="#ef4444" strokeWidth="2" />
                <text x="120" y="324" textAnchor="middle" fill="#fca5a5" fontSize="11" fontWeight="bold">AR</text>
                <text x="120" y="355" textAnchor="middle" fill="#cbd5e1" fontSize="10">USR-4091</text>
              </g>

              {/* Node: ACC-1024 */}
              <g
                onClick={() => setSelectedNode(nodes.find((n) => n.id === 'ACC-1024') || null)}
                className="cursor-pointer"
              >
                <rect x="260" y="60" width="80" height="40" rx="8" fill="#0f172a" stroke="#10b981" strokeWidth="2" />
                <text x="300" y="84" textAnchor="middle" fill="#a7f3d0" fontSize="10" fontFamily="monospace">ACC-1024</text>
              </g>

              {/* Node: ACC-3042 */}
              <g
                onClick={() => setSelectedNode(nodes.find((n) => n.id === 'ACC-3042') || null)}
                className="cursor-pointer"
              >
                <rect x="260" y="180" width="80" height="40" rx="8" fill="#0f172a" stroke="#f59e0b" strokeWidth="2" />
                <text x="300" y="204" textAnchor="middle" fill="#fde68a" fontSize="10" fontFamily="monospace">ACC-3042</text>
              </g>

              {/* Node: ACC-4091 */}
              <g
                onClick={() => setSelectedNode(nodes.find((n) => n.id === 'ACC-4091') || null)}
                className="cursor-pointer"
              >
                <rect x="260" y="300" width="80" height="40" rx="8" fill="#0f172a" stroke="#ef4444" strokeWidth="2" />
                <text x="300" y="324" textAnchor="middle" fill="#fca5a5" fontSize="10" fontFamily="monospace">ACC-4091</text>
              </g>

              {/* Node: ACC-1002 (Rahul - Clean) */}
              <g
                onClick={() => setSelectedNode(nodes.find((n) => n.id === 'ACC-1002') || null)}
                className="cursor-pointer"
              >
                <rect x="480" y="60" width="90" height="40" rx="8" fill="#064e3b" stroke="#34d399" strokeWidth="2" />
                <text x="525" y="84" textAnchor="middle" fill="#d1fae5" fontSize="10" fontFamily="monospace">Rahul (Clean)</text>
              </g>

              {/* Node: ACC-8821 (Account X - Hostile Mule) */}
              <g
                onClick={() => setSelectedNode(nodes.find((n) => n.id === 'ACC-8821') || null)}
                className="cursor-pointer"
              >
                <circle cx="530" cy="230" r="32" fill="#7f1d1d" stroke="#ef4444" strokeWidth="3" />
                <text x="530" y="226" textAnchor="middle" fill="#fee2e2" fontSize="11" fontWeight="bold">Account X</text>
                <text x="530" y="242" textAnchor="middle" fill="#fca5a5" fontSize="9" fontFamily="monospace">ACC-8821</text>
              </g>

              {/* Node: ACC-5512 (FastEscrow - Mule Proxy) */}
              <g
                onClick={() => setSelectedNode(nodes.find((n) => n.id === 'ACC-5512') || null)}
                className="cursor-pointer"
              >
                <rect x="610" y="290" width="95" height="42" rx="8" fill="#451a03" stroke="#f59e0b" strokeWidth="2" />
                <text x="657" y="310" textAnchor="middle" fill="#fef3c7" fontSize="10" fontWeight="bold">FastEscrow</text>
                <text x="657" y="324" textAnchor="middle" fill="#fde68a" fontSize="9" fontFamily="monospace">ACC-5512</text>
              </g>
            </svg>
          </div>

          <div className="flex items-center gap-2 p-2 rounded bg-slate-950 border border-slate-800 text-[11px] text-slate-400">
            <Info className="w-4 h-4 text-blue-400 shrink-0" />
            <span>
              Topology demonstrates money mule funneling: multiple senders route funds towards Account X, which subsequently
              diverts to offshore escrow proxy FastEscrow.
            </span>
          </div>
        </div>

        {/* Node Forensic Detail Drawer (4 cols) */}
        <div className="lg:col-span-4 bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              Node Forensic Inspector
            </h2>
            {selectedNode && (
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                  selectedNode.riskScore >= 90
                    ? 'bg-red-950 text-red-300 border-red-800'
                    : selectedNode.riskScore >= 60
                    ? 'bg-amber-950 text-amber-300 border-amber-800'
                    : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                }`}
              >
                RISK {selectedNode.riskScore}/100
              </span>
            )}
          </div>

          {selectedNode ? (
            <div className="space-y-4 text-xs">
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-mono">NODE IDENTIFIER</span>
                <div className="text-base font-bold text-white mt-0.5">{selectedNode.label}</div>
                <div className="text-slate-400 font-mono text-[11px]">{selectedNode.id}</div>
              </div>

              {/* Forensic Metrics */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                  <span className="text-slate-500 text-[10px]">TOTAL TXNS</span>
                  <div className="text-sm font-bold text-slate-200 font-mono">
                    {selectedNode.details.transactionCount}
                  </div>
                </div>

                <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                  <span className="text-slate-500 text-[10px]">SECURITY EVENTS</span>
                  <div className="text-sm font-bold text-amber-400 font-mono">
                    {selectedNode.details.securityEventCount}
                  </div>
                </div>

                <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                  <span className="text-slate-500 text-[10px]">CONFIRMED FRAUD</span>
                  <div className="text-sm font-bold text-red-400 font-mono">
                    {selectedNode.details.confirmedFraudCount}
                  </div>
                </div>

                <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                  <span className="text-slate-500 text-[10px]">NODE TYPE</span>
                  <div className="text-xs font-bold text-slate-300 font-mono">
                    {selectedNode.type}
                  </div>
                </div>
              </div>

              {/* Edge Relationships */}
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-mono block mb-1.5">
                  LINKED CONNECTIONS ({connectedEdges.length})
                </span>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {connectedEdges.map((edge, idx) => (
                    <div
                      key={`${edge.id}-${idx}`}
                      className="bg-slate-950 p-2 rounded border border-slate-800 font-mono text-[11px] flex items-center justify-between"
                    >
                      <div>
                        <span className="text-slate-400">{edge.source}</span>
                        <span className="text-slate-600 mx-1">→</span>
                        <span className="text-slate-200 font-semibold">{edge.target}</span>
                      </div>
                      <span
                        className={`text-[10px] px-1 rounded ${
                          edge.type === 'MULE_LINK'
                            ? 'text-red-400 bg-red-950 border border-red-800'
                            : 'text-emerald-400 bg-emerald-950 border border-emerald-800'
                        }`}
                      >
                        {edge.type}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500 text-xs">
              Click any node in the network to inspect forensics.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
