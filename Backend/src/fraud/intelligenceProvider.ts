/**
 * BANKISM FRAUD INTELLIGENCE PROVIDER
 * Provider abstraction for interbank shared fraud intelligence databases.
 * Simulates Bank A detecting suspicious activity -> Reporting to Shared Intelligence ->
 * Bank B discovering indicator -> Potential victim protected!
 */

import { FraudIntelligenceReport } from '../types';
import { db } from '../db/store';

export interface FraudIntelligenceProvider {
  submitReport(report: Omit<FraudIntelligenceReport, 'reportId' | 'status'>): Promise<{
    success: boolean;
    reportId: string;
    indicator: string;
    propagatedAt: string;
  }>;

  checkIndicator(indicator: string): Promise<{
    found: boolean;
    report?: FraudIntelligenceReport;
  }>;

  getReportStatus(reportId: string): Promise<{
    status: string;
    confirmations: number;
  }>;
}

let reportSeq = 1000;

export class MockFraudIntelligenceProvider implements FraudIntelligenceProvider {
  public async submitReport(
    report: Omit<FraudIntelligenceReport, 'reportId' | 'status'>
  ): Promise<{
    success: boolean;
    reportId: string;
    indicator: string;
    propagatedAt: string;
  }> {
    reportSeq += 1;
    const reportId = `INTEL-REG-${Date.now()}-${reportSeq}`;
    const fullReport: FraudIntelligenceReport = {
      ...report,
      reportId,
      status: 'PROPAGATED',
    };

    // Index by receiver pseudonym and by caseId
    db.addSharedIntelligenceReport(report.receiverPseudonym, fullReport);

    // Also update any matching account reputation
    const existingRep = db.getReceiverReputation(report.receiverPseudonym);
    if (existingRep) {
      existingRep.confirmedFraudCount += 1;
      existingRep.riskScore = Math.min(100, existingRep.riskScore + 25);
      if (!existingRep.flags.includes('SHARED_INTEL_FLAGGED')) {
        existingRep.flags.push('SHARED_INTEL_FLAGGED');
      }
      db.setReceiverReputation(report.receiverPseudonym, existingRep);
    }

    return {
      success: true,
      reportId,
      indicator: report.receiverPseudonym,
      propagatedAt: new Date().toISOString(),
    };
  }

  public async checkIndicator(indicator: string): Promise<{
    found: boolean;
    report?: FraudIntelligenceReport;
  }> {
    const report = db.getSharedIntelligenceReport(indicator);
    return {
      found: !!report,
      report,
    };
  }

  public async getReportStatus(reportId: string): Promise<{
    status: string;
    confirmations: number;
  }> {
    for (const report of db.sharedIntelligence.values()) {
      if (report.reportId === reportId) {
        return {
          status: report.status,
          confirmations: 4, // 4 participating member banks confirmed
        };
      }
    }

    return {
      status: 'NOT_FOUND',
      confirmations: 0,
    };
  }
}

export const fraudIntelProvider = new MockFraudIntelligenceProvider();
