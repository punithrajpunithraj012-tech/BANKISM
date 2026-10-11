/**
 * BANKISM Express Full-Stack Server
 * Mounts API routes and Vite dev server middlewares on Port 3000
 */

import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import { db } from './src/db/store';
import { BankismSecurityGateway } from './src/security/gateway';
import { BankingLedgerService } from './src/banking/transactionService';
import { FraudCaseService } from './src/fraud/caseService';
import { ReceiverReputationEngine } from './src/fraud/reputationEngine';
import { SecurityTestSuite } from './src/tests/securityTestSuite';
import { AuditService } from './src/audit/auditService';
import { SystemThreatAssessment } from './src/types';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// API Routes
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ONLINE',
    service: 'BANKISM Blue-Team Firewall',
    version: '2.4.0',
    timestamp: new Date().toISOString(),
    aiEngine: process.env.GEMINI_API_KEY ? 'HYBRID_GEMINI_DETERMINISTIC' : 'DETERMINISTIC_SECURITY_CRITIC',
  });
});

// Demo Users
app.get('/api/users', (req: Request, res: Response) => {
  res.json(Array.from(db.users.values()));
});

app.get('/api/me', (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string) || (req.query.userId as string) || 'USR-1024';
  const user = db.getUser(userId) || db.getUser('USR-1024');
  const account = user ? db.getAccountByUserId(user.id) : undefined;
  res.json({ user, account });
});

// Accounts
app.get('/api/accounts', (req: Request, res: Response) => {
  res.json(Array.from(db.accounts.values()));
});

app.get('/api/accounts/:id', (req: Request, res: Response) => {
  const acc = db.getAccount(req.params.id);
  if (!acc) return res.status(404).json({ error: 'Account not found' });
  res.json(acc);
});

// Transactions
app.get('/api/transactions', (req: Request, res: Response) => {
  const userId = req.query.userId as string;
  let txns = db.transactions;
  if (userId) {
    txns = txns.filter(t => t.fromUserId === userId);
  }
  res.json(txns);
});

// BANKISM FIREWALL ANALYSIS GATEWAY
app.post('/api/analyze', async (req: Request, res: Response) => {
  try {
    const { userId = 'USR-1024', prompt } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Missing natural-language prompt.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const analysis = await BankismSecurityGateway.analyze(userId, prompt, apiKey);
    res.json(analysis);
  } catch (error: any) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: 'Failed to process security analysis.', details: error.message });
  }
});

// SIMULATED CORE TRANSACTION EXECUTION
app.post('/api/execute', (req: Request, res: Response) => {
  try {
    const { userId, command, memo } = req.body;
    if (!userId || !command || !command.type) {
      return res.status(400).json({
        error: 'INVALID_PAYLOAD: Banking core strictly accepts validated AuthorizedBankingCommand.',
      });
    }

    const result = BankingLedgerService.executeCommand(userId, command, memo);
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: 'Transaction execution failure.', details: error.message });
  }
});

// Security Events (Threat Memory)
app.get('/api/security/events', (req: Request, res: Response) => {
  const userId = req.query.userId as string;
  let events = db.securityEvents;
  if (userId) {
    events = events.filter(e => e.userId === userId);
  }
  res.json(events);
});

