/**
 * BANKISM SECURITY GATEWAY
 * The master orchestration pipeline between User and Banking Core.
 *
 * Pipeline Flow:
 * USER INPUT
 *  ↓ 1. Normalization
 *  ↓ 2. Threat Scan (Brain 2)
 *  ↓ 3. Intent Parse (Brain 1)
 *  ↓ 4. History Check (Threat Memory)
 *  ↓ 5. Receiver Check (Reputation Engine)
 *  ↓ 6. Transaction Anomaly Engine
 *  ↓ 7. Risk Engine (Explainable Synthesis)
 *  ↓ 8. Deterministic Policy Engine (ALLOW / VERIFY / BLOCK)
 *  ↓ 9. Intent Compilation (Authorized Command) & Taint Tracing
 */

import {
  SecurityAnalysisResponse,
  BankingIntent,
  AuthorizedBankingCommand,
} from '../types';
import { InputNormalizer } from './normalizer';
import { ThreatDetector } from './threatDetector';
import { BankingIntentParser } from '../banking/intentParser';
import { FraudHistoryService } from '../fraud/historyService';
import { ReceiverReputationEngine } from '../fraud/reputationEngine';
import { TransactionAnomalyEngine } from '../fraud/anomalyEngine';
import { RiskEngine } from './riskEngine';
import { DeterministicPolicyEngine } from './policyEngine';
import { BankingCommandCompiler } from '../banking/commandCompiler';
import { TaintTracker } from './taintTracker';
import { FraudCaseService } from '../fraud/caseService';
import { AuditService } from '../audit/auditService';
import { db } from '../db/store';

let eventSequenceCounter = 1000;

