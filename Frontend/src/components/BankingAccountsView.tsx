/**
 * BANKISM BANKING ACCOUNTS & SIMULATED LEDGER
 * Customer banking view: balances, verified beneficiaries,
 * and ledger transactions with BANKISM security verification stamps.
 */

import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Send,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  Building2,
  Users,
} from 'lucide-react';
import { Account, TransactionRecord, User, Beneficiary } from '../types';

interface BankingAccountsViewProps {
  currentUser: User;
  onInitiateTransfer: (prompt: string) => void;
}

export const BankingAccountsView: React.FC<BankingAccountsViewProps> = ({
  currentUser,
  onInitiateTransfer,
}) => {
  const [account, setAccount] = useState<Account | null>(null);
  const [allAccounts, setAllAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [quickRecipient, setQuickRecipient] = useState('Rahul');
  const [quickAmount, setQuickAmount] = useState('500');

  const loadData = async () => {
    try {
      const [accRes, txRes, allAccRes] = await Promise.all([
        fetch(`/api/me?userId=${currentUser.id}`),
        fetch(`/api/transactions?userId=${currentUser.id}`),
        fetch('/api/accounts'),
      ]);

      const accData = await accRes.json();
      if (accData.account) setAccount(accData.account);

      const txData = await txRes.json();
      if (Array.isArray(txData)) setTransactions(txData);

      const allData = await allAccRes.json();
      if (Array.isArray(allData)) setAllAccounts(allData);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser.id]);

  const handleQuickSend = () => {
    if (!quickAmount || !quickRecipient) return;
    const prompt = `Transfer ₹${quickAmount} to ${quickRecipient}.`;
    onInitiateTransfer(prompt);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-400" />
            Simulated Banking Ledger & Customer Accounts
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Demo financial simulation. Every transaction must be validated and signed by Bankism before ledger entry.
          </p>
        </div>
      </div>

      {/* Account Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Main Balance Card */}
        <div className="bg-gradient-to-br from-slate-900 to-blue-950/40 border border-blue-900/40 rounded-xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase font-mono">
              PRIMARY CHECKING ACCOUNT
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono">
              {account?.status || 'ACTIVE'}
            </span>
          </div>

          <div className="text-3xl font-extrabold text-white font-mono">
            {account ? `${account.currency} ${account.balance.toLocaleString()}` : '₹0'}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800 text-xs font-mono text-slate-300 space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Account No:</span>
              <span>{account?.accountNumber || 'IN-APEX-4901'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Bank:</span>
              <span>{account?.bankName || 'Apex National Bank'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Typical Range:</span>
              <span>₹{account?.typicalTransferMin || 500} – ₹{account?.typicalTransferMax || 5000}</span>
            </div>
          </div>
        </div>

        {/* Quick Transfer Widget */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-3">
          <h2 className="text-xs font-bold text-slate-200 flex items-center gap-1.5 uppercase font-mono">
            <Send className="w-4 h-4 text-blue-400" />
            Quick Natural Transfer Gateway
          </h2>
          <p className="text-[11px] text-slate-400">
            Submit a simulated payment. Bankism will intercept the request and evaluate prompt safety before ledger debit.
          </p>

          <div className="space-y-2 text-xs">
            <div>
              <label className="text-[10px] text-slate-400 font-mono">RECIPIENT</label>
              <select
                value={quickRecipient}
                onChange={(e) => setQuickRecipient(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-slate-200 mt-0.5 font-sans"
              >
                <option value="Rahul">Rahul (Verified Beneficiary - Clean)</option>
                <option value="Tata Power Electricity Board">Tata Power Electricity Board (Utility)</option>
                <option value="Account X">Account X (Known Fraud Mule - Hostile)</option>
                <option value="FastEscrow">FastEscrow (Suspicious Proxy)</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 font-mono">AMOUNT (₹)</label>
              <input
                type="number"
                value={quickAmount}
                onChange={(e) => setQuickAmount(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-slate-200 mt-0.5 font-mono"
              />
            </div>

            <button
              onClick={handleQuickSend}
              className="w-full mt-2 bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 rounded text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>Route Through Bankism Firewall</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Verified Beneficiaries */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-3">
          <h2 className="text-xs font-bold text-slate-200 flex items-center gap-1.5 uppercase font-mono">
            <Users className="w-4 h-4 text-emerald-400" />
            Verified Beneficiaries
          </h2>
          <p className="text-[11px] text-slate-400">
            Pre-cleared contacts within the sender's banking network.
          </p>

          <div className="space-y-2 text-xs">
            <div className="bg-slate-950 p-2.5 rounded border border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-200">Rahul Verma</div>
                <div className="text-[10px] text-slate-500 font-mono">IN-APEX-2201-1002</div>
              </div>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono">
                VERIFIED
              </span>
            </div>

            <div className="bg-slate-950 p-2.5 rounded border border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-200">Tata Power Electricity</div>
                <div className="text-[10px] text-slate-500 font-mono">IN-UTIL-1001-9904</div>
              </div>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono">
                UTILITY
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Ledger Transactions Table with Bankism Security Stamps */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Banking Core Ledger & Transaction History
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Each row displays the compiled deterministic command and BANKISM defense verification stamp.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">{transactions.length} Records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-mono">
              <tr>
                <th className="p-3">TRANSACTION ID</th>
                <th className="p-3">COUNTERPARTY</th>
                <th className="p-3">AMOUNT</th>
                <th className="p-3">STRUCTURED COMMAND</th>
                <th className="p-3">FIREWALL STAMP</th>
                <th className="p-3">STATUS</th>
                <th className="p-3">DATE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-500">
                    No transactions recorded for this account.
                  </td>
                </tr>
              ) : (
                transactions.map((tx, idx) => (
                  <tr key={`${tx.id}-${idx}`} className="hover:bg-slate-950/40 transition-colors">
                    <td className="p-3 font-mono text-slate-300">{tx.id}</td>
                    <td className="p-3 font-semibold text-slate-200">{tx.toRecipientName}</td>
                    <td className="p-3 font-mono font-bold text-slate-100">
                      ₹{tx.amount.toLocaleString()}
                    </td>
                    <td className="p-3 font-mono text-[11px] text-blue-300">
                      {tx.commandType}
                    </td>
                    <td className="p-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/80 text-[10px] font-mono">
                        <ShieldCheck className="w-3 h-3" /> VERIFIED (RISK {tx.riskScore})
                      </span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                          tx.status === 'COMPLETED'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-red-950 text-red-300 border border-red-800'
                        }`}
                      >
                        {tx.status}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-slate-400 text-[11px]">
                      {new Date(tx.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: '2-digit',
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Accounts in Simulation Directory */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
        <h3 className="text-xs font-semibold text-slate-300 mb-3 uppercase font-mono">
          All Simulated Banking Accounts in Demo Ledger
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {allAccounts.map((acc, idx) => (
            <div key={`${acc.id}-${idx}`} className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-200">{acc.holderName}</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                    acc.status === 'ACTIVE'
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                      : acc.status === 'FLAGGED'
                      ? 'bg-amber-950 text-amber-300 border-amber-800'
                      : 'bg-red-950 text-red-300 border-red-800'
                  }`}
                >
                  {acc.status}
                </span>
              </div>
              <div className="text-[11px] font-mono text-slate-400">{acc.accountNumber}</div>
              <div className="font-mono text-slate-300">
                Balance: {acc.currency} {acc.balance.toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