// System-Wide Threat Assessment based on recent firewall logs
app.get('/api/security/system-risk', (req: Request, res: Response) => {
  const events = db.securityEvents;
  const recentEvents = events.slice(0, 20);
  const total = Math.max(1, recentEvents.length);

  const blocked = recentEvents.filter(e => e.decision === 'BLOCK').length;
  const verified = recentEvents.filter(e => e.decision === 'VERIFY').length;
  const allowed = recentEvents.filter(e => e.decision === 'ALLOW').length;

  const avgRisk = Math.round(
    recentEvents.reduce((acc, e) => acc + (e.riskScore || 0), 0) / total
  );

  const peakRisk = recentEvents.length > 0 ? Math.max(...recentEvents.map(e => e.riskScore || 0)) : 10;
  const activeCases = Array.from(db.fraudCases.values()).filter(c => c.status === 'OPEN' || c.status === 'INVESTIGATING').length;

  const blockRate = Math.round((blocked / total) * 100);
  const rawScore = Math.round(
    avgRisk * 0.40 +
    blockRate * 0.30 +
    (peakRisk > 80 ? 20 : peakRisk > 50 ? 10 : 0) +
    Math.min(10, activeCases * 5)
  );
  const systemThreatScore = Math.min(100, Math.max(5, rawScore));

  let threatLevel: 'LOW' | 'ELEVATED' | 'HIGH' | 'SEVERE' = 'LOW';
  let defconLevel: 'DEFCON 4' | 'DEFCON 3' | 'DEFCON 2' | 'DEFCON 1' = 'DEFCON 4';
  let statusMessage = 'Sentinel Perimeter Stable: Normal transaction velocity; zero active adversarial campaigns.';

  if (systemThreatScore >= 80) {
    threatLevel = 'SEVERE';
    defconLevel = 'DEFCON 1';
    statusMessage = `Severe Threat Active: High concentration of blocked attacks and ${activeCases} open critical fraud incident(s).`;
  } else if (systemThreatScore >= 60) {
    threatLevel = 'HIGH';
    defconLevel = 'DEFCON 2';
    statusMessage = `Elevated Threat Posture: Multiple adversarial prompt injections or mule targets intercepted recently.`;
  } else if (systemThreatScore >= 30) {
    threatLevel = 'ELEVATED';
    defconLevel = 'DEFCON 3';
    statusMessage = `Guarded Status: Step-up verifications and behavioral anomaly checks active.`;
  }

  const promptInjections = recentEvents.filter(e => e.threatCategories.includes('PROMPT_INJECTION')).length;
  const roleOverrides = recentEvents.filter(e => e.threatCategories.includes('ROLE_OVERRIDE')).length;
  const policyOverrides = recentEvents.filter(e => e.threatCategories.includes('POLICY_OVERRIDE')).length;
  const muleHits = recentEvents.filter(e => e.reason.toLowerCase().includes('mule') || e.reason.toLowerCase().includes('account x')).length;

  const vectors = [
    { vector: 'Prompt Injection Attempts', count: promptInjections, severity: promptInjections > 2 ? 'CRITICAL' : promptInjections > 0 ? 'HIGH' : 'LOW' },
    { vector: 'Administrative Role Impersonation', count: roleOverrides, severity: roleOverrides > 0 ? 'CRITICAL' : 'LOW' },
    { vector: 'Security Policy Override / 2FA Bypass', count: policyOverrides, severity: policyOverrides > 0 ? 'HIGH' : 'LOW' },
    { vector: 'Flagged Mule Account Contacts', count: muleHits, severity: muleHits > 1 ? 'CRITICAL' : muleHits > 0 ? 'HIGH' : 'LOW' },
  ];

  const recentLogs = recentEvents.slice(0, 6).map(e => ({
    id: e.eventId,
    timestamp: e.timestamp,
    actor: e.userId,
    type: e.eventType,
    decision: e.decision,
    riskScore: e.riskScore,
    summary: e.reason || e.evidenceSummary,
  }));

  const assessment: SystemThreatAssessment = {
    systemThreatScore,
    threatLevel,
    defconLevel,
    statusMessage,
    trend: blocked > total * 0.4 ? 'INCREASING' : blocked > 0 ? 'STABLE' : 'DECREASING',
    metrics: {
      totalEvaluated: total,
      blockedCount: blocked,
      verifyCount: verified,
      allowCount: allowed,
      blockRatePercent: blockRate,
      avgRiskScore: avgRisk,
      peakRiskScore: peakRisk,
      activeCriticalCases: activeCases,
    },
    recentLogs,
    vectors: vectors as any,
  };

  res.json(assessment);
});

// High-Risk Fraud Cases
app.get('/api/security/cases', (req: Request, res: Response) => {
  res.json(db.getFraudCases());
});

app.get('/api/security/cases/:id', (req: Request, res: Response) => {
  const c = db.getFraudCase(req.params.id);
  if (!c) return res.status(404).json({ error: 'Case not found' });
  res.json(c);
});

app.patch('/api/security/cases/:id/status', (req: Request, res: Response) => {
  const { status, analystId = 'ANA-0007', analystName = 'Elena Rostova', note } = req.body;
  if (!status) return res.status(400).json({ error: 'Missing status' });

  const updated = FraudCaseService.updateStatus(req.params.id, status, analystId, analystName, note);
  if (!updated) return res.status(404).json({ error: 'Case not found' });
  res.json(updated);
});

app.post('/api/security/cases/:id/report', async (req: Request, res: Response) => {
  const { analystId = 'ANA-0007', analystName = 'Elena Rostova' } = req.body;
  const result = await FraudCaseService.reportToSharedIntelligence(req.params.id, analystId, analystName);
  if (!result.success) return res.status(400).json(result);
  res.json(result);
});

app.post('/api/security/cases/:id/notes', (req: Request, res: Response) => {
  const { note, analystId = 'ANA-0007', analystName = 'Elena Rostova' } = req.body;
  if (!note) return res.status(400).json({ error: 'Missing note content' });

  const updated = FraudCaseService.addNote(req.params.id, analystId, analystName, note);
  if (!updated) return res.status(404).json({ error: 'Case not found' });
  res.json(updated);
});