export class BankismSecurityGateway {
  /**
   * Evaluates any natural-language banking request through the full defensive gateway
   */
  public static async analyze(
    userId: string,
    rawPrompt: string,
    apiKey?: string
  ): Promise<SecurityAnalysisResponse> {
    const requestId = `REQ-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const timestamp = new Date().toISOString();

    AuditService.log(
      userId,
      'CUSTOMER',
      'REQUEST_RECEIVED',
      'BANKISM_GATEWAY',
      'SUCCESS',
      requestId,
      { promptLength: rawPrompt.length }
    );

    // STEP 1: Input Normalization
    const normalization = InputNormalizer.normalize(rawPrompt);

    if (normalization.anomaliesDetected.length > 0) {
      AuditService.log(
        userId,
        'SYSTEM',
        'REQUEST_NORMALIZED',
        'NORMALIZER',
        'WARNING',
        requestId,
        { anomalies: normalization.anomaliesDetected }
      );
    }

    // STEP 2 & 3: Run Brain 1 (Intent Parser) and Brain 2 (Security Critic) in parallel
    const [threatEval, intentEval] = await Promise.all([
      ThreatDetector.analyze(rawPrompt, normalization.normalizedInput, apiKey),
      BankingIntentParser.parse(normalization.normalizedInput, apiKey),
    ]);

    const { result: threatResult, provider: threatProvider } = threatEval;
    const { intent: parsedIntent, provider: intentProvider } = intentEval;

    // STEP 4: Sender Historical Risk (Threat Memory)
    const senderHistory = FraudHistoryService.getSenderProfile(userId);

    // STEP 5: Receiver Reputation Check
    const receiverRep = ReceiverReputationEngine.evaluateReceiver(parsedIntent.recipient);

    // STEP 6: Transaction Anomaly Engine
    const anomaly = TransactionAnomalyEngine.evaluate(userId, parsedIntent);

    // STEP 7: Risk Scoring Engine (Explainable Synthesis)
    const risk = RiskEngine.calculateRisk(
      threatResult,
      senderHistory,
      receiverRep,
      anomaly,
      normalization
    );

    // STEP 8: Deterministic Policy Engine (ALLOW / VERIFY / BLOCK)
    const policy = DeterministicPolicyEngine.evaluate(
      parsedIntent,
      threatResult,
      risk,
      receiverRep,
      senderHistory
    );

    // STEP 9: Command Compilation (Only if ALLOW)
    let authorizedCommand: AuthorizedBankingCommand | null = null;
    if (policy.approved) {
      const compileResult = BankingCommandCompiler.compile(parsedIntent);
      if (compileResult.success && compileResult.command) {
        authorizedCommand = compileResult.command;
      } else {
        // If compilation fails, override policy to BLOCK
        policy.approved = false;
        policy.decision = 'BLOCK';
        policy.decisionReason = compileResult.error || 'Failed to compile authorized command.';
      }
    }

    // STEP 10: Taint Tracking & Trust Audit Flow
    const taintTrace = TaintTracker.traceLifecycle(
      rawPrompt,
      normalization.normalizedInput,
      parsedIntent,
      policy.approved,
      parsedIntent.memo || undefined
    );

    // STEP 11: Record Security Event in Threat Memory (if blocked, suspicious, or high risk)
    const senderAccount = db.getAccountByUserId(userId);
    const accountId = senderAccount ? senderAccount.id : `ACC-${userId}`;

    if (!policy.approved || risk.score >= 30) {
      eventSequenceCounter += 1;
      const securityEvent = {
        eventId: `EVT-${Date.now()}-${eventSequenceCounter}`,
        userId,
        accountId,
        timestamp,
        eventType: threatResult.detected
          ? threatResult.categories[0]
          : policy.decision === 'BLOCK'
          ? 'POLICY_BLOCKED'
          : 'SUSPICIOUS_TRANSFER',
        riskScore: risk.score,
        decision: policy.decision,
        threatCategories: threatResult.categories,
        reason: policy.decisionReason,
        evidenceSummary: `Input: "${rawPrompt.slice(0, 100)}". Risk: ${risk.score}/100. Signals: ${threatResult.signals.slice(0, 2).join('; ')}`,
        originalInput: rawPrompt,
        normalizedInput: normalization.normalizedInput,
      };

      db.addSecurityEvent(securityEvent);
    }

    // STEP 12: High-Risk Case Creation (when risk >= 90 or Critical Policy Block)
    let securityCaseCreated = false;
    let createdCaseId: string | undefined = undefined;

    if (risk.score >= 90 || (policy.decision === 'BLOCK' && threatResult.detected)) {
      const newCase = FraudCaseService.createCase(
        userId,
        parsedIntent.recipient || 'UNKNOWN_OR_SUSPICIOUS',
        parsedIntent.amount || null,
        parsedIntent.currency || 'INR',
        risk.score,
        threatResult.categories,
        {
          originalPrompt: rawPrompt,
          normalizedPrompt: normalization.normalizedInput,
          detectedSignals: threatResult.signals,
          riskFactors: risk.factors,
          previousSecurityEventsCount: senderHistory.historicalSecurityEvents,
          receiverFraudCount: receiverRep.confirmedFraudAssociations,
        }
      );

      securityCaseCreated = true;
      createdCaseId = newCase.caseId;
    }

    // Audit Log for final policy evaluation
    AuditService.log(
      userId,
      'SECURITY_POLICY_ENGINE',
      policy.decision === 'ALLOW' ? 'TRANSACTION_APPROVED' : policy.decision === 'BLOCK' ? 'POLICY_BLOCKED' : 'VERIFICATION_REQUIRED',
      'BANKISM_FIREWALL',
      policy.decision === 'ALLOW' ? 'SUCCESS' : policy.decision === 'BLOCK' ? 'BLOCKED' : 'WARNING',
      requestId,
      {
        decision: policy.decision,
        riskScore: risk.score,
        threats: threatResult.categories,
        caseCreated: securityCaseCreated,
      }
    );

    return {
      requestId,
      timestamp,
      approved: policy.approved,
      decision: policy.decision,
      risk,
      threat: threatResult,
      intent: parsedIntent,
      normalization,
      taintTrace,
      senderHistory,
      receiverReputation: receiverRep,
      anomaly,
      policy,
      authorizedCommand,
      securityCaseCreated,
      createdCaseId,
      reason: policy.decisionReason,
      aiProviderUsed: `${intentProvider} (Brain 1) / ${threatProvider} (Brain 2)`,
    };
  }
}
