/**
 * Hospitality AI Copilot™ — Intent Classification Engine (Phase 1).
 *
 * Classifies every incoming request before any reasoning begins.
 *
 * Supported intents (16):
 *   information_request, explanation, root_cause_analysis,
 *   recommendation_request, prediction_request, risk_assessment,
 *   planning, optimization, comparison, status_check,
 *   trend_analysis, decision_support, problem_diagnosis,
 *   operational_review, learning_training, unknown_intent
 *
 * Architectural constraint:
 *   Reasoning never begins before intent classification is complete.
 *
 * The classifier is deterministic, keyword + pattern based, and explainable.
 * It does NOT use an LLM — it uses a rule-based signal matrix so that
 * classification is reproducible and auditable.
 */

import type { CopilotRequest, IntentClassification } from './types'
import type { IntentType } from '../skill-registry/types'
import {
  tokenize,
  textContainsAny,
  countKeywordMatches,
  clamp01,
  nowIso,
  hashId,
} from './utils'

// ============================================================================
// Intent Signal Matrix
// ============================================================================

interface IntentSignal {
  intent: IntentType
  keywords: string[]
  phrases: string[]
  weight: number
  description: string
}

const INTENT_SIGNALS: IntentSignal[] = [
  {
    intent: 'information_request',
    keywords: ['what', 'who', 'where', 'when', 'which', 'how many', 'how much', 'tell me', 'show me', 'list'],
    phrases: ['what is', 'what are', 'how many', 'how much', 'tell me about', 'show me', 'give me', 'list the'],
    weight: 1.0,
    description: 'Direct request for factual information',
  },
  {
    intent: 'explanation',
    keywords: ['why', 'explain', 'reason', 'because', 'cause', 'meaning', 'understand'],
    phrases: ['why did', 'why is', 'why does', 'explain why', 'help me understand', 'what is the reason', 'what caused'],
    weight: 1.0,
    description: 'Request for understanding of cause or rationale',
  },
  {
    intent: 'root_cause_analysis',
    keywords: ['root cause', 'underlying', 'source of', 'origin', 'trigger', 'led to', 'caused by'],
    phrases: ['root cause of', 'what is the root cause', 'underlying cause', 'what led to', 'what triggered', 'source of the problem'],
    weight: 1.2,
    description: 'Deep causal investigation',
  },
  {
    intent: 'recommendation_request',
    keywords: ['recommend', 'suggest', 'should', 'advice', 'best', 'propose', 'what should'],
    phrases: ['what should i do', 'what do you recommend', 'what do you suggest', 'give me a recommendation', 'best way to', 'how should we'],
    weight: 1.2,
    description: 'Request for actionable advice',
  },
  {
    intent: 'prediction_request',
    keywords: ['predict', 'forecast', 'expect', 'will', 'going to', 'future', 'tomorrow', 'next week'],
    phrases: ['what will happen', 'predict if', 'forecast for', 'expect to', 'going to happen', 'what to expect'],
    weight: 1.2,
    description: 'Request for forward-looking estimate',
  },
  {
    intent: 'risk_assessment',
    keywords: ['risk', 'danger', 'threat', 'vulnerability', 'exposure', 'concern', 'warning'],
    phrases: ['what is the risk', 'how risky', 'what are the risks', 'risk of', 'exposure to', 'potential threat'],
    weight: 1.2,
    description: 'Request for risk evaluation',
  },
  {
    intent: 'planning',
    keywords: ['plan', 'schedule', 'prepare', 'organize', 'arrange', 'upcoming', 'ahead'],
    phrases: ['how should we plan', 'plan for', 'prepare for', 'schedule for', 'what to plan', 'how to organize'],
    weight: 1.1,
    description: 'Request for forward planning',
  },
  {
    intent: 'optimization',
    keywords: ['optimize', 'improve', 'better', 'efficient', 'reduce', 'increase', 'maximize', 'minimize', 'streamline'],
    phrases: ['how can we improve', 'how to optimize', 'how to reduce', 'how to increase', 'how to make better', 'ways to improve'],
    weight: 1.2,
    description: 'Request for improvement opportunities',
  },
  {
    intent: 'comparison',
    keywords: ['compare', 'versus', 'vs', 'difference', 'better than', 'worse than', 'contrast', 'relative'],
    phrases: ['compare', 'difference between', 'versus', 'vs', 'better than', 'worse than', 'how does x compare', 'relative to'],
    weight: 1.1,
    description: 'Request for comparative analysis',
  },
  {
    intent: 'status_check',
    keywords: ['status', 'current', 'now', 'today', 'right now', 'ongoing', 'live', 'happening'],
    phrases: ['what is the status', 'what is happening', 'current state', 'how are things', 'what is going on', 'right now'],
    weight: 1.0,
    description: 'Request for current state',
  },
  {
    intent: 'trend_analysis',
    keywords: ['trend', 'pattern', 'over time', 'historically', 'evolution', 'trajectory', 'declining', 'improving'],
    phrases: ['trend over', 'pattern over time', 'historically', 'how has', 'evolution of', 'trajectory', 'is it improving', 'is it declining'],
    weight: 1.1,
    description: 'Request for temporal pattern analysis',
  },
  {
    intent: 'decision_support',
    keywords: ['decide', 'decision', 'choose', 'option', 'alternative', 'tradeoff', 'trade-off', 'pick'],
    phrases: ['help me decide', 'should we', 'which option', 'help me choose', 'what are the options', 'tradeoffs of', 'decision between'],
    weight: 1.2,
    description: 'Request for decision support',
  },
  {
    intent: 'problem_diagnosis',
    keywords: ['problem', 'issue', 'wrong', 'broken', 'failing', 'error', 'bug', 'not working', 'underperforming'],
    phrases: ['what is wrong', 'what is the problem', 'why is it broken', 'not working', 'underperforming', 'diagnose the issue'],
    weight: 1.2,
    description: 'Request for problem identification',
  },
  {
    intent: 'operational_review',
    keywords: ['review', 'summary', 'recap', 'overview', 'performance', 'how did', 'evaluate', 'assess'],
    phrases: ['review of', 'summary of', 'recap of', 'how did we do', 'performance review', 'evaluate', 'assess performance'],
    weight: 1.1,
    description: 'Request for retrospective review',
  },
  {
    intent: 'learning_training',
    keywords: ['learn', 'teach', 'train', 'tutorial', 'guide', 'how to', 'explain to', 'onboard', 'educate'],
    phrases: ['how to', 'teach me', 'train me', 'guide me through', 'explain to a new', 'onboard', 'educate staff'],
    weight: 1.0,
    description: 'Request for learning/training content',
  },
]

