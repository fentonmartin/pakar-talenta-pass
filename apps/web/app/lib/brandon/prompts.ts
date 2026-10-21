/**
 * Brandon Thinks analysis prompts for OpenRouter API.
 * Uses OpenAI-compatible endpoint: https://openrouter.ai/api/v1/chat/completions
 */

/** Prompt template for interest signals analysis */
export function interestSignalsPrompt(messages: string): string {
  return `Analyze the following chat export for interest signals. Look for:
- Where warmth, curiosity, and effort to keep the conversation going appear
- Question-asking frequency and patterns
- Response time patterns (who replies quickly vs slowly)
- Emotional tone and enthusiasm indicators
- Where the person seems engaged vs disengaged

Return a JSON object with:
{
  "engagementScore": number 0-1,
  "keyMoments": string[],  // 2-3 sentence descriptions of peak engagement
  "questionFrequency": number,  // messages that are questions
  "responsePatterns": "quick" | "slow" | "mixed",
  "emotionalTone": "positive" | "negative" | "neutral" | "mixed",
  "engagementTrend": "increasing" | "decreasing" | "stable",
  "supportingMessages": [number]  // message indices (1-based) supporting each claim
}

Chat export:
${messages}
}`
}

/** Prompt template for effort and consistency analysis */
export function effortConsistencyPrompt(messages: string): string {
  return `Analyze the following chat export for effort and consistency. Look for:
- Who initiates conversations most frequently
- Who follows up after plans are made or declined
- Who turns words into real plans (mentions specific times/dates)
- Reciprocity patterns (does one person always pursue?)
- Consistency over time (does behavior change across the chat)
- Plan completion rate (how many proposed plans actually happen)

Return a JSON object with:
{
  "initiativeRate": number 0-1,  // ratio of messages initiating conversation
  "followThroughRate": number 0-1,  // ratio of plans that materialize
  "primaryInitiator": string | null,  // sender name or null
  "followUpPattern": "always" | "sometimes" | "never",
  "reciprocityScore": number 0-1,
  "planCompletionMentions": string[],  // specific plan references
  "initiativeTrend": "increasing" | "decreasing" | "stable",
  "supportingMessages": [number]
}

Chat export:
${messages}`
}

/** Prompt template for mixed signals analysis */
export function mixedSignalsPrompt(messages: string): string {
  return `Analyze the following chat export for mixed signals. Look for:
- Moments where words contradict tone (e.g., "I'm fine" with upset emojis)
- Inconsistent timing (saying one thing at one time, another thing later)
- Conflicting action vs words (saying "I want to see you" but never setting up meetups)
- Changing stories or shifting narratives
- Mixed emotional signals (hot-and-cold behavior)
- Ambiguous messages that could be read multiple ways

Return a JSON object with:
{
  "mixedSignalsCount": number,  // count of mixed signal instances
  "examples": [
    {
      "messageIndex": number,
      "contradiction": string,  // description of the contradiction
      "severity": "low" | "medium" | "high"
    }
  ],
  "patternType": "hot-and-cold" | "hot-and-absent" | "action-vs-words" | "shifting-narrative",
  "overallAssessment": string,  // 2-3 sentence summary
  "supportingMessages": [number]
}

Chat export:
${messages}`
}

/** Prompt template for next question generation */
export function nextQuestionPrompt(messages: string, analysisSummary: string): string {
  return `Based on the following analysis summary of a chat export, generate ONE grounded, open-ended question the user could ask to clarify the situation. The question should:

- Be specific to the patterns observed (not a generic "how are you?")
- Reference the evidence (message patterns, not private thoughts)
- Avoid making accusations or assumptions about intent
- Help move the conversation forward productively
- Be uncertain enough to allow multiple explanations

Return just the question as a single string, no introduction or conclusion.

Analysis summary:
${analysisSummary}

Chat export (key excerpts):
${messages}`
}