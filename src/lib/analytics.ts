import type { LlmSource, SentenceAnalytics } from "@/types";

declare global {
  interface Window {
    __AAC_ANALYTICS__?: SentenceAnalytics | null;
  }
}

/**
 * Invisible A/B layer. Interviewers can read window.__AAC_ANALYTICS__
 * or the ghost chip after a sentence lands.
 */
export class AnalyticsSession {
  private interactions = 0;
  private requestAt = 0;
  last: SentenceAnalytics | null = null;

  count(): void {
    this.interactions += 1;
  }

  /** Abandoned utterance (clear). */
  abandon(): void {
    this.interactions = 0;
  }

  markRequest(): void {
    this.requestAt = performance.now();
  }

  commit(provider: LlmSource, keywordCount: number): SentenceAnalytics {
    const latencyMs = Math.max(0, Math.round(performance.now() - this.requestAt));
    const record: SentenceAnalytics = {
      interactions: this.interactions,
      latencyMs,
      provider,
      keywordCount,
      at: new Date().toISOString(),
    };
    this.last = record;
    this.interactions = 0;
    if (typeof window !== "undefined") {
      window.__AAC_ANALYTICS__ = record;
      console.info("[aac-analytics]", record);
    }
    return record;
  }
}
