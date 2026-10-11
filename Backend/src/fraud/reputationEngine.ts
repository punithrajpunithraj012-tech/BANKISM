/**
 * BANKISM RECEIVER REPUTATION ENGINE
 * Evaluates the counterparty / recipient risk.
 * Protects users from mule accounts, confirmed fraud syndicates, and rapid-drain hubs.
 */

import { ReceiverReputationProfile, RiskLevel } from '../types';
import { db } from '../db/store';

export class ReceiverReputationEngine {
  /**
   * Analyzes recipient identifier (name, account number, or handle)
   */
  public static evaluateReceiver(recipientIdentifier?: string | null): ReceiverReputationProfile {
    if (!recipientIdentifier || recipientIdentifier.trim().length === 0) {
      return {
        identifier: 'UNKNOWN_RECIPIENT',
        riskScore: 30,
        riskLevel: 'MEDIUM',
        previousSuspiciousTransactions: 0,
        confirmedFraudAssociations: 0,
        uniqueSendersInvolved: 0,
        isKnownMuleAccount: false,
      };
    }

    const cleaned = recipientIdentifier.trim();

    // 1. Check known account reputations in database
    const directRep = db.getReceiverReputation(cleaned);

    // 2. Check accounts list for matching holder name or account number
    let account = db.accounts.get(cleaned);
    if (!account) {
      for (const a of db.accounts.values()) {
        if (
          a.holderName.toLowerCase().includes(cleaned.toLowerCase()) ||
          a.accountNumber.toLowerCase() === cleaned.toLowerCase() ||
          cleaned.toLowerCase().includes(a.holderName.toLowerCase().split(' ')[0])
        ) {
          account = a;
          break;
        }
      }
    }

    // 3. Check interbank shared intelligence database
    const sharedReport = account
      ? db.getSharedIntelligenceReport(account.id)
      : db.getSharedIntelligenceReport(cleaned);

    // Calculate aggregated statistics
    let confirmedFrauds = directRep ? directRep.confirmedFraudCount : 0;
    let suspiciousTxns = directRep ? directRep.suspiciousEventCount : 0;
    let uniqueSenders = directRep ? directRep.uniqueSendersCount : 1;
    let isMule = false;
    let flags: string[] = directRep ? [...directRep.flags] : [];

    // Special check for Account X demo node
    if (/account\s*x|shadow\s*holdings|acc-8821/i.test(cleaned)) {
      confirmedFrauds = Math.max(confirmedFrauds, 4);
      suspiciousTxns = Math.max(suspiciousTxns, 9);
      uniqueSenders = Math.max(uniqueSenders, 12);
      isMule = true;
      if (!flags.includes('CONFIRMED_MULE_ACCOUNT')) flags.push('CONFIRMED_MULE_ACCOUNT');
    }

    // Special check for FastEscrow demo node
    if (/fastescrow|acc-5512/i.test(cleaned)) {
      confirmedFrauds = Math.max(confirmedFrauds, 2);
      suspiciousTxns = Math.max(suspiciousTxns, 5);
      uniqueSenders = Math.max(uniqueSenders, 9);
      isMule = true;
      if (!flags.includes('SUSPICIOUS_MULE_PROXY')) flags.push('SUSPICIOUS_MULE_PROXY');
    }

    // Check shared intel
    let sharedFlag = false;
    let sharedSource: string | undefined = undefined;
    if (sharedReport) {
      sharedFlag = true;
      sharedSource = `${sharedReport.reportingBank} (${sharedReport.reportId})`;
      confirmedFrauds = Math.max(confirmedFrauds, 1);
    }

    // Calculate overall receiver risk score (0-100)
    let score = 5; // Baseline low risk for legitimate recipients

    if (confirmedFrauds > 0) {
      score += confirmedFrauds * 20; // +20 per confirmed fraud
    }
    if (suspiciousTxns > 0) {
      score += suspiciousTxns * 3;
    }
    if (uniqueSenders > 8) {
      score += 15; // Mule symptom: many unconnected senders funneling money
    }
    if (sharedFlag) {
      score += 25; // Shared interbank alert
    }
    if (account && account.status === 'FROZEN') {
      score += 30;
    }

    // Clamp score
    const riskScore = Math.min(100, Math.max(5, score));

    let riskLevel: RiskLevel = 'LOW';
    if (riskScore >= 90) riskLevel = 'CRITICAL';
    else if (riskScore >= 60) riskLevel = 'HIGH';
    else if (riskScore >= 30) riskLevel = 'MEDIUM';

    return {
      identifier: cleaned,
      accountNumber: account ? account.accountNumber : undefined,
      bankName: account ? account.bankName : (sharedReport ? 'Flagged Interbank Entity' : undefined),
      riskScore,
      riskLevel,
      previousSuspiciousTransactions: suspiciousTxns,
      confirmedFraudAssociations: confirmedFrauds,
      uniqueSendersInvolved: uniqueSenders,
      lastSuspiciousActivity: directRep?.lastFlaggedAt || sharedReport?.timestamp,
      isKnownMuleAccount: isMule || confirmedFrauds >= 2,
      sharedIntelligenceFlag: sharedFlag,
      sharedIntelligenceSource: sharedSource,
    };
  }
}
