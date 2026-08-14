# CONTENT-001 — AI Assistance Extension Points

> **Mission**: ImboniServe Knowledge & Growth Platform  
> **Document Type**: AI Assistance Extension Points  
> **Date**: 2025-01-20  
> **Status**: COMPLETE

---

## 1. Purpose

Define extension points for future AI capabilities in the editorial content system. These are **design foundations only** — no AI workflows are built in this phase. The architecture must accommodate AI assistance without requiring rewrites.

## 2. Design Principle

> **Design extension points, not AI workflows. Build a minimal foundation only if required.**

AI capabilities are future enhancements. The architecture defines where AI can plug in, what data it needs, and what interfaces it would use. No AI is built now.

## 3. AI Capability Extension Points

### 3.1 Research Assistance (LATER)

**Where**: EditorialIdea → RESEARCH state

**Capability**: AI suggests research sources, related articles, and knowledge entities for an idea.

**Interface**:
```typescript
interface AIResearchAssistant {
  suggestSources(idea: EditorialIdea): Promise<ResearchSuggestion[]>
  findRelatedKnowledge(idea: EditorialIdea): Promise<KnowledgeEntity[]>
  summarizeTopic(topic: string): Promise<string>
}
```

**Data needed**: EditorialIdea, KnowledgeEntity, existing EditorialArticles

**Extension point**: `EditorialIdea.metadata.aiSuggestions` (Json)

### 3.2 Outline Generation (LATER)

**Where**: EditorialIdea → DRAFT transition

**Capability**: AI generates article outline from idea + research.

**Interface**:
```typescript
interface AIOutlineGenerator {
  generateOutline(params: {
    idea: EditorialIdea
    type: ContentType
    topic?: Topic
    knowledgeEntities: KnowledgeEntity[]
  }): Promise<OutlineSection[]>
}
```

**Extension point**: `EditorialArticle.metadata.aiOutline` (Json)

### 3.3 Draft Assistance (LATER)

**Where**: Article editor (DRAFT state)

**Capability**: AI generates draft content from outline, or expands sections.

**Interface**:
```typescript
interface AIDraftAssistant {
  generateDraft(outline: OutlineSection[], context: ArticleContext): Promise<string>
  expandSection(section: string, context: ArticleContext): Promise<string>
  improveWriting(text: string): Promise<string>
}
```

**Extension point**: `EditorialArticle.metadata.aiDraft` (Json) — stores AI-generated draft for editor review

**Critical rule**: AI-generated content is **never auto-published**. It is always reviewed by a human editor.

### 3.4 SEO Optimization (LATER)

**Where**: Article editor SEO panel

**Capability**: AI suggests meta title, meta description, keywords, and slug.

**Interface**:
```typescript
interface AISeoAssistant {
  suggestMetaTitle(article: EditorialArticle): Promise<string[]>
  suggestMetaDescription(article: EditorialArticle): Promise<string[]>
  suggestKeywords(article: EditorialArticle): Promise<string[]>
  suggestSlug(article: EditorialArticle): Promise<string[]>
  analyzeSeoScore(article: EditorialArticle): Promise<SeoScore>
}
```

**Extension point**: `EditorialArticle.seoMeta.aiSuggestions` (Json)

### 3.5 Title Suggestions (LATER)

**Where**: Article editor title field

**Capability**: AI suggests alternative titles.

**Interface**:
```typescript
interface AITitleSuggester {
  suggestTitles(article: EditorialArticle): Promise<TitleSuggestion[]>
}
```

**Extension point**: `EditorialArticle.metadata.aiTitleSuggestions` (Json)

### 3.6 Social Repurposing (LATER)

**Where**: Distribution panel

**Capability**: AI generates channel-specific content from article.

**Interface**:
```typescript
interface AISocialRepurposer {
  generateLinkedInPost(article: EditorialArticle): Promise<string>
  generateTwitterThread(article: EditorialArticle): Promise<string[]>
  generateInstagramCaption(article: EditorialArticle): Promise<string>
  generateNewsletterTeaser(article: EditorialArticle): Promise<string>
}
```

**Extension point**: `EditorialArticle.distributionMeta.aiRepurposing` (Json)

### 3.7 Newsletter Generation (LATER)

**Where**: Newsletter issue editor

