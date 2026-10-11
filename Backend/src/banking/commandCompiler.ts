/**
 * BANKISM Banking Intent Compiler & Authorized Command Generator
 * Treats natural language like untrusted source code.
 * Natural Language → Parser → Structured Intent → Validation → Authorized Banking Command
 */

import { BankingIntent, AuthorizedBankingCommand } from '../types';

export class BankingCommandCompiler {
  /**
   * Compiles validated BankingIntent into a strictly typed AuthorizedBankingCommand.
   * Fails closed if parameters are ambiguous, missing, or malformed.
   */
  public static compile(intent: BankingIntent): {
    success: boolean;
    command: AuthorizedBankingCommand | null;
    error?: string;
  } {
    const authorizedAt = new Date().toISOString();

    switch (intent.action) {
      case 'BALANCE': {
        return {
          success: true,
          command: {
            type: 'BALANCE',
            commandString: 'BALANCE()',
            parameters: {},
            authorizedAt,
          },
        };
      }

      case 'TRANSACTION_HISTORY': {
        const limit = intent.limit && intent.limit > 0 && intent.limit <= 50 ? intent.limit : 5;
        return {
          success: true,
          command: {
            type: 'TRANSACTION_HISTORY',
            commandString: `TRANSACTION_HISTORY(${limit})`,
            parameters: { limit },
            authorizedAt,
          },
        };
      }

      case 'TRANSFER': {
        if (!intent.recipient || intent.recipient.trim().length === 0) {
          return {
            success: false,
            command: null,
            error: 'MISSING_RECIPIENT: Transfer command requires an explicit, verified recipient.',
          };
        }

        if (intent.amount === undefined || intent.amount === null || isNaN(intent.amount)) {
          return {
            success: false,
            command: null,
            error: 'MISSING_AMOUNT: Transfer command requires a numerical transaction amount.',
          };
        }

        if (intent.amount <= 0) {
          return {
            success: false,
            command: null,
            error: 'INVALID_AMOUNT: Transfer amount must be strictly greater than zero.',
          };
        }

        const currency = intent.currency || 'INR';
        const recipient = intent.recipient.trim();
        const recipientId = intent.recipientAccountId || recipient;

        return {
          success: true,
          command: {
            type: 'TRANSFER',
            commandString: `TRANSFER("${recipientId}", ${intent.amount}, "${currency}")`,
            parameters: {
              recipient,
              recipientAccountId: recipientId,
              amount: intent.amount,
              currency,
              memo: intent.memo || undefined,
            },
            authorizedAt,
          },
        };
      }

      case 'PAY_BILL': {
        if (!intent.recipient && !intent.billerId) {
          return {
            success: false,
            command: null,
            error: 'MISSING_BILLER: Bill payment requires a verified utility or service biller.',
          };
        }

        if (!intent.amount || intent.amount <= 0) {
          return {
            success: false,
            command: null,
            error: 'INVALID_AMOUNT: Bill payment amount must be greater than zero.',
          };
        }

        const biller = (intent.billerId || intent.recipient || 'UTILITY_BILLER').trim();

        return {
          success: true,
          command: {
            type: 'PAY_BILL',
            commandString: `PAY_BILL("${biller}", ${intent.amount})`,
            parameters: {
              billerId: biller,
              amount: intent.amount,
            },
            authorizedAt,
          },
        };
      }

      case 'UNKNOWN':
      default: {
        return {
          success: false,
          command: null,
          error: `UNSUPPORTED_ACTION: Action "${intent.action}" is outside the authorized banking command set.`,
        };
      }
    }
  }
}
