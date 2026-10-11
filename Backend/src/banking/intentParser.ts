/**
 * BRAIN 1 — BANKING INTENT PARSER
 * Its ONLY job is determining what banking operation the user wants.
 * Supported intents:
 * - BALANCE
 * - TRANSFER
 * - TRANSACTION_HISTORY
 * - PAY_BILL
 * - UNKNOWN
 * Brain 1 must NOT make the final security decision.
 */

import { GoogleGenAI } from '@google/genai';
import { BankingIntent } from '../types';

export class BankingIntentParser {
  /**
   * Deterministic entity and intent extractor
   */
  public static parseDeterministic(text: string): BankingIntent {
    const lower = text.toLowerCase();

    // 1. Check for BALANCE
    if (
      /\b(what is my balance|check balance|show balance|my balance|account balance|how much money do i have|view balance)\b/i.test(
        lower
      )
    ) {
      return {
        action: 'BALANCE',
      };
    }

    // 2. Check for TRANSACTION_HISTORY
    const historyMatch = lower.match(
      /\b(transaction history|last|recent|past)\s+(\d+)?\s*(transactions|txns|transfers|activity)?/i
    );
    if (historyMatch || /\b(show transactions|list transactions|history|statement)\b/i.test(lower)) {
      let limit = 5;
      const numMatch = lower.match(/\b(\d+)\s*(transactions|txns|transfers)?\b/);
      if (numMatch) {
        limit = parseInt(numMatch[1], 10);
      }
      return {
        action: 'TRANSACTION_HISTORY',
        limit: Math.min(limit, 20),
      };
    }

    // 3. Check for PAY_BILL
    if (/\b(pay bill|bill payment|pay electric|pay utility|pay water|pay gas)\b/i.test(lower)) {
      const amountMatch = text.match(/(?:₹|\$|eur|inr|rs\.?|rupees)?\s*([\d,]+(?:\.\d+)?)/i);
      const amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : null;

      let biller = 'Utility Provider';
      if (/power|electric|tata/i.test(lower)) biller = 'Tata Power Electricity Board';
      else if (/water/i.test(lower)) biller = 'Municipal Water Board';
      else if (/gas/i.test(lower)) biller = 'Indane Gas';

      return {
        action: 'PAY_BILL',
        amount,
        billerId: biller,
        currency: 'INR',
      };
    }

    // 4. Check for TRANSFER
    if (
      /\b(transfer|send|wire|pay|remit|move|give|dispatch)\b/i.test(lower)
    ) {
      // Extract Amount
      let amount: number | null = null;
      let currency = 'INR';

      // Look for currency symbol or keyword
      const currencyMatch = text.match(/(₹|rs\.?|inr|\$|usd|eur|€)/i);
      if (currencyMatch) {
        const symbol = currencyMatch[1].toLowerCase();
        if (symbol === '$' || symbol === 'usd') currency = 'USD';
        else if (symbol === '€' || symbol === 'eur') currency = 'EUR';
        else currency = 'INR';
      }

      // Match amount numbers like ₹500, -500, 50,000, 20000
      const amountRegex = /(?:₹|\$|€|rs\.?|inr)?\s*(-?\d{1,3}(?:,\d{3})*(?:\.\d+)?|-?\d+)(?:\s*(?:rs|rupees|inr|usd|dollars))?/i;
      const amountFound = text.match(amountRegex);
      if (amountFound && amountFound[1]) {
        const parsed = parseFloat(amountFound[1].replace(/,/g, ''));
        if (!isNaN(parsed)) {
          amount = parsed;
        }
      }

      // Extract Recipient
      let recipient: string | null = null;
      const toRegex = /\b(?:to|for|beneficiary|account)\s+([A-Za-z0-9\s_-]+?)(?:\s+(?:memo|for|with|reference|note|₹|\$|\d)|$|[.,!?])/i;
      const recipientMatch = text.match(toRegex);
      if (recipientMatch && recipientMatch[1]) {
        const cleaned = recipientMatch[1].trim();
        // Discard filler words
        if (!['my', 'the', 'some', 'any', 'him', 'her'].includes(cleaned.toLowerCase())) {
          recipient = cleaned;
        }
      }

      // Extract Memo / note if present
      let memo: string | null = null;
      const memoMatch = text.match(/\b(?:memo|reference|for|note):\s*([^.\n]+)/i);
      if (memoMatch && memoMatch[1]) {
        memo = memoMatch[1].trim();
      }

      return {
        action: 'TRANSFER',
        recipient,
        amount,
        currency,
        memo,
      };
    }

    return {
      action: 'UNKNOWN',
    };
  }

  /**
   * Parses natural language using Gemini if available, falling back cleanly to deterministic parser
   */
  public static async parse(text: string, apiKey?: string): Promise<{ intent: BankingIntent; provider: string }> {
    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const prompt = `You are Brain 1 of the BANKISM banking security architecture.
Your ONLY role is determining the user's intended banking action.
Extract into strict JSON without commentary:
{
  "action": "BALANCE" | "TRANSFER" | "TRANSACTION_HISTORY" | "PAY_BILL" | "UNKNOWN",
  "recipient": string or null,
  "amount": number or null,
  "currency": "INR" | "USD" | "EUR",
  "limit": number or null,
  "memo": string or null
}
Never make security decisions. Only extract banking semantics.
User message: "${text}"`;

        const timeout = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('AI_TIMEOUT')), 3500)
        );

        const response: any = await Promise.race([
          ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: prompt,
          }),
          timeout,
        ]);

        const raw = response.text || '';
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return {
            intent: {
              action: parsed.action || 'UNKNOWN',
              recipient: parsed.recipient || null,
              amount: typeof parsed.amount === 'number' ? parsed.amount : null,
              currency: parsed.currency || 'INR',
              limit: parsed.limit || 5,
              memo: parsed.memo || null,
            },
            provider: 'GEMINI_3.8_FLASH',
          };
        }
      } catch (err) {
        // Fall back gracefully to deterministic parser
      }
    }

    return {
      intent: this.parseDeterministic(text),
      provider: 'DETERMINISTIC_PARSER',
    };
  }
}
