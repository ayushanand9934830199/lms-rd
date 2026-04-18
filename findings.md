# 🔍 findings.md — Research & Discoveries
> **Last Updated:** 2026-04-18

---

## Stack Compatibility Notes

- **Next.js 14 + Supabase**: SSR with App Router requires `@supabase/ssr` package (not legacy `@supabase/auth-helpers-nextjs`). Server Components use `createServerClient`, Client Components use `createBrowserClient`.
- **Plyr.js + Next.js**: Plyr must be loaded client-side only (`dynamic` import with `ssr: false`). Wrap in a `'use client'` component.
- **Tiptap + Next.js**: Same — `'use client'` required for editor. Rendering stored Tiptap JSON for display uses `@tiptap/react` `generateHTML` which CAN run server-side.
- **@react-pdf/renderer**: Server-side only. Use in a Route Handler (not Server Component directly) to stream PDF bytes.
- **shadcn/ui**: Must use `npx shadcn@latest init` (not `shadcn-ui` — deprecated package name).
- **@dnd-kit/core**: Client-side only. Wrap drag-and-drop UI in 'use client' components.

## Supabase Realtime
- Requires `supabase.channel()` API in client components.
- Notifications subscription: `postgres_changes` event on `notifications` table filtered by `user_id = auth.uid()`.
- Must call `.subscribe()` and clean up on component unmount.

## Certificate PDF Generation
- Generate in `/app/api/certificates/generate/route.ts` (Route Handler).
- Use `renderToBuffer` from `@react-pdf/renderer`.
- Upload buffer to Supabase Storage `certificates` bucket.
- Insert row into `certificates` table.
- Send email via Resend with PDF as attachment.

## Job Expiry Cron
- Supabase Edge Functions support cron triggers via `pg_cron` or Supabase scheduled functions.
- Alternatively: use Vercel Cron Jobs hitting a protected API route.

## Slug Generation
- Use `slugify` npm package: `slugify(title, { lower: true, strict: true })`
- Check uniqueness against DB before saving; append `-2`, `-3` etc. if collision.

---

## Constraints Discovered

_(Will be populated as we build.)_

---

## Tool-Level Learnings (Self-Annealing)

| Tool | Error | Root Cause | Fix Applied | Date |
|------|-------|------------|-------------|------|
| —    | —     | —          | —           | —    |
