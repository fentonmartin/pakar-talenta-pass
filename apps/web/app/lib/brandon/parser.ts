/**
 * Chat message parsed from WhatsApp/iMessage TXT export.
 */
export interface ParsedMessage {
  /** ISO timestamp or null if unparseable */
  timestamp: string | null;
  /** Sender name (normalized) */
  sender: string;
  /** Message text */
  text: string;
}

/**
 * Parse WhatsApp TXT export format:
 * [10/15/23, 14:30] John: Hey, want to grab dinner?
 * [10/15/23, 14:31] Sarah: Sure, what time?
 * Also handles iMessage format: [Oct 15, 2023 at 2:30 PM] John: Hey
 */
export function parseChat(text: string): ParsedMessage[] {
  const messages: ParsedMessage[] = [];
  const lines = text.split('\n');

  for (const line of lines) {
    // WhatsApp format: [DD/MM/YY, HH:MM] Name: message
    // iMessage format: [Month D, Y at H:MM PM] Name: message
    const waMatch = line.match(/^\[(\d{1,2}[\/\-\]\s]\d{1,2}:\d{2}[^\]]*)\]\s*(.+?):\s*(.*)$/);
    const imMessageMatch = line.match(/^\[([^\]]+)\]\s*(.+?):\s*(.*)$/);

    if (waMatch) {
      const [, timestamp, sender, text] = waMatch;
      messages.push({
        timestamp: timestamp.trim(),
        sender: sender.trim(),
        text: text.trim(),
      });
    } else if (imMessageMatch) {
      const [, timestamp, sender, text] = imMessageMatch;
      messages.push({
        timestamp: timestamp.trim(),
        sender: sender.trim(),
        text: text.trim(),
      });
    } else if (line.trim() && !line.match(/^\s*$/)) {
      // Skip empty lines and pure metadata lines
    }
  }

  return messages;
}

/** Normalize sender name — lowercase, trim, collapse whitespace */
export function normalizeSender(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/g, '');
}

/** Determine if a message contains a question */
export function isQuestion(text: string): boolean {
  const trimmed = text.trim();
  return trimmed.endsWith('?') || /^\s*question/i.test(trimmed);
}

/** Determine if a message contains warmth/curiosity signals */
export function hasWarmthSignal(text: string): boolean {
  const lower = text.toLowerCase();
  const warmthWords = ['sure', 'okay', 'yeah', 'yes', 'great', 'awesome', 'fun', 'haha', 'lol'];
  return warmthWords.some((w) => lower.includes(w));
}

/** Determine if a message is an initiative (starts a new topic/plan) */
export function isInitiative(text: string): boolean {
  const lower = text.toLowerCase();
  const initiativeWords = ['want to', 'let\'s', 'going to', 'plan', 'meet', 'grab', 'hang out'];
  return initiativeWords.some((w) => lower.includes(w));
}

/** Determine if a message is avoidant/evasive */
export function isAvoidant(text: string): boolean {
  const lower = text.toLowerCase();
  const avoidantWords = ['maybe', 'idk', 'i guess', 'whatever', 'whatever you want'];
  return avoidantWords.some((w) => lower.includes(w));
}

/** Determine message length category */
export function lengthCategory(text: string): 'short' | 'medium' | 'long' {
  const chars = text.replace(/\s/g, '').length;
  if (chars < 20) return 'short';
  if (chars < 80) return 'medium';
  return 'long';
}