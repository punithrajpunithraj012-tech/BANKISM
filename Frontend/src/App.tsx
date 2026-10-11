/**
 * BANKISM — Blue-Team AI Banking Firewall & Fraud Intelligence Platform
 * Master Application Container
 */

import React, { useState, useEffect } from 'react';
import { User, Account } from './types';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { FirewallAnalyzerView } from './components/FirewallAnalyzerView';
import { BankingAccountsView } from './components/BankingAccountsView';
import { ThreatProfilesView } from './components/ThreatProfilesView';
import { FraudNetworkGraphView } from './components/FraudNetworkGraphView';
import { SecurityCasesView } from './components/SecurityCasesView';
import { SharedIntelligenceView } from './components/SharedIntelligenceView';
import { AttackLabView } from './components/AttackLabView';
import { SecurityTestSuiteView } from './components/SecurityTestSuiteView';
import { AuditLogsView } from './components/AuditLogsView';
import { ExecutiveReportModal } from './components/ExecutiveReportModal';
import { LoginPage } from './components/LoginPage';
import { ShieldCheck, Lock } from 'lucide-react';

export default function App() {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User>({
    id: 'USR-1024',
    name: 'Priya Sharma',
    email: 'priya.sharma@apexbank.demo',
    role: 'CUSTOMER',
    accountId: 'ACC-1024',
  });
  const [currentAccount, setCurrentAccount] = useState<Account | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [analyzerPrompt, setAnalyzerPrompt] = useState<string>('Transfer ₹500 to Rahul.');
  const [analyzerUserId, setAnalyzerUserId] = useState<string>('USR-1024');
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Load initial users & current account
  const loadUserContext = async (targetUserId: string = 'USR-1024') => {
    try {
      const [usersRes, meRes] = await Promise.all([
        fetch('/api/users'),
        fetch(`/api/me?userId=${targetUserId}`),
      ]);

      if (usersRes.ok) {
        const uList = await usersRes.json();
        setUsers(uList);
      }

      if (meRes.ok) {
        const meData = await meRes.json();
        if (meData.user) setCurrentUser(meData.user);
        if (meData.account) setCurrentAccount(meData.account);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadUserContext(currentUser.id);
  }, []);

  const handleSelectUser = (user: User) => {
    setCurrentUser(user);
    loadUserContext(user.id);
  };

  const handleResetDemo = async () => {
    setIsResetting(true);
    try {
      const res = await fetch('/api/reset-demo', { method: 'POST' });
      if (res.ok) {
        await loadUserContext(currentUser.id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsResetting(false);
    }
  };

  const navigateToAnalyzerWithPrompt = (prompt?: string, userId?: string) => {
    if (prompt) setAnalyzerPrompt(prompt);
    if (userId) {
      setAnalyzerUserId(userId);
      const u = users.find((x) => x.id === userId);
      if (u) setCurrentUser(u);
    }
    setActiveTab('analyzer');
  };

  if (!isAuthenticated) {
    return (
      <>
        <LoginPage
          users={users}
          onLogin={(user) => {
            handleSelectUser(user);
            setIsAuthenticated(true);
          }}
          onOpenReportModal={() => setIsReportModalOpen(true)}
        />
        <ExecutiveReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          currentUser={currentUser}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Header */}
      <Header
        currentUser={currentUser}
        users={users}
        onSelectUser={handleSelectUser}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onResetDemo={handleResetDemo}
        onOpenReportModal={() => setIsReportModalOpen(true)}
        onLogout={() => setIsAuthenticated(false)}
        isResetting={isResetting}
      />

      {/* Main View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 pb-12">
        {activeTab === 'dashboard' && (
          <DashboardView
            onNavigateToAnalyzer={navigateToAnalyzerWithPrompt}
            onNavigateToCases={() => setActiveTab('cases')}
            onNavigateToSharedIntel={() => setActiveTab('shared-intel')}
            onOpenReportModal={() => setIsReportModalOpen(true)}
          />
        )}

        {activeTab === 'analyzer' && (
          <FirewallAnalyzerView
            currentUser={currentUser}
            users={users}
            currentAccount={currentAccount}
            initialPrompt={analyzerPrompt}
            initialUserId={analyzerUserId}
            onSelectUser={handleSelectUser}
            onTransactionCompleted={() => loadUserContext(currentUser.id)}
            onNavigateToCases={() => setActiveTab('cases')}
          />
        )}

        {activeTab === 'banking' && (
          <BankingAccountsView
            currentUser={currentUser}
            onInitiateTransfer={(prompt) => {
              setAnalyzerPrompt(prompt);
              setActiveTab('analyzer');
            }}
          />
        )}

        {activeTab === 'threats' && <ThreatProfilesView />}

        {activeTab === 'network' && <FraudNetworkGraphView />}

        {activeTab === 'cases' && (
          <SecurityCasesView
            currentUser={currentUser}
            onNavigateToSharedIntel={() => setActiveTab('shared-intel')}
          />
        )}

        {activeTab === 'shared-intel' && <SharedIntelligenceView />}

        {activeTab === 'attack-lab' && <AttackLabView />}

        {activeTab === 'tests' && <SecurityTestSuiteView />}

        {activeTab === 'audit' && <AuditLogsView currentUser={currentUser} />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#0a0f1d] py-4 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300 tracking-wider font-mono">BANKISM DEFENSE</span>
            <span>•</span>
            <span className="text-slate-400 font-mono">
              "Never trust natural language with money."
            </span>
          </div>

          <div className="flex items-center gap-3 font-mono text-[11px] text-slate-400">
            <span>Deterministic Policy Over AI</span>
            <span>•</span>
            <span className="text-emerald-400 font-semibold">Simulated Financial Core (Zero Real Funds)</span>
          </div>
        </div>
      </footer>
      {/* Executive PDF Report Modal */}
      <ExecutiveReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        currentUser={currentUser}
      />
    </div>
  );
}
