/**
 * BANKISM — Blue-Team AI Banking Firewall & Fraud Intelligence Platform
 * Core Data Models & Security Interfaces
 */

export type UserRole = 'CUSTOMER' | 'SECURITY_ANALYST' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  accountId: string;
}

export interface Account {
  id: string;
  userId: string;
  accountNumber: string;
  holderName: string;
  balance: number;
  currency: string;
  bankName: string;
  status: 'ACTIVE' | 'FLAGGED' | 'FROZEN';
  createdAt: string;
  typicalTransferMin: number;
  typicalTransferMax: number;
}

export interface Beneficiary {
  id: string;
  userId: string;
  name: string;
  accountNumber: string;
  bankName: string;
  verified: boolean;
  knownSince: string;
}

export type ThreatCategory =
  | 'PROMPT_INJECTION'
  | 'JAILBREAK'
  | 'ROLE_OVERRIDE'
  | 'POLICY_OVERRIDE'
  | 'TOOL_MANIPULATION'
  | 'DATA_EXFILTRATION'
  | 'OBFUSCATION'
  | 'TRANSACTION_MANIPULATION'
  | 'SUSPICIOUS_INSTRUCTION'
  | 'SOCIAL_ENGINEERING_SIGNAL'
  | 'NONE';

export interface ThreatDetectionResult {
  detected: boolean;
  categories: ThreatCategory[];
  confidence: number;
  signals: string[];
  criticNotes?: string;
}

export type BankingAction =
  | 'BALANCE'
  | 'TRANSFER'
  | 'TRANSACTION_HISTORY'
  | 'PAY_BILL'
  | 'UNKNOWN';

export interface BankingIntent {
  action: BankingAction;
  recipient?: string | null;
  recipientAccountId?: string | null;
  amount?: number | null;
  currency?: string;
  billerId?: string | null;
  limit?: number;
  memo?: string | null;
  rawEntities?: Record<string, any>;
}

export type TrustLevel =
  | 'SYSTEM_POLICY'        // TRUSTED
  | 'BANK_DATABASE'        // TRUSTED
  | 'USER_MESSAGE'         // UNTRUSTED
  | 'PAYMENT_MEMO'         // UNTRUSTED
  | 'MERCHANT_DESCRIPTION' // UNTRUSTED
  | 'EXTERNAL_TEXT';       // UNTRUSTED

export interface TaintNode {
  stage: string;
  source: string;
  trustLevel: 'TRUSTED' | 'UNTRUSTED' | 'REQUIRES_VALIDATION' | 'TAINTED';
  contentPreview: string;
  sanitized: boolean;
  details: string;
}

export type SecurityDecision = 'ALLOW' | 'VERIFY' | 'BLOCK';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface RiskFactor {
  factor: string;
  points: number;
  category: 'PROMPT_THREAT' | 'SENDER_HISTORY' | 'RECEIVER_REPUTATION' | 'TRANSACTION_ANOMALY' | 'ACCOUNT_SIGNAL';
  description: string;
}

export interface RiskAssessment {
  score: number;
  level: RiskLevel;
  factors: RiskFactor[];
  summary: string;
}

export interface SenderHistoryProfile {
  userId: string;
  historicalSecurityEvents: number;
  confirmedFraudEvents: number;
  blockedAttempts: number;
  lastSecurityEventDate?: string;
  riskLevel: RiskLevel;
  recentEvents: SecurityEventSummary[];
}

export interface ReceiverReputationProfile {
  identifier: string; // name or accountId
  accountNumber?: string;
  bankName?: string;
  riskScore: number;
  riskLevel: RiskLevel;
  previousSuspiciousTransactions: number;
  confirmedFraudAssociations: number;
  uniqueSendersInvolved: number;
  lastSuspiciousActivity?: string;
  isKnownMuleAccount: boolean;
  sharedIntelligenceFlag?: boolean;
  sharedIntelligenceSource?: string;
}

export interface AccountReputation {
  accountId: string;
  identifier: string;
  riskScore: number;
  confirmedFraudCount: number;
  suspiciousEventCount: number;
  totalTransactions: number;
  uniqueSendersCount: number;
  lastFlaggedAt?: string;
  flags: string[];
}

export interface SystemThreatAssessment {
  systemThreatScore: number;
  threatLevel: 'LOW' | 'ELEVATED' | 'HIGH' | 'SEVERE';
  defconLevel: 'DEFCON 4' | 'DEFCON 3' | 'DEFCON 2' | 'DEFCON 1';
  statusMessage: string;
  trend: 'INCREASING' | 'STABLE' | 'DECREASING';
  metrics: {
    totalEvaluated: number;
    blockedCount: number;
    verifyCount: number;
    allowCount: number;
    blockRatePercent: number;
    avgRiskScore: number;
    peakRiskScore: number;
    activeCriticalCases: number;
  };
  recentLogs: {
    id: string;
    timestamp: string;
    actor: string;
    type: string;
    decision: SecurityDecision;
    riskScore: number;
    summary: string;
  }[];
  vectors: {
    vector: string;
    count: number;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  }[];
}

