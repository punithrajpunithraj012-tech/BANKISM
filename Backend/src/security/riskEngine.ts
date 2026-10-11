/**
 * BANKISM RISK SCORING ENGINE
 * Synthesizes multi-dimensional risk signals into an explainable 0–100 score.
 * Combines:
 * - Current prompt threat risk
 * - Sender historical risk
 * - Receiver reputation risk
 * - Transaction anomaly risk
 * - Account security signals
 * Always provides clear itemized explanations for security analysts.
 */

import {
  RiskAssessment,
  RiskFactor,
  RiskLevel,
  ThreatDetectionResult,
  SenderHistoryProfile,
  ReceiverReputationProfile,
  AnomalyAssessment,
  NormalizationReport,
} from '../types';

export class RiskEngine {
  public static calculateRisk(
    threat: ThreatDetectionResult,
    senderHistory: SenderHistoryProfile,
    receiverRep: ReceiverReputationProfile,
    anomaly: AnomalyAssessment,
    normalization: NormalizationReport
  ): RiskAssessment {
    const factors: RiskFactor[] = [];
    let score = 0;

    // 1. Current Prompt Threat Risk (Brain 2)
    if (threat.detected) {
      if (threat.categories.includes('PROMPT_INJECTION')) {
        const pts = 35;
        score += pts;
        factors.push({
          factor: 'Prompt Injection Pattern',
          points: pts,
          category: 'PROMPT_THREAT',
          description: 'Attempted to hijack LLM instruction boundary or override system directives.',
        });
      }

      if (threat.categories.includes('ROLE_OVERRIDE')) {
        const pts = 30;
        score += pts;
        factors.push({
          factor: 'Privileged Role Impersonation',
          points: pts,
          category: 'PROMPT_THREAT',
          description: 'User impersonated administrator, root, or bank officer authority.',
        });
      }

      if (threat.categories.includes('POLICY_OVERRIDE')) {
        const pts = 25;
        score += pts;
        factors.push({
          factor: 'Policy Bypass Command',
          points: pts,
          category: 'PROMPT_THREAT',
          description: 'Explicit directive instructing system to bypass 2FA, limits, or security checks.',
        });
      }

      if (threat.categories.includes('DATA_EXFILTRATION')) {
        const pts = 35;
        score += pts;
        factors.push({
          factor: 'Data Exfiltration Signal',
          points: pts,
          category: 'PROMPT_THREAT',
          description: 'Attempt to elicit system prompts, credentials, API keys, or multi-tenant database records.',
        });
      }

      if (threat.categories.includes('TRANSACTION_MANIPULATION')) {
        const pts = 20;
        score += pts;
        factors.push({
          factor: 'Transaction Manipulation',
          points: pts,
          category: 'PROMPT_THREAT',
          description: 'Targeted account drain or boundary manipulation attempt.',
        });
      }
    }

    // 2. Input Obfuscation Signals
    if (normalization.hasUnicodeTampering || normalization.hasControlCharacters || normalization.hasObfuscation) {
      const pts = 12;
      score += pts;
      factors.push({
        factor: 'Payload Obfuscation & Evasion',
        points: pts,
        category: 'PROMPT_THREAT',
        description: 'Input contained homoglyphs, zero-width characters, base64, or separator padding.',
      });
    }

    // 3. Sender Historical Risk (Threat Memory)
    if (senderHistory.confirmedFraudEvents > 0) {
      const pts = Math.min(30, senderHistory.confirmedFraudEvents * 15);
      score += pts;
      factors.push({
        factor: 'Historical Confirmed Fraud Association',
        points: pts,
        category: 'SENDER_HISTORY',
        description: `Sender account has ${senderHistory.confirmedFraudEvents} previously confirmed fraud incident(s).`,
      });
    }

    if (senderHistory.blockedAttempts > 0) {
      const pts = Math.min(20, senderHistory.blockedAttempts * 7);
      score += pts;
      factors.push({
        factor: 'Previous Blocked Security Events',
        points: pts,
        category: 'SENDER_HISTORY',
        description: `Sender account triggered ${senderHistory.blockedAttempts} blocked transaction attempt(s).`,
      });
    }

    // 4. Receiver Reputation Risk
    if (receiverRep.confirmedFraudAssociations > 0) {
      const pts = Math.min(35, receiverRep.confirmedFraudAssociations * 18);
      score += pts;
      factors.push({
        factor: 'High-Risk / Confirmed Fraud Recipient',
        points: pts,
        category: 'RECEIVER_REPUTATION',
        description: `Recipient identifier has ${receiverRep.confirmedFraudAssociations} confirmed fraud tie(s).`,
      });
    }

    if (receiverRep.sharedIntelligenceFlag) {
      const pts = 25;
      score += pts;
      factors.push({
        factor: 'Interbank Shared Intelligence Flag',
        points: pts,
        category: 'RECEIVER_REPUTATION',
        description: `Recipient is flagged in shared fraud registry: ${receiverRep.sharedIntelligenceSource || 'Interbank DB'}.`,
      });
    }

    if (receiverRep.isKnownMuleAccount && !receiverRep.sharedIntelligenceFlag && receiverRep.confirmedFraudAssociations === 0) {
      const pts = 20;
      score += pts;
      factors.push({
        factor: 'Mule Account Behavioral Profile',
        points: pts,
        category: 'RECEIVER_REPUTATION',
        description: 'Recipient exhibits high multi-sender aggregation patterns typical of money mule syndicates.',
      });
    }

    // 5. Transaction Anomaly Risk
    if (anomaly.anomalyDetected) {
      const pts = Math.min(25, anomaly.score);
      score += pts;
      factors.push({
        factor: 'Behavioral Transaction Anomaly',
        points: pts,
        category: 'TRANSACTION_ANOMALY',
        description: anomaly.signals[0] || 'Amount or velocity significantly deviates from account baseline.',
      });
    }

    // If perfectly clean, grant small baseline
    if (score === 0) {
      score = 5;
      factors.push({
        factor: 'Clean Baseline Profile',
        points: 5,
        category: 'ACCOUNT_SIGNAL',
        description: 'Standard baseline risk for domestic digital banking interaction.',
      });
    }

    const finalScore = Math.min(100, Math.max(1, score));

    let level: RiskLevel = 'LOW';
    if (finalScore >= 90) level = 'CRITICAL';
    else if (finalScore >= 60) level = 'HIGH';
    else if (finalScore >= 30) level = 'MEDIUM';

    const factorSummary = factors
      .filter(f => f.points > 5)
      .map(f => `${f.factor}: +${f.points}`)
      .join(', ');

    return {
      score: finalScore,
      level,
      factors,
      summary: `Score: ${finalScore}/100 (${level})${factorSummary ? ` | ${factorSummary}` : ''}`,
    };
  }
}
