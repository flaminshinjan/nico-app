export type TextAnalytics = {
  wordCount: number;
  charCount: number;
  sentenceCount: number;
  paragraphCount: number;
  readingTimeMinutes: number;
  fleschReadingEase: number;
  fleschKincaidGrade: number;
  readabilityLabel: string;
  passiveVoiceCount: number;
  passiveVoiceSentences: string[];
  jargonWords: string[];
  avgSentenceLength: number;
  avgWordLength: number;
  longSentenceCount: number;
};

function stripHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.body.textContent ?? "";
}

function getSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function getWords(text: string): string[] {
  return text
    .split(/\s+/)
    .map((w) => w.replace(/[^a-zA-Z'-]/g, ""))
    .filter((w) => w.length > 0);
}

function getParagraphs(text: string): string[] {
  return text.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
}

function countSyllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-z]/g, "");
  if (word.length <= 3) return 1;
  word = word.replace(/(?:[^leas]es|ed|[^aeiou]e)$/, "");
  word = word.replace(/^y/, "");
  const matches = word.match(/[aeiouy]{1,2}/g);
  return matches ? Math.max(matches.length, 1) : 1;
}

const PASSIVE_RE =
  /\b(was|were|is|are|been|being|be|am|has been|have been|had been|will be|shall be)\s+(\w+ed|written|broken|chosen|driven|eaten|fallen|given|gone|known|risen|spoken|taken|thrown|worn|frozen|hidden|proven|shown|stolen|sworn|torn|woken|built|bought|caught|dealt|felt|found|held|kept|left|lent|lost|made|meant|met|paid|put|read|run|said|seen|sent|set|shot|shut|sat|slept|spent|stood|taught|thought|told|understood|won)\b/gi;

const JARGON_SET = new Set([
  "synergy", "leverage", "paradigm", "holistic", "scalable",
  "bandwidth", "deliverable", "ideate", "incentivize", "onboard",
  "optimize", "streamline", "proactive", "ecosystem", "disrupt",
  "actionable", "deep-dive", "thought-leadership", "pivot", "robust",
  "granular", "drill-down", "touchpoint", "value-add", "best-practice",
  "circle-back", "low-hanging-fruit", "move-the-needle", "game-changer",
  "bleeding-edge", "core-competency", "stakeholder", "utilize",
  "facilitate", "synergize", "operationalize", "vertical",
]);

function getReadabilityLabel(score: number): string {
  if (score >= 90) return "Very Easy";
  if (score >= 80) return "Easy";
  if (score >= 70) return "Fairly Easy";
  if (score >= 60) return "Standard";
  if (score >= 50) return "Fairly Hard";
  if (score >= 30) return "Hard";
  return "Very Hard";
}

export function analyzeText(html: string): TextAnalytics {
  const text = stripHtml(html);
  const words = getWords(text);
  const sentences = getSentences(text);
  const paragraphs = getParagraphs(text);

  const wordCount = words.length;
  const charCount = text.replace(/\s/g, "").length;
  const sentenceCount = Math.max(sentences.length, 1);
  const paragraphCount = Math.max(paragraphs.length, 1);
  const readingTimeMinutes = wordCount > 0 ? Math.max(Math.ceil(wordCount / 200), 1) : 0;

  const totalSyllables = words.reduce((sum, w) => sum + countSyllables(w), 0);
  const avgSentenceLength = wordCount / sentenceCount;
  const avgSyllablesPerWord = wordCount > 0 ? totalSyllables / wordCount : 0;

  const fleschReadingEase = wordCount > 0
    ? Math.max(0, Math.min(100, 206.835 - 1.015 * avgSentenceLength - 84.6 * avgSyllablesPerWord))
    : 100;

  const fleschKincaidGrade = wordCount > 0
    ? Math.max(0, 0.39 * avgSentenceLength + 11.8 * avgSyllablesPerWord - 15.59)
    : 0;

  const passiveVoiceSentences: string[] = [];
  for (const sentence of sentences) {
    PASSIVE_RE.lastIndex = 0;
    if (PASSIVE_RE.test(sentence)) passiveVoiceSentences.push(sentence);
  }

  const jargonFound = new Set<string>();
  for (const word of words) {
    const lower = word.toLowerCase();
    if (JARGON_SET.has(lower)) jargonFound.add(lower);
  }

  const longSentenceCount = sentences.filter((s) => getWords(s).length > 30).length;
  const avgWordLength = wordCount > 0
    ? words.reduce((sum, w) => sum + w.length, 0) / wordCount
    : 0;

  return {
    wordCount,
    charCount,
    sentenceCount,
    paragraphCount,
    readingTimeMinutes,
    fleschReadingEase: Math.round(fleschReadingEase * 10) / 10,
    fleschKincaidGrade: Math.round(fleschKincaidGrade * 10) / 10,
    readabilityLabel: getReadabilityLabel(fleschReadingEase),
    passiveVoiceCount: passiveVoiceSentences.length,
    passiveVoiceSentences,
    jargonWords: Array.from(jargonFound),
    avgSentenceLength: Math.round(avgSentenceLength * 10) / 10,
    avgWordLength: Math.round(avgWordLength * 10) / 10,
    longSentenceCount,
  };
}
