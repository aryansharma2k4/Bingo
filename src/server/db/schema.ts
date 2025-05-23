// Example model schema from the Drizzle docs
// https://orm.drizzle.team/docs/sql-schema-declaration

import { sql } from "drizzle-orm";
import { pgTable, text, timestamp, boolean, pgTableCreator, index } from "drizzle-orm/pg-core";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `Bingo_${name}`);

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

// Social content table to store generated social posts
export const socialContent = createTable(
  "social_content",
  (d) => ({
    id: d.serial().primaryKey(),
    userId: d.varchar({ length: 256 }).notNull(),
    platform: d.varchar({ length: 20 }).notNull(), // twitter, linkedin, facebook, instagram
    content: d.text().notNull(),
    imageUrl: d.text(),
    imageAltText: d.text(),
    status: d.varchar({ length: 20 }).default("draft").notNull(), // draft, published, scheduled
    scheduledFor: d.timestamp({ withTimezone: true }),
    publishedAt: d.timestamp({ withTimezone: true }),
    engagement: d.json(), // Store engagement metrics
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [
    index("social_content_user_id_idx").on(t.userId),
    index("social_content_platform_idx").on(t.platform),
    index("social_content_status_idx").on(t.status),
  ],
);

// Social content revision history
export const socialContentHistory = createTable(
  "social_content_history",
  (d) => ({
    id: d.serial().primaryKey(),
    contentId: d.integer().notNull().references(() => socialContent.id, { onDelete: "cascade" }),
    previousContent: d.text().notNull(),
    updatedContent: d.text().notNull(),
    updatePrompt: d.text(),
    modelUsed: d.varchar({ length: 20 }).notNull(), // gemini, deepseek, etc.
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    createdBy: d.varchar({ length: 256 }).notNull(),
  }),
  (t) => [
    index("social_content_history_content_id_idx").on(t.contentId),
  ],
);

// Social media image storage
export const socialImages = createTable(
  "social_image",
  (d) => ({
    id: d.serial().primaryKey(),
    contentId: d.integer().references(() => socialContent.id, { onDelete: "set null" }),
    userId: d.varchar({ length: 256 }).notNull(),
    imageUrl: d.text().notNull(),
    imageBase64: d.text().notNull(), // Add this field
    mimeType: d.varchar({ length: 50 }).notNull(), // Add this field
    altText: d.text(),
    size: d.varchar({ length: 20 }).notNull(), // square, portrait, landscape, twitter
    prompt: d.text(),
    style: d.varchar({ length: 100 }),
    modelUsed: d.varchar({ length: 20 }).notNull(), // gemini, etc.
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  }),
  (t) => [
    index("social_image_user_id_idx").on(t.userId),
    index("social_image_content_id_idx").on(t.contentId),
  ],
);

// Social account connections
export const socialAccounts = createTable(
  "social_account",
  (d) => ({
    id: d.serial().primaryKey(),
    userId: d.varchar({ length: 256 }).notNull().references(() => user.id, { onDelete: "cascade" }),
    platform: d.varchar({ length: 20 }).notNull(), // twitter, linkedin, facebook, instagram
    platformAccountId: d.varchar({ length: 256 }).notNull(),
    accessToken: d.text().notNull(),
    refreshToken: d.text(),
    tokenExpiresAt: d.timestamp({ withTimezone: true }),
    profileName: d.varchar({ length: 200 }),
    profileImage: d.text(),
    isActive: d.boolean().default(true).notNull(),
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [
    index("social_account_user_platform_idx").on(t.userId, t.platform),
  ],
);

// Store YouTube auth tokens
// Store Twitter auth tokens
export const twitterTokens = createTable("twitter_token", (d) => ({
  id: d.serial().primaryKey(),
  accessToken: d.text().notNull(),
  refreshToken: d.text(),
  expiryDate: d.timestamp().notNull(),
  userId: d.varchar({ length: 256 }).notNull(), // Link to your user system
  createdAt: d
    .timestamp({ withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
}));

// Store Twitter posts
export const twitterPosts = createTable(
  "twitter_post",
  (d) => ({
    id: d.serial().primaryKey(),
    tweetId: d.varchar({ length: 50 }).notNull(),
    twitterUserId: d.varchar({ length: 50 }).notNull(), // Twitter user ID
    content: d.text().notNull(),
    userId: d.varchar({ length: 256 }).notNull(),
    status: d.varchar({ length: 20 }).default("draft").notNull(),
    metrics: d.json(),
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [
    index("twitter_post_user_id_idx").on(t.userId),
    index("twitter_post_tweet_id_idx").on(t.tweetId),
    index("twitter_post_twitter_user_id_idx").on(t.twitterUserId), // Add index for twitterUserId
  ],
);

// Store Reddit auth tokens
export const linkedinTokens = createTable("linkedin_token", (d) => ({
  id: d.serial().primaryKey(),
  accessToken: d.text().notNull(),
  refreshToken: d.text(),
  expiryDate: d.timestamp().notNull(),
  userId: d.varchar({ length: 256 }).notNull(), // Link to your user system
  createdAt: d
    .timestamp({ withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
}));

// Store Reddit posts
export const linkedinPosts = createTable(
  "linkedin_post",
  (d) => ({
    id: d.serial().primaryKey(),
    redditId: d.varchar({ length: 50 }).notNull(),
    subreddit: d.varchar({ length: 100 }).notNull(),
    title: d.varchar({ length: 300 }).notNull(),
    content: d.text(),
    permalink: d.text(),
    userId: d.varchar({ length: 256 }).notNull(),
    status: d.varchar({ length: 20 }).default("draft").notNull(),
    metrics: d.json(),
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [
    index("reddit_post_user_id_idx").on(t.userId),
    index("reddit_post_reddit_id_idx").on(t.redditId),
    index("reddit_post_subreddit_idx").on(t.subreddit),
  ],
);

// Store YouTube auth tokens
export const youtubeTokens = createTable("youtube_token", (d) => ({
  id: d.serial().primaryKey(),
  accessToken: d.text().notNull(),
  refreshToken: d.text(),
  expiryDate: d.timestamp().notNull(),
  userId: d.varchar({ length: 256 }).notNull(), // Link to your user system
  createdAt: d
    .timestamp({ withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
}));

// Store video uploads
export const youtubeVideos = createTable(
  "youtube_video",
  (d) => ({
    id: d.serial().primaryKey(),
    youtubeId: d.varchar({ length: 50 }).notNull(),
    title: d.varchar({ length: 256 }).notNull(),
    description: d.text(),
    tags: d.json(),
    privacyStatus: d.varchar({ length: 20 }).default("private").notNull(),
    thumbnailUrl: d.text(),
    userId: d.varchar({ length: 256 }).notNull(), // Link to your user system
    status: d.varchar({ length: 20 }).default("uploaded").notNull(), // uploaded, processing, published, failed
    videoUrl: d.text(),
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [
    index("youtube_video_user_id_idx").on(t.userId),
    index("youtube_video_youtube_id_idx").on(t.youtubeId),
  ],
);

export const scheduledYoutubeVideos = createTable(
  "scheduled_youtube_video",
  (d) => ({
    id: d.serial().primaryKey(),
    userId: d.varchar({ length: 256 }).notNull(),
    title: d.varchar({ length: 256 }).notNull(),
    description: d.text(),
    tags: d.json(),
    privacyStatus: d.varchar({ length: 20 }).default("private").notNull(),
    thumbnailUrl: d.text(),
    videoUrl: d.text().notNull(), // URL to the video file to upload
    scheduleId: d.varchar({ length: 256 }), // QStash schedule ID
    scheduledFor: d.timestamp({ withTimezone: true }).notNull(),
    status: d.varchar({ length: 20 }).default("scheduled").notNull(), // scheduled, processing, completed, failed
    youtubeId: d.varchar({ length: 50 }), // Will be filled after successful upload
    uploadResult: d.json(), // Store the result of the upload operation
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [
    index("scheduled_youtube_video_user_id_idx").on(t.userId),
    index("scheduled_youtube_video_status_idx").on(t.status),
    index("scheduled_youtube_video_scheduled_for_idx").on(t.scheduledFor),
  ],
);

export const scheduledTweets = createTable(
  "scheduled_tweet",
  (d) => ({
    id: d.serial().primaryKey(),
    userId: d.varchar({ length: 256 }).notNull(), // Link to your user system
    content: d.text().notNull(), // Tweet content
    scheduledFor: d.timestamp({ withTimezone: true }).notNull(), // When to post
    status: d.varchar({ length: 20 }).default("scheduled").notNull(), // scheduled, processing, completed, failed
    tweetId: d.varchar({ length: 50 }), // ID of the posted tweet (after scheduled run)
    scheduleId: d.varchar({ length: 256 }), // QStash schedule ID
    postResult: d.json(), // Result from posting the tweet
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [
    index("scheduled_tweet_user_id_idx").on(t.userId),
    index("scheduled_tweet_status_idx").on(t.status),
    index("scheduled_tweet_scheduled_for_idx").on(t.scheduledFor),
  ],
);

export const scheduledLinkedinPosts = createTable(
  "scheduled_linkedin_post",
  (d) => ({
    id: d.serial().primaryKey(),
    userId: d.varchar({ length: 256 }).notNull(),
    content: d.text().notNull(),
    title: d.varchar({ length: 300 }),
    imageUrl: d.text(), // Optional image for the post
    scheduleId: d.varchar({ length: 256 }), // QStash schedule ID
    scheduledFor: d.timestamp({ withTimezone: true }).notNull(),
    status: d.varchar({ length: 20 }).default("scheduled").notNull(), // scheduled, processing, completed, failed
    linkedinPostId: d.varchar({ length: 100 }), // Will be filled after successful post
    postResult: d.json(), // Store the result of the LinkedIn post operation
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [
    index("scheduled_linkedin_post_user_id_idx").on(t.userId),
    index("scheduled_linkedin_post_status_idx").on(t.status),
    index("scheduled_linkedin_post_scheduled_for_idx").on(t.scheduledFor),
  ],
);