// ============================================================================
// Intent Classification Engine
// ============================================================================

const CLASSIFIER_VERSION = '1.0.0'

export class IntentClassificationEngine {
  /**
   * Classify the intent of a Copilot request.
   *
   * Returns the highest-scoring intent along with alternatives and rejected
   * intents. If no signal fires, intent is `unknown_intent`.
   */
  classify(request: CopilotRequest): IntentClassification {
    const start = Date.now()
    const question = request.question
    const tokens = tokenize(question)

    const scores: Array<{ intent: IntentType; score: number; signals: string[] }> = []

    for (const signal of INTENT_SIGNALS) {
      const evaluation = this.scoreIntent(question, tokens, signal)
      scores.push(evaluation)
    }

    // Sort descending by score
    scores.sort((a, b) => b.score - a.score)

    const top = scores[0]
    const alternatives: Array<{ intent: IntentType; confidence: number }> = []
    const rejected: Array<{ intent: IntentType; reason: string }> = []

    for (let i = 0; i < scores.length; i++) {
      const entry = scores[i]
      if (i === 0) continue
      if (entry.score > 0.1) {
        alternatives.push({ intent: entry.intent, confidence: clamp01(entry.score) })
      } else {
        rejected.push({ intent: entry.intent, reason: `No matching signals (score=${entry.score.toFixed(2)})` })
      }
    }

    const intent: IntentType = top && top.score > 0.1 ? top.intent : 'unknown_intent'
    const confidence = clamp01(top ? top.score : 0)

    return {
      requestId: request.requestId,
      intent,
      confidence,
      alternativeIntents: alternatives.slice(0, 4),
      matchedSignals: top ? top.signals : [],
      rejectedIntents: rejected,
      classificationTime: Date.now() - start,
      classifierVersion: CLASSIFIER_VERSION,
    }
  }

  // --------------------------------------------------------------------------
  // Scoring
  // --------------------------------------------------------------------------

  private scoreIntent(
    question: string,
    tokens: string[],
    signal: IntentSignal
  ): { intent: IntentType; score: number; signals: string[] } {
    const signals: string[] = []
    let score = 0

    // Phrase matches (higher weight)
    const phraseMatches = signal.phrases.filter((p) => question.toLowerCase().includes(p))
    if (phraseMatches.length > 0) {
      score += phraseMatches.length * 0.4 * signal.weight
      signals.push(`phrases: ${phraseMatches.join(', ')}`)
    }

    // Keyword matches
    const keywordCount = countKeywordMatches(question, signal.keywords)
    if (keywordCount > 0) {
      score += keywordCount * 0.2 * signal.weight
      signals.push(`keywords: ${keywordCount} match(es)`)
    }

    // Token overlap (subtle signal)
    const tokenOverlap = tokens.filter((t) =>
      signal.keywords.some((k) => normalizeKeyword(k).includes(t) || t.includes(normalizeKeyword(k)))
    ).length
    if (tokenOverlap > 0 && phraseMatches.length === 0 && keywordCount === 0) {
      score += tokenOverlap * 0.05 * signal.weight
      signals.push(`token overlap: ${tokenOverlap}`)
    }

    return {
      intent: signal.intent,
      score: clamp01(score),
      signals,
    }
  }

  // --------------------------------------------------------------------------
  // Introspection helpers
  // --------------------------------------------------------------------------

  listSupportedIntents(): IntentType[] {
    return [...INTENT_SIGNALS.map((s) => s.intent), 'unknown_intent']
  }

  describeIntent(intent: IntentType): string | null {
    const signal = INTENT_SIGNALS.find((s) => s.intent === intent)
    return signal ? signal.description : null
  }
}

function normalizeKeyword(keyword: string): string {
  return keyword.toLowerCase().replace(/\s+/g, '')
}

// ============================================================================
// Singleton
// ============================================================================

let singleton: IntentClassificationEngine | null = null

export function getIntentClassificationEngine(): IntentClassificationEngine {
  if (!singleton) singleton = new IntentClassificationEngine()
  return singleton
}

export function resetIntentClassificationEngine(): void {
  singleton = null
}

// ============================================================================
// Test helper — generate a deterministic request ID
// ============================================================================

export function generateRequestId(businessId: string, question: string): string {
  return hashId('req', `${businessId}|${question}|${nowIso()}`)
}
