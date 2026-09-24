-- CONTENT-002 Phase A: Editorial Content Models
-- Additive migration — no existing tables modified destructively
-- New tables: EditorialArticle, Topic, Tag, ArticleTag, ContentTransition, PlatformMediaAsset, ArticleProductLink, ContentEvent
-- Extended tables: User (add editorialRoles), NewsletterSubscriber (add 9 nullable fields)

-- ============================================================
-- 1. New tables (no FK dependencies first)
-- ============================================================

CREATE TABLE "Topic" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "parentId" TEXT,
    "color" TEXT,
    "icon" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Topic_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Topic_slug_key" ON "Topic"("slug");
CREATE INDEX "Topic_parentId_sortOrder_idx" ON "Topic"("parentId", "sortOrder");

CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");
CREATE UNIQUE INDEX "Tag_slug_key" ON "Tag"("slug");

CREATE TABLE "PlatformMediaAsset" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "altText" TEXT,
    "caption" TEXT,
    "attribution" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "durationSec" INTEGER,
    "thumbnailKey" TEXT,
    "sizeBytes" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "tags" TEXT[],
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "uploadedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PlatformMediaAsset_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PlatformMediaAsset_type_createdAt_idx" ON "PlatformMediaAsset"("type", "createdAt");

CREATE TABLE "ContentEvent" (
    "id" TEXT NOT NULL,
    "articleId" TEXT,
    "eventType" TEXT NOT NULL,
    "metadata" JSONB,
    "sessionId" TEXT,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "refCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ContentEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ContentEvent_articleId_eventType_createdAt_idx" ON "ContentEvent"("articleId", "eventType", "createdAt");
CREATE INDEX "ContentEvent_eventType_createdAt_idx" ON "ContentEvent"("eventType", "createdAt");
CREATE INDEX "ContentEvent_sessionId_createdAt_idx" ON "ContentEvent"("sessionId", "createdAt");

-- ============================================================
-- 2. EditorialArticle (FK to User and Topic)
-- ============================================================

CREATE TABLE "EditorialArticle" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT,
    "body" TEXT NOT NULL,
    "bodyFormat" TEXT NOT NULL DEFAULT 'MARKDOWN',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "authorId" TEXT,
    "reviewerId" TEXT,
    "publisherId" TEXT,
    "publishedAt" TIMESTAMP(3),
    "scheduledAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "coverImageId" TEXT,
    "topicId" TEXT,
    "tags" TEXT[],
    "seoMeta" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "EditorialArticle_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EditorialArticle_slug_key" ON "EditorialArticle"("slug");
CREATE INDEX "EditorialArticle_status_publishedAt_idx" ON "EditorialArticle"("status", "publishedAt");
CREATE INDEX "EditorialArticle_type_status_idx" ON "EditorialArticle"("type", "status");
CREATE INDEX "EditorialArticle_topicId_status_idx" ON "EditorialArticle"("topicId", "status");
CREATE INDEX "EditorialArticle_publishedAt_idx" ON "EditorialArticle"("publishedAt");

ALTER TABLE "EditorialArticle" ADD CONSTRAINT "EditorialArticle_authorId_fkey"
    FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "EditorialArticle" ADD CONSTRAINT "EditorialArticle_reviewerId_fkey"
    FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "EditorialArticle" ADD CONSTRAINT "EditorialArticle_publisherId_fkey"
    FOREIGN KEY ("publisherId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "EditorialArticle" ADD CONSTRAINT "EditorialArticle_topicId_fkey"
    FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ============================================================
-- 3. Join/dependent tables
-- ============================================================

CREATE TABLE "ArticleTag" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ArticleTag_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ArticleTag_articleId_tagId_key" ON "ArticleTag"("articleId", "tagId");
CREATE INDEX "ArticleTag_tagId_idx" ON "ArticleTag"("tagId");

ALTER TABLE "ArticleTag" ADD CONSTRAINT "ArticleTag_articleId_fkey"
    FOREIGN KEY ("articleId") REFERENCES "EditorialArticle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ArticleTag" ADD CONSTRAINT "ArticleTag_tagId_fkey"
    FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ContentTransition" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "fromStatus" TEXT NOT NULL,
    "toStatus" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ContentTransition_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ContentTransition_articleId_createdAt_idx" ON "ContentTransition"("articleId", "createdAt");
CREATE INDEX "ContentTransition_toStatus_createdAt_idx" ON "ContentTransition"("toStatus", "createdAt");

ALTER TABLE "ContentTransition" ADD CONSTRAINT "ContentTransition_articleId_fkey"
    FOREIGN KEY ("articleId") REFERENCES "EditorialArticle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ArticleProductLink" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "productKey" TEXT NOT NULL,
    "productLabel" TEXT,
    "linkType" TEXT NOT NULL DEFAULT 'MENTIONED',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ArticleProductLink_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ArticleProductLink_articleId_productKey_key" ON "ArticleProductLink"("articleId", "productKey");
CREATE INDEX "ArticleProductLink_productKey_idx" ON "ArticleProductLink"("productKey");

ALTER TABLE "ArticleProductLink" ADD CONSTRAINT "ArticleProductLink_articleId_fkey"
    FOREIGN KEY ("articleId") REFERENCES "EditorialArticle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================================
-- 4. Topic self-reference
-- ============================================================

ALTER TABLE "Topic" ADD CONSTRAINT "Topic_parentId_fkey"
    FOREIGN KEY ("parentId") REFERENCES "Topic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ============================================================
-- 5. Extend existing tables (additive)
-- ============================================================

ALTER TABLE "User" ADD COLUMN "editorialRoles" TEXT[] DEFAULT '{}';

ALTER TABLE "NewsletterSubscriber" ADD COLUMN "name" TEXT;
ALTER TABLE "NewsletterSubscriber" ADD COLUMN "email" TEXT;
ALTER TABLE "NewsletterSubscriber" ADD COLUMN "phone" TEXT;
ALTER TABLE "NewsletterSubscriber" ADD COLUMN "consentAt" TIMESTAMP(3);
ALTER TABLE "NewsletterSubscriber" ADD COLUMN "consentSource" TEXT;
ALTER TABLE "NewsletterSubscriber" ADD COLUMN "preferences" JSONB;
ALTER TABLE "NewsletterSubscriber" ADD COLUMN "lastEngagedAt" TIMESTAMP(3);
ALTER TABLE "NewsletterSubscriber" ADD COLUMN "bounceCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "NewsletterSubscriber" ADD COLUMN "suppressedAt" TIMESTAMP(3);
