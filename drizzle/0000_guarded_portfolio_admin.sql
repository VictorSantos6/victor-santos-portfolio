CREATE TABLE `portfolio_revisions` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `status` text NOT NULL CHECK (`status` IN ('draft', 'published')),
  `content_json` text NOT NULL,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL,
  `published_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_portfolio_one_draft`
ON `portfolio_revisions` (`status`)
WHERE `status` = 'draft';
--> statement-breakpoint
CREATE INDEX `idx_portfolio_published`
ON `portfolio_revisions` (`status`, `published_at` DESC, `id` DESC);
--> statement-breakpoint
CREATE TABLE `admin_login_attempts` (
  `fingerprint` text PRIMARY KEY NOT NULL,
  `window_started` integer NOT NULL,
  `failed_count` integer NOT NULL DEFAULT 0,
  `locked_until` integer NOT NULL DEFAULT 0
);
--> statement-breakpoint
PRAGMA optimize;
