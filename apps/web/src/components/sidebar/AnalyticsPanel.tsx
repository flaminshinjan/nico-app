import { useMemo } from "react";
import { analyzeText, type TextAnalytics } from "@/lib/analytics";

type AnalyticsPanelProps = {
  html: string;
};

function readabilityColor(score: number): string {
  if (score >= 70) return "text-accent-success";
  if (score >= 50) return "text-accent-warning";
  return "text-accent-error";
}

function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="flex items-baseline justify-between py-1.5">
      <span className="text-[11px] text-content-tertiary">{label}</span>
      <div className="text-right">
        <span className="text-[13px] font-medium text-content-primary tabular-nums">{value}</span>
        {sub && <span className="text-[10px] text-content-tertiary ml-1">{sub}</span>}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <h4 className="text-[10px] font-bold tracking-[0.12em] uppercase text-content-tertiary/60 mb-2 px-0.5">
        {title}
      </h4>
      {children}
    </div>
  );
}

function ReadabilityGauge({ score, label }: { score: number; label: string }) {
  const pct = Math.min(100, Math.max(0, score));
  return (
    <div className="mb-4">
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-[11px] text-content-tertiary">Readability</span>
        <span className={`text-[13px] font-semibold ${readabilityColor(score)}`}>{label}</span>
      </div>
      <div className="h-1.5 rounded-full bg-canvas-hover overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${pct}%`,
            background: score >= 70
              ? "var(--accent-success)"
              : score >= 50
                ? "var(--accent-warning)"
                : "var(--accent-error)",
          }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[9px] text-content-tertiary">Hard</span>
        <span className="text-[9px] text-content-tertiary">Easy</span>
      </div>
    </div>
  );
}

function WarningList({ items, label }: { items: string[]; label: string }) {
  if (items.length === 0) return null;
  return (
    <div className="mt-2">
      <span className="text-[10px] font-medium text-accent-warning">{items.length} {label}</span>
      <div className="mt-1 space-y-1 max-h-[120px] overflow-y-auto">
        {items.slice(0, 5).map((item, i) => (
          <p key={i} className="text-[10px] text-content-tertiary leading-relaxed px-2 py-1 rounded bg-canvas-hover/50 truncate">
            {item}
          </p>
        ))}
        {items.length > 5 && (
          <p className="text-[9px] text-content-tertiary italic px-2">+{items.length - 5} more</p>
        )}
      </div>
    </div>
  );
}

export function AnalyticsPanel({ html }: AnalyticsPanelProps) {
  const analytics: TextAnalytics = useMemo(() => analyzeText(html), [html]);

  if (analytics.wordCount === 0) {
    return (
      <div className="px-4 py-8 text-center">
        <p className="text-[12px] text-content-tertiary italic">Start writing to see analytics</p>
      </div>
    );
  }

  return (
    <div className="px-4 py-3">
      <Section title="Overview">
        <Stat label="Words" value={analytics.wordCount.toLocaleString()} />
        <Stat label="Characters" value={analytics.charCount.toLocaleString()} />
        <Stat label="Sentences" value={analytics.sentenceCount} />
        <Stat label="Paragraphs" value={analytics.paragraphCount} />
        <Stat label="Reading time" value={analytics.readingTimeMinutes} sub="min" />
      </Section>

      <ReadabilityGauge score={analytics.fleschReadingEase} label={analytics.readabilityLabel} />

      <Section title="Scores">
        <Stat label="Flesch Reading Ease" value={analytics.fleschReadingEase} sub="/ 100" />
        <Stat label="Flesch-Kincaid Grade" value={analytics.fleschKincaidGrade} />
        <Stat label="Avg sentence length" value={analytics.avgSentenceLength} sub="words" />
        <Stat label="Avg word length" value={analytics.avgWordLength} sub="chars" />
      </Section>

      <Section title="Writing Quality">
        <Stat label="Passive voice" value={analytics.passiveVoiceCount} />
        <Stat label="Long sentences" value={analytics.longSentenceCount} sub="> 30 words" />
        <Stat label="Jargon words" value={analytics.jargonWords.length} />
        <WarningList items={analytics.passiveVoiceSentences} label="passive voice sentences" />
        <WarningList items={analytics.jargonWords} label="jargon words detected" />
      </Section>
    </div>
  );
}
