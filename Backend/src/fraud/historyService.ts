/**
 * BANKISM THREAT MEMORY & USER SECURITY HISTORY
 * Dynamically tracks user security events without permanent branding.
 * Clearly distinguishes SUSPICIOUS, BLOCKED, and CONFIRMED_FRAUD.
 */

import { SenderHistoryProfile, RiskLevel, SecurityEventSummary } from '../types';
import { db } from '../db/store';

export class FraudHistoryService {
  /**
   * Generates dynamic historical security profile for a sender
   */
  public static getSenderProfile(userId: string): SenderHistoryProfile {
    const userEvents = db.getSecurityEventsForUser(userId);

    const totalEvents = userEvents.length;
    const blockedAttempts = userEvents.filter(e => e.decision === 'BLOCK').length;
    const confirmedFraudEvents = userEvents.filter(
      e => e.eventType === 'CONFIRMED_FRAUD' || (e.decision === 'BLOCK' && e.riskScore >= 95)
    ).length;

    // Calculate dynamic risk level based on recency and severity
    let riskLevel: RiskLevel = 'LOW';
    if (confirmedFraudEvents > 0 || blockedAttempts >= 3) {
      riskLevel = 'HIGH';
    } else if (blockedAttempts > 0 || totalEvents > 1) {
      riskLevel = 'MEDIUM';
    }

    const recentEvents: SecurityEventSummary[] = userEvents.slice(0, 5).map(e => {
      let status: 'SUSPICIOUS' | 'BLOCKED' | 'CONFIRMED_FRAUD' | 'APPROVED' = 'SUSPICIOUS';
      if (e.eventType === 'CONFIRMED_FRAUD') status = 'CONFIRMED_FRAUD';
      else if (e.decision === 'BLOCK') status = 'BLOCKED';
      else if (e.decision === 'ALLOW') status = 'APPROVED';

      return {
        date: new Date(e.timestamp).toLocaleDateString('en-US', { month: 'short', day: '2-digit' }),
        eventType: e.eventType,
        decision: e.decision,
        status,
      };
    });

    const lastEvent = userEvents.length > 0 ? userEvents[0].timestamp : undefined;

    return {
      userId,
      historicalSecurityEvents: totalEvents,
      confirmedFraudEvents,
      blockedAttempts,
      lastSecurityEventDate: lastEvent,
      riskLevel,
      recentEvents,
    };
  }
}