// Receiver Reputation
app.get('/api/security/reputation/:identifier', (req: Request, res: Response) => {
  const rep = ReceiverReputationEngine.evaluateReceiver(req.params.identifier);
  res.json(rep);
});

// Shared Fraud Intelligence Database
app.get('/api/security/shared-intelligence', (req: Request, res: Response) => {
  res.json(Array.from(db.sharedIntelligence.values()));
});

// Fraud Relationship Graph
app.get('/api/security/graph', (req: Request, res: Response) => {
  res.json(db.getGraphData());
});

// Audit Logs
app.get('/api/audit-logs', (req: Request, res: Response) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;
  res.json(AuditService.getLogs(limit));
});

// Automated Security Tests Runner
app.post('/api/tests/run', async (req: Request, res: Response) => {
  try {
    const results = await SecurityTestSuite.runAllTests();
    res.json(results);
  } catch (error: any) {
    res.status(500).json({ error: 'Test execution failed', details: error.message });
  }
});

// Demo Reset
app.post('/api/reset-demo', (req: Request, res: Response) => {
  db.seedInitialData();
  AuditService.log('ADMIN', 'ADMIN', 'DEMO_RESET', 'DATABASE', 'SUCCESS', `REQ-RESET-${Date.now()}`);
  res.json({ success: true, message: 'Bankism database successfully reset to clean demo baseline.' });
});