**Capability**: AI assembles newsletter from recent published articles.

**Interface**:
```typescript
interface AINewsletterGenerator {
  generateIssue(params: {
    recentArticles: EditorialArticle[]
    segment: NewsletterSegment
    subjectLineStyle: string
  }): Promise<{
    subjectLine: string
    preheader: string
    body: string
  }>
}
```

**Extension point**: `NewsletterIssue.metadata.aiGenerated` (Json)

### 3.8 Translation Assistance (LATER)

**Where**: ArticleLocale creation

**Capability**: AI translates article to another locale.

**Interface**:
```typescript
interface AITranslationAssistant {
  translateArticle(params: {
    article: EditorialArticle
    targetLocale: string
  }): Promise<{
    title: string
    body: string
    excerpt: string
  }>
}
```

**Extension point**: `ArticleLocale.metadata.aiTranslated` (Json) — marks as AI-translated for human review

### 3.9 Content Refresh Suggestions (LATER)

**Where**: Content analytics / admin dashboard

**Capability**: AI identifies content that needs updating (outdated, declining traffic, broken references).

**Interface**:
```typescript
interface AIContentRefreshAssistant {
  identifyStaleContent(): Promise<RefreshSuggestion[]>
  suggestUpdates(article: EditorialArticle): Promise<UpdateSuggestion[]>
}
```

**Extension point**: `EditorialArticle.analyticsMeta.aiRefreshSuggestion` (Json)

### 3.10 Content Decay Detection (LATER)

**Where**: Content analytics

**Capability**: Automated detection of content decay signals.

**Decay signals**:
- Article age exceeds threshold (e.g., > 12 months)
- Traffic decline over 3 consecutive months
- Outdated product references (product no longer exists)
- Broken outbound links
- Expired information (e.g., pricing, statistics)

**Interface**:
```typescript
interface ContentDecayDetector {
  detectDecay(article: EditorialArticle): Promise<DecayReport>
  batchDetect(): Promise<DecayReport[]>
}
```

**Extension point**: `EditorialArticle.analyticsMeta.decayReport` (Json)

**NOW scope**: Manual flagging (editor marks article as needing review)
**LATER scope**: Automated detection

## 4. AI Integration Architecture

### 4.1 Provider Abstraction

```typescript
interface AIProvider {
  complete(prompt: string, options?: AICompleteOptions): Promise<string>
  embed(text: string): Promise<number[]>
}
```

- AI provider configured via environment variables
- Existing AI services in the repository (AI credits system) can be extended
- No hardcoding of specific AI provider

### 4.2 AI Credits Integration

The existing AI credits system (`docs/AI_CREDITS_ARCHITECTURE.md`) can be used to track AI usage for editorial features:
- Each AI assistance call consumes credits
- Credits tracked per user/business
- Admin can allocate credits for editorial AI

### 4.3 Human-in-the-Loop

All AI assistance follows human-in-the-loop principle:
1. AI generates suggestion
2. Suggestion stored in metadata (Json)
3. Editor reviews suggestion
4. Editor accepts, modifies, or rejects
5. Only human-approved content is published

**No AI content is ever published without human review.**

## 5. Metadata Extension Point Pattern

All AI suggestions are stored in article metadata fields as Json:

```json
{
  "aiSuggestions": {
    "outline": { "sections": [...], "generatedAt": "..." },
    "titles": ["Title 1", "Title 2", "Title 3"],
    "seo": { "metaTitle": "...", "metaDescription": "..." },
    "social": { "linkedin": "...", "twitter": [...] },
    "status": "PENDING_REVIEW" // PENDING_REVIEW | ACCEPTED | REJECTED | MODIFIED
  }
}
```

This pattern:
- Does not require schema changes for new AI capabilities
- Stores AI suggestions alongside content
- Tracks whether suggestions were accepted/rejected
- Enables future analysis of AI suggestion quality

## 6. What We Do NOT Build

- **No AI workflow engine** (LATER)
- **No automated content generation pipeline** (LATER)
- **No AI quality scoring** (LATER)
- **No AI content moderation** (LATER)
- **No AI-powered search** (LATER)
- **No AI chatbot for content** (LONG-TERM)
- **No AI content personalization** (LONG-TERM)

---

*End of AI Assistance Extension Points*
