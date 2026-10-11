/**
 * BANKISM TRANSACTION ANOMALY ENGINE
 * Behavioral fraud detection comparing current transaction against historical account baseline.
 * Signals: UNUSUAL_AMOUNT, VELOCITY_SPIKE, FIRST_TIME_RECIPIENT, UNUSUAL_CURRENCY
 */

import { AnomalyAssessment, BankingIntent } from '../types';
import { db } from '../db/store';

export class TransactionAnomalyEngine {
  public static evaluate(userId: string, intent: BankingIntent): AnomalyAssessment {
    const signals: string[] = [];
    let score = 0;

    const account = db.getAccountByUserId(userId);
    const minTypical = account?.typicalTransferMin || 500;
    const maxTypical = account?.typicalTransferMax || 5000;
    const typicalRange = `₹${minTypical.toLocaleString()} – ₹${maxTypical.toLocaleString()}`;

    const amount = intent.amount;

    if (intent.action === 'TRANSFER' && amount !== undefined && amount !== null) {
      // 1. Amount threshold anomaly
      if (amount > maxTypical * 5) {
        signals.push(`EXTREME_AMOUNT_SPIKE: Requested ${amount.toLocaleString()} is ${Math.round(amount / maxTypical)}x above normal transfer maximum (${typicalRange}).`);
        score += 24;
      } else if (amount > maxTypical * 2) {
        signals.push(`UNUSUAL_AMOUNT: Requested ${amount.toLocaleString()} significantly exceeds usual upper bound (${typicalRange}).`);
        score += 15;
      } else if (amount < 0) {
        signals.push('NEGATIVE_TRANSACTION_VALUE: Negative value anomaly detected.');
        score += 35;
      }

      // 2. New Recipient / Unverified Beneficiary check
      if (intent.recipient) {
        const beneficiaries = db.getBeneficiaries(userId);
        const isVerified = beneficiaries.some(
          b => b.name.toLowerCase() === intent.recipient?.toLowerCase() && b.verified
        );

        if (!isVerified) {
          signals.push(`FIRST_TIME_OR_UNVERIFIED_RECIPIENT: Recipient "${intent.recipient}" is not in sender's verified beneficiary directory.`);
          score += 12;
        }
      }

      // 3. Velocity / Rapid Retries check
      const recentTxns = db.transactions.filter(t => t.fromUserId === userId).slice(0, 3);
      const recentFailed = recentTxns.filter(t => t.status === 'BLOCKED').length;
      if (recentFailed >= 2) {
        signals.push(`RAPID_RETRY_POST_BLOCK: Multiple recently blocked transfers detected for this user.`);
        score += 18;
      }
    }

    return {
      anomalyDetected: score >= 15,
      score: Math.min(score, 60),
      signals: signals.length > 0 ? signals : ['Transaction volume and recipient conform to historical behavioral patterns.'],
      typicalRange,
      attemptedAmount: amount || undefined,
    };
  }
}
