/**
 * BANKISM Input Normalization Module
 * Detects & normalizes security-relevant variations:
 * - unusual Unicode / homoglyphs
 * - zero-width spaces & control characters
 * - excessive whitespace & irregular separators
 * - strange delimiters & repeated characters
 * - case variations & base64/hex encoding
 * CRITICAL: Keeps both originalInput and normalizedInput. Never destroys original evidence!
 */

import { NormalizationReport } from '../types';

export class InputNormalizer {
  // Common Cyrillic and Greek homoglyphs used in evasion attacks
  private static homoglyphMap: Record<string, string> = {
    'а': 'a', 'а́': 'a', 'a': 'a', 'A': 'a',
    'е': 'e', 'е́': 'e', 'e': 'e', 'E': 'e',
    'о': 'o', 'о́': 'o', 'o': 'o', 'O': 'o',
    'р': 'p', 'с': 'c', 'у': 'y', 'х': 'x',
    'і': 'i', 'ї': 'i', 'ј': 'j', 'ѕ': 's',
    'В': 'b', 'С': 'c', 'Е': 'e', 'Н': 'h',
    'І': 'i', 'Ј': 'j', 'К': 'k', 'М': 'm',
    'О': 'o', 'Р': 'p', 'Т': 't', 'Х': 'x',
    '0': '0', '1': '1', '3': 'e', '@': 'a',
    '$': 's',
  };

  /**
   * Normalizes raw input string while cataloging all detected evasion artifacts
   */
  public static normalize(rawInput: string): NormalizationReport {
    const anomaliesDetected: string[] = [];
    let hasUnicodeTampering = false;
    let hasControlCharacters = false;
    let hasExcessiveWhitespace = false;
    let hasObfuscation = false;

    let working = rawInput;

    // 1. Check for invisible / control characters (zero-width spaces, RTL override)
    // \u200B = zero width space, \u200C = zero width non-joiner, \u200D = zero width joiner, \uFEFF = BOM, \u202E = RTL override
    const controlCharRegex = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\u200B-\u200F\uFEFF\u202A-\u202E]/g;
    if (controlCharRegex.test(working)) {
      hasControlCharacters = true;
      anomaliesDetected.push('DETECTED_INVISIBLE_CONTROL_CHARACTERS (Zero-width / Bidirectional override)');
      working = working.replace(controlCharRegex, '');
    }

    // 2. Check for base64 encoded strings
    const base64Regex = /(?:[A-Za-z0-9+/]{20,}={0,2})/;
    if (base64Regex.test(working)) {
      try {
        const match = working.match(base64Regex);
        if (match && match[0].length >= 20) {
          const decoded = Buffer.from(match[0], 'base64').toString('utf-8');
          if (/transfer|balance|ignore|system|bypass/i.test(decoded)) {
            hasObfuscation = true;
            anomaliesDetected.push(`DETECTED_BASE64_PAYLOAD: "${decoded.slice(0, 30)}..."`);
          }
        }
      } catch (e) {
        // Not valid base64, ignore
      }
    }

    // 3. Check for unusual Unicode homoglyphs
    let unhomoglyphed = '';
    let foundHomoglyph = false;
    for (const char of working) {
      const code = char.charCodeAt(0);
      // Non-ASCII and not standard currency (₹, $, €, £)
      if (code > 127 && !['₹', '$', '€', '£', '¥'].includes(char)) {
        if (this.homoglyphMap[char]) {
          unhomoglyphed += this.homoglyphMap[char];
          foundHomoglyph = true;
        } else {
          unhomoglyphed += char;
        }
      } else {
        unhomoglyphed += char;
      }
    }

    if (foundHomoglyph) {
      hasUnicodeTampering = true;
      anomaliesDetected.push('DETECTED_HOMOGLYPH_SUBSTITUTION (Mixed alphabet / Unicode spoofing)');
      working = unhomoglyphed;
    }

    // 4. Check for deliberate character separators (e.g. t.r.a.n.s.f.e.r or t-r-a-n-s-f-e-r)
    const spacedPattern = /\b([a-zA-Z])([._\-\/])([a-zA-Z])\2([a-zA-Z])\2([a-zA-Z])\b/g;
    if (spacedPattern.test(working)) {
      hasObfuscation = true;
      anomaliesDetected.push('DETECTED_CHARACTER_SPACED_EVASION (Character delimiter padding)');
      working = working.replace(/([a-zA-Z])[._\-\/](?=[a-zA-Z])/g, '$1');
    }

    // 5. Excessive whitespace check
    if (/\s{3,}/.test(working) || /\t|\r\n|\n{2,}/.test(working)) {
      hasExcessiveWhitespace = true;
      anomaliesDetected.push('DETECTED_EXCESSIVE_WHITESPACE (Prompt padding / indentation escape)');
    }

    // 6. Repeated character collapsing (e.g. "traaaaansfer" -> "transfer")
    const repeatedCharPattern = /(.)\1{4,}/g;
    if (repeatedCharPattern.test(working)) {
      anomaliesDetected.push('DETECTED_REPEATED_CHARACTER_FLOOD');
      working = working.replace(repeatedCharPattern, '$1$1');
    }

    // 7. Standardize whitespace & lowercase for normalized comparison
    const normalizedInput = working
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();

    return {
      originalInput: rawInput,
      normalizedInput,
      anomaliesDetected,
      hasUnicodeTampering,
      hasControlCharacters,
      hasExcessiveWhitespace,
      hasObfuscation,
    };
  }
}
