/**
 * Brandon Thinks analysis engine — calls OpenRouter LLM API.
 * Uses OpenAI-compatible endpoint at https://openrouter.ai/api/v1/chat/completions
 */

import { parseChat, normalizeSender, isQuestion, hasWarmthSignal, isInitiative, isAvoidant, lengthCategory } from './parser';
import { InterestSignals, EffortConsistency, MixedSignals, NextQuestion, BrandonReport, ChatAnalysisInput } from './types';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

/** Extract just the text content from OpenRouter's choice message */
function extractContent(message: any): string {
  if (message && message.content) {
    if (typeof message.content === 'string') return message.content;
    if (Array.isArray(message.content)) {
      return message.content
        .filter((c: any) => c.type === 'text')
        .map((c: any) => c.text)
        .join('\n');
    }
  }
  return '';
}

/** Call OpenRouter with a prompt and return parsed JSON */
async function callOpenRouter(systemPrompt: string, userPrompt: string, temperature = 0.2): Promise<any> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY not configured');
  }

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': 'http://localhost:3000',
      'X-Title': 'Brandon Thinks',
    },
    body: JSON.stringify({
      model: 'nvidia/nemotron-3.5-free:free',  // User's configured free model
      temperature,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenRouter API error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message;
}

/** Parse the chat and run all 4 analyses */
export async function analyzeChat(
  rawText: string,
  participantNames: string[] = []
): Promise<BrandonReport> {
  // 1. Parse the chat
  const messages = parseChat(rawText);

  // 2. Build the formatted message string for prompts
  const formattedMessages = messages
    .map(
      (msg, idx) =>
        `[${msg.timestamp || '?'}] ${msg.sender}: ${msg.text}`
    )
    .join('\n');

  // 3. Run each analysis via OpenRouter

  // --- Interest Signals ---
  const interestSystem = `You are an relationship dynamics analyst. Return ONLY valid JSON as specified. Do not include any reasoning, introduction, or conclusion beyond the JSON object.`;
  const interestPrompt = interestSignalsPrompt(formattedMessages);
  const interestResp = await callOpenRouter(interestSystem, interestPrompt, 0.2);
  const interestContent = extractContent(interestResp);
  const interestData = JSON.parse(interestContent);

  // --- Effort and Consistency ---
  const effortSystem = `You are an relationship dynamics analyst. Return ONLY valid JSON as specified. Do not include any reasoning, introduction, or conclusion beyond the JSON object.`;
  const effortPrompt = effortConsistencyPrompt(formattedMessages);
  const effortResp = await callOpenRouter(effortSystem, effortPrompt, 0.2);
  const effortContent = extractContent(effortResp);
  const effortData = JSON.parse(effortContent);

  // --- Mixed Signals ---
  const mixedSystem = `You are an relationship dynamics analyst. Return ONLY valid JSON as specified. Do not include any reasoning, introduction, or conclusion beyond the JSON object.`;
  const mixedPrompt = mixedSignalsPrompt(formattedMessages);
  const mixedResp = await callOpenRouter(mixedSystem, mixedPrompt, 0.2);
  const mixedContent = extractContent(mixedResp);
  const mixedData = JSON.parse(mixedContent);

  // --- Next Question ---
  // Build a quick summary from the first two analyses
  const quickSummary =
    `Engagement: ${interestData.engagementScore} (${interestData.engagementTrend}). ` +
    `Initiative: ${effortData.initiativeRate} (${effortData.initiativeTrend}). ` +
    `Mixed signals: ${mixedData.mixedSignalsCount} instances.`;

  const nextSystem = `You are a relationship coach. Return ONLY a single question string. No introduction, no conclusion, just the question.`;
  const nextPrompt = nextQuestionPrompt(formattedMessages, quickSummary);
  const nextResp = await callOpenRouter(nextSystem, nextPrompt, 0.3);
  const nextContent = extractContent(nextResp);

  // 4. Assemble and return the full report
  return {
    interest: {
      engagementScore: interestData.engagementScore ?? 0.5,
      keyMoments: interestData.keyMoments ?? [],
      questionFrequency: interestData.questionFrequency ?? 0,
      responsePatterns: interestData.responsePatterns ?? 'mixed',
      emotionalTone: interestData.emotionalTone ?? 'neutral',
      engagementTrend: interestData.engagementTrend ?? 'stable',
      supportingMessages: interestData.supportingMessages ?? [],
    },
    effort: {
      initiativeRate: effortData.initiativeRate ?? 0.5,
      followThroughRate: effortData.followThroughRate ?? 0.5,
      primaryInitiator: effortData.primaryInitiator ?? null,
      followUpPattern: effortData.followUpPattern ?? 'sometimes',
      reciprocityScore: effortData.reciprocityScore ?? 0.5,
      planCompletionMentions: effortData.planCompletionMentions ?? [],
      initiativeTrend: effortData.initiativeTrend ?? 'stable',
      supportingMessages: effortData.supportingMessages ?? [],
    },
    mixedSignals: {
      mixedSignalsCount: mixedData.mixedSignalsCount ?? 0,
      examples: mixedData.examples ?? [],
      patternType: mixedData.patternType ?? 'hot-and-cold',
      overallAssessment: mixedData.overallAssessment ?? 'No major patterns identified',
      supportingMessages: mixedData.supportingMessages ?? [],
    },
    nextQuestion: {
      question: nextContent || 'What does this person\'s behavior really mean for our connection?',
    },
  };
}

/** Main entry point: parse + analyze a chat export */
export async function getBrandonReport(
  rawText: string,
  participantNames: string[] = []
): Promise<{ report: BrandonReport; parsed: Awaited<ReturnType<typeof parseChat>>; input: ChatAnalysisInput }> {
  const parsed = parseChat(rawText);
  const normalizedParticipants = participantNames
    ? participantNames.map(normalizeSender)
    : [...new Set(parsed.map((m) => normalizeSender(m.sender)))];

  const report = await analyzeChat(rawText, normalizedParticipants);

  return { report, parsed, input: { rawText, parsedMessages: parsed, participantNames: normalizedParticipants } };
}