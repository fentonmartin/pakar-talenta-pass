/**
 * Brandon Thinks analysis types.
 */

export interface InterestSignals {
  engagementScore: number;
  keyMoments: string[];
  questionFrequency: number;
  responsePatterns: 'quick' | 'slow' | 'mixed';
  emotionalTone: 'positive' | 'negative' | 'neutral' | 'mixed';
  engagementTrend: 'increasing' | 'decreasing' | 'stable';
  supportingMessages: number[];
}

export interface EffortConsistency {
  initiativeRate: number;
  followThroughRate: number;
  primaryInitiator: string | null;
  followUpPattern: 'always' | 'sometimes' | 'never';
  reciprocityScore: number;
  planCompletionMentions: string[];
  initiativeTrend: 'increasing' | 'decreasing' | 'stable';
  supportingMessages: number[];
}

export interface MixedSignals {
  mixedSignalsCount: number;
  examples: { messageIndex: number; contradiction: string; severity: 'low' | 'medium' | 'high' }[];
  patternType: 'hot-and-cold' | 'hot-and-absent' | 'action-vs-words' | 'shifting-narrative';
  overallAssessment: string;
  supportingMessages: number[];
}

export interface NextQuestion {
  question: string;
}

/** Full Brandon Thinks report */
export interface BrandonReport {
  interest: InterestSignals;
  effort: EffortConsistency;
  mixedSignals: MixedSignals;
  nextQuestion: NextQuestion;
}

/** Parsed chat messages for API input */
export interface ChatAnalysisInput {
  rawText: string;
  parsedMessages: { timestamp: string | null; sender: string; text: string }[];
  participantNames: string[];  // normalized names
}