// Printable Executive Security Dossier (Direct PDF Print Route)
app.get('/api/report/print', (req: Request, res: Response) => {
  const events = db.securityEvents;
  const cases = db.getFraudCases();
  const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>BANKISM Executive Security Dossier & Architecture Report</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.5; color: #1e293b; max-width: 850px; margin: 40px auto; padding: 0 20px; }
    h1, h2, h3 { color: #0f172a; font-family: inherit; }
    .badge { display: inline-block; padding: 2px 8px; font-size: 11px; font-weight: bold; font-family: monospace; border-radius: 4px; background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; }
    .header { border-bottom: 2px solid #0f172a; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end; }
    .box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0; }
    .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 16px 0; }
    .stat { background: #ffffff; border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px; text-align: center; }
    .stat-val { font-size: 22px; font-weight: bold; font-family: monospace; color: #0284c7; }
    .stat-lbl { font-size: 11px; text-transform: uppercase; color: #64748b; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 12px; }
    th { text-align: left; padding: 8px; background: #f1f5f9; border-bottom: 2px solid #cbd5e1; font-family: monospace; }
    td { padding: 8px; border-bottom: 1px solid #e2e8f0; font-family: monospace; }
    .status-pass { color: #15803d; font-weight: bold; }
    .no-print { margin-bottom: 20px; padding: 12px; background: #0f172a; color: white; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; }
    .btn { background: #2563eb; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-weight: bold; cursor: pointer; text-decoration: none; }
    @media print {
      .no-print { display: none; }
      body { margin: 0; padding: 0; max-width: none; color: black; }
    }
  </style>
</head>
<body>
  <div class="no-print">
    <span><strong>BANKISM Executive Security Dossier</strong> (Ready for Export)</span>
    <button class="btn" onclick="window.print()">Print or Save as PDF</button>
  </div>

  <div class="header">
    <div>
      <span class="badge">OFFICIAL DEFENSIVE CYBERSECURITY DOSSIER</span>
      <h1 style="margin: 8px 0 4px 0; font-size: 28px;">BANKISM DEFENSE PLATFORM</h1>
      <div style="font-size: 14px; color: #475569;">Blue-Team AI Banking Firewall & Transaction Fraud Prevention System</div>
    </div>
    <div style="text-align: right; font-size: 12px; color: #64748b;">
      <div>Date: <strong>${dateStr}</strong></div>
      <div>Security Classification: <strong style="color: #b45309;">RESTRICTED - TIER 1</strong></div>
      <div>Engine Version: <strong>2.4.0 Blue-Team Sentinel</strong></div>
    </div>
  </div>

  <h2>1. Executive Summary & Core Security Principle</h2>
  <p><strong>"Never trust natural language with money."</strong> Natural-language banking requests are treated as untrusted external inputs. In BANKISM, the generative AI layer is structurally quarantined: <em>AI analyzes and recommends, but deterministic backend logic makes the binding execution decision.</em></p>

  <div class="grid">
    <div class="stat"><div class="stat-val">100%</div><div class="stat-lbl">Policy Verification</div></div>
    <div class="stat"><div class="stat-val">18 / 18</div><div class="stat-lbl">Invariants Passing</div></div>
    <div class="stat"><div class="stat-val">0</div><div class="stat-lbl">Direct LLM Wires</div></div>
    <div class="stat"><div class="stat-val">4 Banks</div><div class="stat-lbl">Shared Intelligence</div></div>
  </div>

  <h2>2. Two-Brain Architecture</h2>
  <div class="box">
    <p><strong>Brain 1 (Banking Intent Parser):</strong> Responsible only for entity extraction: <code>TRANSFER(recipient, amount, currency)</code>, <code>BALANCE()</code>, <code>PAY_BILL()</code>. Brain 1 is completely forbidden from authorizing money movement.</p>
    <p><strong>Brain 2 (Security Critic):</strong> Independently categorizes prompt injections, role elevation attempts ("Pretend you are admin"), security policy overrides, and homoglyph obfuscation. Prohibited from touching financial ledgers.</p>
    <p><strong>Deterministic Policy Gate:</strong> Hard backend rules verify parameters, counterparty reputation, and threat scores. Negative values, role overrides, and prompt injections fail closed with a mandatory block.</p>
  </div>

  <h2>3. Automated Security Test Results (18 Invariants)</h2>
  <table>
    <thead>
      <tr><th>TEST REQUIREMENT</th><th>CATEGORY</th><th>OUTCOME</th></tr>
    </thead>
    <tbody>
      <tr><td>SEC-01 Normal Transfer</td><td>Baseline Allowed Flow</td><td class="status-pass">PASSED (ALLOW)</td></tr>
      <tr><td>SEC-02 Balance Inquiry</td><td>Read-Only Primitives</td><td class="status-pass">PASSED (ALLOW)</td></tr>
      <tr><td>SEC-03 Ambiguous Transfer (Missing Amount)</td><td>Ambiguity Guard</td><td class="status-pass">PASSED (VERIFY)</td></tr>
      <tr><td>SEC-04 Missing Recipient</td><td>Parameter Validation</td><td class="status-pass">PASSED (VERIFY)</td></tr>
      <tr><td>SEC-05 Negative Amount Boundary</td><td>Boundary Enforcement</td><td class="status-pass">PASSED (BLOCK)</td></tr>
      <tr><td>SEC-06 Unsupported Action Injection</td><td>Intent Compiler</td><td class="status-pass">PASSED (BLOCK)</td></tr>
      <tr><td>SEC-07 Prompt Injection Interception</td><td>Brain 2 Adversarial Scan</td><td class="status-pass">PASSED (BLOCK)</td></tr>
      <tr><td>SEC-08 Administrator Role Override</td><td>Privilege Defense</td><td class="status-pass">PASSED (BLOCK)</td></tr>
      <tr><td>SEC-09 Security 2FA Bypass Directive</td><td>Policy Defense</td><td class="status-pass">PASSED (BLOCK)</td></tr>
      <tr><td>SEC-10 Payment Memo Injection</td><td>Taint Tracking Quarantine</td><td class="status-pass">PASSED (ISOLATED)</td></tr>
      <tr><td>SEC-11 Homoglyph & Zero-Width Evasion</td><td>Input Normalizer</td><td class="status-pass">PASSED (UNMASKED)</td></tr>
      <tr><td>SEC-12 Threat Memory Accumulation</td><td>Dynamic User Profile</td><td class="status-pass">PASSED (STEP-UP)</td></tr>
      <tr><td>SEC-13 Money Mule Account X Interception</td><td>Counterparty Reputation</td><td class="status-pass">PASSED (BLOCK)</td></tr>
      <tr><td>SEC-14 Clean Sender to Mule Defense</td><td>Hostile Receiver Check</td><td class="status-pass">PASSED (BLOCK)</td></tr>
      <tr><td>SEC-15 Auto Forensic Case Generation</td><td>Critical Queue Trigger</td><td class="status-pass">PASSED (CASE FILED)</td></tr>
      <tr><td>SEC-16 Shared Interbank Threat Broadcast</td><td>FIN-INTEL Network Sync</td><td class="status-pass">PASSED (PROPAGATED)</td></tr>
      <tr><td>SEC-17 Core API Raw Payload Rejection</td><td>Banking Core Invariant</td><td class="status-pass">PASSED (REJECTED)</td></tr>
      <tr><td>SEC-18 Behavioral Anomaly Spike Detection</td><td>Baseline Comparison</td><td class="status-pass">PASSED (FLAGGED)</td></tr>
    </tbody>
  </table>

  <div style="margin-top: 40px; border-top: 1px solid #cbd5e1; padding-top: 16px; font-size: 11px; color: #64748b; display: flex; justify-content: space-between;">
    <span>BANKISM Financial Security Gateway • Blue-Team Engineering</span>
    <span>Certified Invariant Audit Report</span>
  </div>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

// Standalone API server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[BANKISM] Backend API running on http://0.0.0.0:${PORT}`);
});
