/**
 * BANKISM Simulated Banking API (Core Financial Ledger)
 * The simulated banking API should ONLY accept validated structured commands.
 * It must NEVER accept raw natural-language prompts.
 */

import { AuthorizedBankingCommand, TransactionRecord } from '../types';
import { db } from '../db/store';

export interface ExecutionResult {
  success: boolean;
  message: string;
  transaction?: TransactionRecord;
  data?: any;
  error?: string;
}

let txnSeq = 1000;
let audSeq = 1000;

export class BankingLedgerService {
  /**
   * Executes an authorized banking command against the banking core
   */
  public static executeCommand(
    userId: string,
    command: AuthorizedBankingCommand,
    memo?: string
  ): ExecutionResult {
    // 1. Authenticate sender account
    const senderAccount = db.getAccountByUserId(userId);
    if (!senderAccount) {
      return {
        success: false,
        message: 'Sender account not found in banking ledger.',
        error: 'ACCOUNT_NOT_FOUND',
      };
    }

    if (senderAccount.status === 'FROZEN') {
      return {
        success: false,
        message: 'Transaction rejected: Sender account is administratively frozen.',
        error: 'ACCOUNT_FROZEN',
      };
    }

    switch (command.type) {
      case 'BALANCE': {
        return {
          success: true,
          message: `Current balance for account ${senderAccount.accountNumber} is ${senderAccount.currency} ${senderAccount.balance.toLocaleString()}.`,
          data: {
            accountNumber: senderAccount.accountNumber,
            balance: senderAccount.balance,
            currency: senderAccount.currency,
            status: senderAccount.status,
          },
        };
      }

      case 'TRANSACTION_HISTORY': {
        const limit = command.parameters.limit || 5;
        const txns = db.transactions
          .filter(t => t.fromAccountId === senderAccount.id || t.toAccountId === senderAccount.id)
          .slice(0, limit);

        return {
          success: true,
          message: `Retrieved latest ${txns.length} transactions.`,
          data: {
            count: txns.length,
            transactions: txns,
          },
        };
      }

      case 'TRANSFER': {
        const amount = command.parameters.amount;
        const recipientName = command.parameters.recipient;
        const currency = command.parameters.currency || 'INR';

        if (senderAccount.balance < amount) {
          return {
            success: false,
            message: `Insufficient funds. Current balance is ${senderAccount.currency} ${senderAccount.balance.toLocaleString()}, requested ${currency} ${amount.toLocaleString()}.`,
            error: 'INSUFFICIENT_FUNDS',
          };
        }

        // Check if recipient is a known internal account
        let recipientAccount = db.accounts.get(command.parameters.recipientAccountId);
        if (!recipientAccount) {
          // Look up by holder name or beneficiary
          for (const acc of db.accounts.values()) {
            if (acc.holderName.toLowerCase().includes(recipientName.toLowerCase())) {
              recipientAccount = acc;
              break;
            }
          }
        }

        // Deduct from sender
        senderAccount.balance -= amount;

        // Credit recipient if internal
        if (recipientAccount) {
          recipientAccount.balance += amount;
        }

        txnSeq += 1;
        audSeq += 1;
        const txnRecord: TransactionRecord = {
          id: `TXN-${Date.now()}-${txnSeq}`,
          fromAccountId: senderAccount.id,
          toAccountId: recipientAccount ? recipientAccount.id : undefined,
          fromUserId: userId,
          toRecipientName: recipientName,
          amount,
          currency,
          status: 'COMPLETED',
          commandType: command.commandString,
          riskScore: 5,
          threatCategories: ['NONE'],
          memo: memo || command.parameters.memo || 'Direct transfer',
          createdAt: new Date().toISOString(),
        };

        db.addTransaction(txnRecord);

        db.addAuditLog({
          id: `AUD-${Date.now()}-${audSeq}`,
          timestamp: new Date().toISOString(),
          actor: userId,
          role: 'CUSTOMER',
          action: 'TRANSACTION_EXECUTED',
          resource: txnRecord.id,
          result: 'SUCCESS',
          requestId: `REQ-EXEC-${Date.now()}-${audSeq}`,
          details: {
            amount,
            recipient: recipientName,
            newBalance: senderAccount.balance,
          },
        });

        return {
          success: true,
          message: `Successfully transferred ${currency} ${amount.toLocaleString()} to ${recipientName}. New balance: ${senderAccount.currency} ${senderAccount.balance.toLocaleString()}.`,
          transaction: txnRecord,
          data: {
            transactionId: txnRecord.id,
            remainingBalance: senderAccount.balance,
            currency: senderAccount.currency,
          },
        };
      }

      case 'PAY_BILL': {
        const amount = command.parameters.amount;
        const billerId = command.parameters.billerId;

        if (senderAccount.balance < amount) {
          return {
            success: false,
            message: `Insufficient funds to pay bill. Balance: ${senderAccount.balance}, Bill: ${amount}`,
            error: 'INSUFFICIENT_FUNDS',
          };
        }

        senderAccount.balance -= amount;

        txnSeq += 1;
        const txnRecord: TransactionRecord = {
          id: `TXN-BILL-${Date.now()}-${txnSeq}`,
          fromAccountId: senderAccount.id,
          fromUserId: userId,
          toRecipientName: billerId,
          amount,
          currency: senderAccount.currency,
          status: 'COMPLETED',
          commandType: command.commandString,
          riskScore: 2,
          threatCategories: ['NONE'],
          memo: `Utility Bill Payment: ${billerId}`,
          createdAt: new Date().toISOString(),
        };

        db.addTransaction(txnRecord);

        return {
          success: true,
          message: `Bill of ${senderAccount.currency} ${amount.toLocaleString()} paid to ${billerId}. Remaining balance: ${senderAccount.currency} ${senderAccount.balance.toLocaleString()}.`,
          transaction: txnRecord,
        };
      }

      default:
        return {
          success: false,
          message: 'Unsupported command execution.',
          error: 'UNSUPPORTED_COMMAND',
        };
    }
  }
}
