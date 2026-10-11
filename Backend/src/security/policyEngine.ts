/**
 * DETERMINISTIC POLICY ENGINE
 * Core Security Principle: "AI recommends. Deterministic policy decides."
 * Natural language or AI model NEVER executes a transaction.
 * Evaluates hard deterministic rules to make final binding decision: ALLOW | VERIFY | BLOCK.
 * Simple score averaging can NEVER override mandatory hard-block rules!
 */

import {
  DeterministicPolicyResult,
  PolicyRuleTriggered,
  SecurityDecision,
  BankingIntent,
  ThreatDetectionResult,
  RiskAssessment,
  ReceiverReputationProfile,
  SenderHistoryProfile,
} from '../types';

export class DeterministicPolicyEngine {
  public static evaluate(
    intent: BankingIntent,
    threat: ThreatDetectionResult,
    risk: RiskAssessment,
    receiverRep: ReceiverReputationProfile,
    senderHistory: SenderHistoryProfile
  ): DeterministicPolicyResult {
    const rulesTriggered: PolicyRuleTriggered[] = [];
    let mandatoryBlock = false;
    let requiresVerification = false;

    // RULE 1: UNSUPPORTED ACTION HARD BLOCK
    if (intent.action === 'UNKNOWN') {
      rulesTriggered.push({
        ruleId: 'RULE-POL-01',
        name: 'UNSUPPORTED_INTENT_REJECTION',
        severity: 'CRITICAL',
        action: 'BLOCK',
        reason: 'Requested action does not map to any authorized banking primitives.',
      });
      mandatoryBlock = true;
    }

    // RULE 2: PROMPT INJECTION / JAILBREAK HARD BLOCK
    if (threat.detected && threat.categories.includes('PROMPT_INJECTION') && threat.confidence >= 0.7) {
      rulesTriggered.push({
        ruleId: 'RULE-POL-02',
        name: 'HIGH_CONFIDENCE_INJECTION_BLOCK',
        severity: 'CRITICAL',
        action: 'BLOCK',
        reason: 'Detected adversarial prompt injection targeting system instruction boundary.',
      });
      mandatoryBlock = true;
    }

    // RULE 3: ROLE OVERRIDE HARD BLOCK
    if (threat.detected && threat.categories.includes('ROLE_OVERRIDE')) {
      rulesTriggered.push({
        ruleId: 'RULE-POL-03',
        name: 'ROLE_ELEVATION_IMPERSONATION_BLOCK',
        severity: 'CRITICAL',
        action: 'BLOCK',
        reason: 'Explicit attempt to impersonate administrative or superuser authority.',
      });
      mandatoryBlock = true;
    }

    // RULE 3B: POLICY OVERRIDE HARD BLOCK
    if (threat.detected && threat.categories.includes('POLICY_OVERRIDE')) {
      rulesTriggered.push({
        ruleId: 'RULE-POL-03B',
        name: 'POLICY_OVERRIDE_BYPASS_BLOCK',
        severity: 'CRITICAL',
        action: 'BLOCK',
        reason: 'Detected security policy bypass directive (e.g. bypass 2FA, OTP, or limit evasion).',
      });
      mandatoryBlock = true;
    }

    // RULE 4: DATA EXFILTRATION HARD BLOCK
    if (threat.detected && threat.categories.includes('DATA_EXFILTRATION')) {
      rulesTriggered.push({
        ruleId: 'RULE-POL-04',
        name: 'CREDENTIAL_EXFILTRATION_GUARD',
        severity: 'CRITICAL',
        action: 'BLOCK',
        reason: 'Attempted to elicit internal credentials, database dumps, or system secrets.',
      });
      mandatoryBlock = true;
    }

    // RULE 5: NEGATIVE OR ZERO AMOUNT HARD BLOCK
    if (intent.action === 'TRANSFER' && intent.amount !== null && intent.amount !== undefined && intent.amount <= 0) {
      rulesTriggered.push({
        ruleId: 'RULE-POL-05',
        name: 'INVALID_TRANSACTION_BOUNDARY',
        severity: 'CRITICAL',
        action: 'BLOCK',
        reason: 'Transaction amounts must be strictly positive numerical quantities.',
      });
      mandatoryBlock = true;
    }

    // RULE 6: CONFIRMED FRAUD RECIPIENT HARD BLOCK
    if (receiverRep.confirmedFraudAssociations >= 2 || receiverRep.isKnownMuleAccount) {
      rulesTriggered.push({
        ruleId: 'RULE-POL-06',
        name: 'CONFIRMED_FRAUD_RECIPIENT_QUARANTINE',
        severity: 'CRITICAL',
        action: 'BLOCK',
        reason: `Recipient "${receiverRep.identifier}" is tied to confirmed fraud incidents or known mule networks.`,
      });
      mandatoryBlock = true;
    }

    // RULE 7: CRITICAL COMPOSITE RISK HARD BLOCK (Score >= 90)
    if (risk.score >= 90) {
      rulesTriggered.push({
        ruleId: 'RULE-POL-07',
        name: 'CRITICAL_RISK_THRESHOLD_EXCEEDED',
        severity: 'CRITICAL',
        action: 'BLOCK',
        reason: `Composite risk score (${risk.score}/100) exceeds maximum allowable threshold for automated execution.`,
      });
      mandatoryBlock = true;
    }

    // RULE 8: MISSING AMOUNT IN TRANSFER -> VERIFY (Ambiguity guard)
    if (intent.action === 'TRANSFER' && (intent.amount === null || intent.amount === undefined)) {
      rulesTriggered.push({
        ruleId: 'RULE-POL-08',
        name: 'AMBIGUOUS_AMOUNT_SPECIFICATION',
        severity: 'WARN',
        action: 'VERIFY',
        reason: 'Transfer request omitted numerical amount. Requires explicit customer confirmation before execution.',
      });
      requiresVerification = true;
    }

    // RULE 9: MISSING RECIPIENT IN TRANSFER -> VERIFY
    if (intent.action === 'TRANSFER' && (!intent.recipient || intent.recipient.trim().length === 0)) {
      rulesTriggered.push({
        ruleId: 'RULE-POL-09',
        name: 'AMBIGUOUS_RECIPIENT_SPECIFICATION',
        severity: 'WARN',
        action: 'VERIFY',
        reason: 'Transfer request did not identify a destination recipient or account.',
      });
      requiresVerification = true;
    }

    // RULE 10: ELEVATED RECEIVER RISK (60-89) -> VERIFY
    if (receiverRep.riskScore >= 60 && !mandatoryBlock) {
      rulesTriggered.push({
        ruleId: 'RULE-POL-10',
        name: 'HIGH_RISK_RECIPIENT_STEPUP_VERIFICATION',
        severity: 'WARN',
        action: 'VERIFY',
        reason: `Recipient has elevated risk score (${receiverRep.riskScore}/100). Step-up verification required.`,
      });
      requiresVerification = true;
    }

    // RULE 11: HIGH SENDER RISK HISTORY -> VERIFY
    if (senderHistory.riskLevel === 'HIGH' && !mandatoryBlock) {
      rulesTriggered.push({
        ruleId: 'RULE-POL-11',
        name: 'SENDER_THREAT_HISTORY_STEPUP',
        severity: 'WARN',
        action: 'VERIFY',
        reason: 'Sender profile contains multiple recent security events. Additional verification required.',
      });
      requiresVerification = true;
    }

    // Compute final deterministic decision
    let decision: SecurityDecision = 'ALLOW';
    let decisionReason = 'Valid banking request with no significant security signals.';

    if (mandatoryBlock) {
      decision = 'BLOCK';
      const criticalRule = rulesTriggered.find(r => r.action === 'BLOCK');
      decisionReason = criticalRule ? criticalRule.reason : 'Request rejected by deterministic security policy.';
    } else if (requiresVerification) {
      decision = 'VERIFY';
      const warnRule = rulesTriggered.find(r => r.action === 'VERIFY');
      decisionReason = warnRule ? warnRule.reason : 'Request requires additional verification before execution.';
    }

    return {
      decision,
      approved: decision === 'ALLOW',
      requiresVerification: decision === 'VERIFY',
      rulesTriggered,
      mandatoryBlockApplied: mandatoryBlock,
      decisionReason,
    };
  }
}
