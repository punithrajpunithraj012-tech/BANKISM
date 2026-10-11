/**
 * BANKISM AUDIT SERVICE
 * Centralized audit logging for every security-relevant event
 * Captures timestamp, actor, action, resource, result, and requestId
 */

import { AuditLog } from '../types';
import { db } from '../db/store';

export class AuditService {
  public static log(
    actor: string,
    role: string,
    action: string,
    resource: string,
    result: 'SUCCESS' | 'BLOCKED' | 'WARNING' | 'FAILED',
    requestId: string,
    details?: Record<string, any>
  ): AuditLog {
    const logEntry: AuditLog = {
      id: `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      actor,
      role,
      action,
      resource,
      result,
      requestId,
      details,
    };

    db.addAuditLog(logEntry);
    return logEntry;
  }

  public static getLogs(limit: number = 100): AuditLog[] {
    return db.auditLogs.slice(0, limit);
  }
}
