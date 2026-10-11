/**
 * BANKISM HIGH-RISK CASE MANAGEMENT & EVIDENCE ENGINE
 * Manages security cases, evidence packages, analyst review queues,
 * and propagation to shared interbank fraud intelligence networks.
 */

import { FraudCase, CaseStatus, RiskLevel, RiskFactor, ThreatCategory } from '../types';
import { db } from '../db/store';
import { fraudIntelProvider } from './intelligenceProvider';
import { AuditService } from '../audit/auditService';

let caseSeq = 1000;
let noteSeq = 1000;

export class FraudCaseService {
  /**
   * Automatically creates a high-risk security case when risk score >= 90 or critical block is triggered
   */
  public static createCase(
    senderId: string,
    receiverIdentifier: string,
    amount: number | null,
    currency: string,
    riskScore: number,
    threatCategories: ThreatCategory[],
    evidence: {
      originalPrompt: string;
      normalizedPrompt: string;
      detectedSignals: string[];
      riskFactors: RiskFactor[];
      previousSecurityEventsCount: number;
      receiverFraudCount: number;
    }
  ): FraudCase {
    caseSeq += 1;
    noteSeq += 1;
    const caseId = `CASE-${Date.now()}-${caseSeq}`;
    const sender = db.getUser(senderId);

    const fingerprint = `FP-${caseId}-${threatCategories[0] || 'THREAT'}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    let severity: RiskLevel = 'HIGH';
    if (riskScore >= 90) severity = 'CRITICAL';
    else if (riskScore < 60) severity = 'MEDIUM';

    const newCase: FraudCase = {
      caseId,
      title: `High-Risk Incident: ${threatCategories.filter(c => c !== 'NONE').join(', ') || 'Security Policy Block'}`,
      status: 'OPEN',
      severity,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      senderId,
      senderName: sender ? sender.name : senderId,
      receiverIdentifier,
      amount,
      currency,
      riskScore,
      threatCategories,
      evidencePackage: {
        originalPrompt: evidence.originalPrompt,
        normalizedPrompt: evidence.normalizedPrompt,
        detectedSignals: evidence.detectedSignals,
        riskFactors: evidence.riskFactors,
        transactionFingerprint: fingerprint,
        previousSecurityEventsCount: evidence.previousSecurityEventsCount,
        receiverFraudCount: evidence.receiverFraudCount,
      },
      notes: [
        {
          id: `NOTE-${Date.now()}-${noteSeq}`,
          caseId,
          analystId: 'SYSTEM',
          analystName: 'BANKISM Gateway Automated Sentinel',
          note: `High-risk case auto-generated with composite risk score of ${riskScore}/100. Added to Security Review Queue.`,
          timestamp: new Date().toISOString(),
        },
      ],
      reportedToIntelligence: false,
    };

    db.setFraudCase(caseId, newCase);

    AuditService.log(
      'SYSTEM',
      'SECURITY_GATEWAY',
      'SECURITY_CASE_CREATED',
      caseId,
      'WARNING',
      `REQ-${caseId}`,
      { riskScore, receiver: receiverIdentifier, severity }
    );

    return newCase;
  }

  /**
   * Updates case status (OPEN, INVESTIGATING, CONFIRMED_FRAUD, FALSE_POSITIVE, CLOSED, REPORTED)
   */
  public static updateStatus(
    caseId: string,
    newStatus: CaseStatus,
    analystId: string,
    analystName: string,
    noteText?: string
  ): FraudCase | null {
    const existing = db.getFraudCase(caseId);
    if (!existing) return null;

    existing.status = newStatus;
    existing.updatedAt = new Date().toISOString();

    if (noteText) {
      noteSeq += 1;
      existing.notes.push({
        id: `NOTE-${Date.now()}-${noteSeq}`,
        caseId,
        analystId,
        analystName,
        note: `Status updated to [${newStatus}]: ${noteText}`,
        timestamp: new Date().toISOString(),
      });
    }

    // If marked as CONFIRMED_FRAUD, update receiver and sender reputation accordingly
    if (newStatus === 'CONFIRMED_FRAUD') {
      const rep = db.getReceiverReputation(existing.receiverIdentifier);
      if (rep) {
        rep.confirmedFraudCount += 1;
        rep.riskScore = Math.min(100, rep.riskScore + 20);
        db.setReceiverReputation(existing.receiverIdentifier, rep);
      }
    }

    db.setFraudCase(caseId, existing);

    AuditService.log(
      analystId,
      'SECURITY_ANALYST',
      newStatus === 'CONFIRMED_FRAUD' ? 'FRAUD_CONFIRMED' : 'CASE_REVIEWED',
      caseId,
      'SUCCESS',
      `REQ-STATUS-${caseId}`,
      { newStatus }
    );

    return existing;
  }

  /**
   * Adds an analyst investigation note to the case
   */
  public static addNote(
    caseId: string,
    analystId: string,
    analystName: string,
    note: string
  ): FraudCase | null {
    const existing = db.getFraudCase(caseId);
    if (!existing) return null;

    noteSeq += 1;
    existing.notes.push({
      id: `NOTE-${Date.now()}-${noteSeq}`,
      caseId,
      analystId,
      analystName,
      note,
      timestamp: new Date().toISOString(),
    });
    existing.updatedAt = new Date().toISOString();

    db.setFraudCase(caseId, existing);
    return existing;
  }

  /**
   * Reports a confirmed case to the Shared Fraud Intelligence network (FIN-INTEL)
   */
  public static async reportToSharedIntelligence(
    caseId: string,
    analystId: string,
    analystName: string
  ): Promise<{ success: boolean; reportId?: string; message: string }> {
    const existing = db.getFraudCase(caseId);
    if (!existing) {
      return { success: false, message: 'Case not found.' };
    }

    // Submit report through provider interface
    const reportRes = await fraudIntelProvider.submitReport({
      caseId,
      timestamp: new Date().toISOString(),
      reportingBank: 'Apex National Bank (BANKISM Sentinel)',
      senderPseudonym: existing.senderId,
      receiverPseudonym: existing.receiverIdentifier,
      amount: existing.amount,
      riskScore: existing.riskScore,
      threatCategories: existing.threatCategories,
      transactionFingerprint: existing.evidencePackage.transactionFingerprint,
      evidenceSummary: `Analyst-verified incident. Threat: ${existing.threatCategories.join(', ')}. Target: ${existing.receiverIdentifier}.`,
    });

    existing.reportedToIntelligence = true;
    existing.reportId = reportRes.reportId;
    existing.status = 'REPORTED';
    existing.updatedAt = new Date().toISOString();

    noteSeq += 1;
    existing.notes.push({
      id: `NOTE-${Date.now()}-${noteSeq}`,
      caseId,
      analystId,
      analystName,
      note: `Indicator submitted to Shared Interbank Intelligence Network as Report ${reportRes.reportId}. Propagated across member banks.`,
      timestamp: new Date().toISOString(),
    });

    db.setFraudCase(caseId, existing);

    AuditService.log(
      analystId,
      'SECURITY_ANALYST',
      'REPORT_SUBMITTED',
      reportRes.reportId,
      'SUCCESS',
      `REQ-INTEL-${reportRes.reportId}`,
      { caseId, indicator: existing.receiverIdentifier }
    );

    return {
      success: true,
      reportId: reportRes.reportId,
      message: `Indicator for ${existing.receiverIdentifier} successfully shared with interbank intelligence database.`,
    };
  }
}
