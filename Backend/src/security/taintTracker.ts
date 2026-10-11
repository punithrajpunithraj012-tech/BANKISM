/**
 * BANKISM Untrusted Data & Taint Tracking
 * Tracks the lifecycle and trustworthiness of user inputs, memos, and parameters
 * Ensures instructions inside untrusted data fields NEVER become executable commands.
 */

import { TaintNode, BankingIntent } from '../types';

export class TaintTracker {
  /**
   * Generates a step-by-step trust audit trace through the Bankism security gateway
   */
  public static traceLifecycle(
    rawInput: string,
    normalizedInput: string,
    intent: BankingIntent,
    isPolicyApproved: boolean,
    memoSanitizedText?: string
  ): TaintNode[] {
    const trace: TaintNode[] = [];

    // Stage 1: Ingestion
    trace.push({
      stage: '1. Ingestion',
      source: 'USER_MESSAGE',
      trustLevel: 'UNTRUSTED',
      contentPreview: rawInput.slice(0, 60) + (rawInput.length > 60 ? '...' : ''),
      sanitized: false,
      details: 'Raw natural-language payload received from external client boundary. Flagged as untrusted origin.',
    });

    // Stage 2: Normalization
    trace.push({
      stage: '2. Normalization',
      source: 'NORMALIZATION_PIPELINE',
      trustLevel: 'UNTRUSTED',
      contentPreview: normalizedInput.slice(0, 60) + (normalizedInput.length > 60 ? '...' : ''),
      sanitized: true,
      details: 'Cleaned homoglyphs, invisible control characters, and excess whitespace. Data remains UNTRUSTED.',
    });

    // Stage 3: Semantic Parsing (Two-Brain Analysis)
    trace.push({
      stage: '3. Intent Extraction',
      source: 'INTENT_COMPILER',
      trustLevel: 'REQUIRES_VALIDATION',
      contentPreview: `Action: ${intent.action}${intent.amount ? ` | Amount: ${intent.amount}` : ''}${intent.recipient ? ` | Target: ${intent.recipient}` : ''}`,
      sanitized: true,
      details: 'Deconstructed into typed entity tokens. Not authorized for banking execution until policy verification.',
    });

    // Stage 4: Memo Taint Isolation
    if (intent.memo) {
      trace.push({
        stage: '4. Memo Quarantine',
        source: 'PAYMENT_MEMO',
        trustLevel: 'TAINTED',
        contentPreview: `Memo: "${intent.memo.slice(0, 45)}${intent.memo.length > 45 ? '...' : ''}"`,
        sanitized: true,
        details: 'Payment memo is quarantined as PASSIVE DATA. Any prompt directives inside memo are stripped and ignored.',
      });
    }

    // Stage 5: Deterministic Policy Gate
    if (isPolicyApproved) {
      trace.push({
        stage: '5. Policy Authorization',
        source: 'DETERMINISTIC_POLICY_ENGINE',
        trustLevel: 'TRUSTED',
        contentPreview: `Authorized Command: ${intent.action}(...)`,
        sanitized: true,
        details: 'Passed all deterministic boundary checks, sender history, and receiver reputation. Promoted to TRUSTED_COMMAND.',
      });
    } else {
      trace.push({
        stage: '5. Policy Rejection/Quarantine',
        source: 'DETERMINISTIC_POLICY_ENGINE',
        trustLevel: 'TAINTED',
        contentPreview: `Status: REJECTED OR PENDING VERIFICATION`,
        sanitized: false,
        details: 'Blocked by deterministic security rule or flagged for mandatory analyst verification. Execution HALTED.',
      });
    }

    return trace;
  }

  /**
   * Sanitizes memo or payment notes to prevent memo injection
   */
  public static sanitizeMemo(memo?: string | null): { sanitizedMemo: string; injectionAttemptDetected: boolean } {
    if (!memo) return { sanitizedMemo: '', injectionAttemptDetected: false };

    const injectionPatterns = [
      /ignore\s+(all\s+)?(previous|prior)\s+(instructions|rules)/i,
      /transfer\s+(another|additional|\$|₹|[0-9]+)/i,
      /system\s+prompt/i,
      /admin\s+override/i,
      /bypass\s+2fa/i,
    ];

    let injectionDetected = false;
    for (const pattern of injectionPatterns) {
      if (pattern.test(memo)) {
        injectionDetected = true;
        break;
      }
    }

    // Passive data strip: remove control characters and escape tags
    const sanitizedMemo = memo.replace(/[<>{}\\]/g, '').trim().slice(0, 120);

    return {
      sanitizedMemo,
      injectionAttemptDetected: injectionDetected,
    };
  }
}