export interface AnomalyAssessment {
  anomalyDetected: boolean;
  score: number;
  signals: string[];
  typicalRange: string;
  attemptedAmount?: number;
}

export interface PolicyRuleTriggered {
  ruleId: string;
  name: string;
  severity: 'INFO' | 'WARN' | 'CRITICAL';
  action: SecurityDecision;
  reason: string;
}

export interface DeterministicPolicyResult {
  decision: SecurityDecision;
  approved: boolean;
  requiresVerification: boolean;
  rulesTriggered: PolicyRuleTriggered[];
  mandatoryBlockApplied: boolean;
  decisionReason: string;
}

export interface AuthorizedBankingCommand {
  type: 'BALANCE' | 'TRANSACTION_HISTORY' | 'TRANSFER' | 'PAY_BILL';
  commandString: string;
  parameters: Record<string, any>;
  authorizedAt: string;
}

export interface NormalizationReport {
  originalInput: string;
  normalizedInput: string;
  anomaliesDetected: string[];
  hasUnicodeTampering: boolean;
  hasControlCharacters: boolean;
  hasExcessiveWhitespace: boolean;
  hasObfuscation: boolean;
}

export interface SecurityAnalysisResponse {
  requestId: string;
  timestamp: string;
  approved: boolean;
  decision: SecurityDecision;
  risk: RiskAssessment;
  threat: ThreatDetectionResult;
  intent: BankingIntent;
  normalization: NormalizationReport;
  taintTrace: TaintNode[];
  senderHistory: SenderHistoryProfile;
  receiverReputation: ReceiverReputationProfile;
  anomaly: AnomalyAssessment;
  policy: DeterministicPolicyResult;
  authorizedCommand?: AuthorizedBankingCommand | null;
  securityCaseCreated: boolean;
  createdCaseId?: string;
  reason: string;
  aiProviderUsed: string;
}

export interface SecurityEvent {
  eventId: string;
  userId: string;
  accountId: string;
  transactionId?: string;
  timestamp: string;
  eventType: string;
  riskScore: number;
  decision: SecurityDecision;
  threatCategories: ThreatCategory[];
  reason: string;
  evidenceSummary: string;
  originalInput: string;
  normalizedInput: string;
}

export interface SecurityEventSummary {
  date: string;
  eventType: string;
  decision: SecurityDecision;
  status: 'SUSPICIOUS' | 'BLOCKED' | 'CONFIRMED_FRAUD' | 'APPROVED';
}

export type CaseStatus =
  | 'OPEN'
  | 'INVESTIGATING'
  | 'CONFIRMED_FRAUD'
  | 'FALSE_POSITIVE'
  | 'CLOSED'
  | 'REPORTED';

export interface AnalystNote {
  id: string;
  caseId: string;
  analystId: string;
  analystName: string;
  note: string;
  timestamp: string;
}

export interface FraudCase {
  caseId: string;
  title: string;
  status: CaseStatus;
  severity: RiskLevel;
  createdAt: string;
  updatedAt: string;
  senderId: string;
  senderName: string;
  receiverIdentifier: string;
  amount: number | null;
  currency: string;
  riskScore: number;
  threatCategories: ThreatCategory[];
  evidencePackage: {
    originalPrompt: string;
    normalizedPrompt: string;
    detectedSignals: string[];
    riskFactors: RiskFactor[];
    transactionFingerprint: string;
    previousSecurityEventsCount: number;
    receiverFraudCount: number;
  };
  notes: AnalystNote[];
  reportedToIntelligence: boolean;
  reportId?: string;
}

export interface FraudIntelligenceReport {
  reportId: string;
  caseId: string;
  timestamp: string;
  reportingBank: string;
  senderPseudonym: string;
  receiverPseudonym: string;
  amount: number | null;
  riskScore: number;
  threatCategories: ThreatCategory[];
  transactionFingerprint: string;
  evidenceSummary: string;
  status: 'SUBMITTED' | 'VERIFIED' | 'PROPAGATED';
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actor: string;
  role: string;
  action: string;
  resource: string;
  result: 'SUCCESS' | 'BLOCKED' | 'WARNING' | 'FAILED';
  requestId: string;
  details?: Record<string, any>;
}

export interface GraphNode {
  id: string;
  label: string;
  type: 'USER' | 'ACCOUNT' | 'MULE_ACCOUNT' | 'FRAUD_EVENT';
  riskScore: number;
  details: {
    identifier: string;
    transactionCount: number;
    securityEventCount: number;
    confirmedFraudCount: number;
    status: string;
  };
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: 'TRANSFERRED' | 'ATTEMPTED' | 'ASSOCIATED' | 'MULE_LINK';
  amount?: number;
  riskScore: number;
  date: string;
}

export interface TransactionRecord {
  id: string;
  fromAccountId: string;
  toAccountId?: string;
  fromUserId: string;
  toRecipientName: string;
  amount: number;
  currency: string;
  status: 'COMPLETED' | 'BLOCKED' | 'PENDING_VERIFICATION' | 'REJECTED';
  commandType: string;
  riskScore: number;
  threatCategories: ThreatCategory[];
  memo?: string;
  createdAt: string;
}
