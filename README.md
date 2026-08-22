# Sazanchik CITY

QR-меню + мини-POS ресторана «Сазанчик CITY» (Ташкент): гостевое меню на
4 языках, заказы со стола по подписанному QR, доски официанта и цехов
(SSE-realtime), счета столов, касса, финансы, склад с рецептами, зарплаты,
ТВ-экран и печатные материалы (люкс-меню, QR-карточки для типографии).

Архитектура, контуры и известные ограничения — в [docs/overview.md](docs/overview.md).

## Getting Started

```bash
cp .env.example .env.local   # заполнить значения
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` / `POSTGRES_URL` | yes | Pooled Postgres connection for runtime queries. |
| `DATABASE_URL_UNPOOLED` / `POSTGRES_URL_NON_POOLING` | yes (realtime) | Direct connection used by the waiter SSE stream (`LISTEN/NOTIFY`). |
| `SESSION_SECRET` | yes | Signs session JWTs and table QR HMAC tokens. |
| `ADMIN_PASSWORD` | yes | Manager (admin) login password. |
| `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID` | no | Order / call / reservation / error notifications to Telegram. |
| `BLOB_READ_WRITE_TOKEN` | yes (photos) | Vercel Blob for dish photo uploads. |
| `NEXT_PUBLIC_SITE_URL` | no | Public site URL for QR links, SEO, sitemap (defaults to sazanchik.vercel.app). |
| `REQUIRE_TABLE_TOKEN` | no (default off) | **Strict-QR mode.** When `1`/`true`, dine-in orders and waiter calls must carry a valid signed QR token — a bare `?table=N` is rejected. Turn on once every physical QR is a signed one, to fully close table-spoofing. |

## Testing

```bash
npm test          # run the unit suite once (vitest)
npm run test:watch
npm run lint      # eslint
npx tsc --noEmit  # typecheck
```

CI (`.github/workflows/ci.yml`) runs lint → typecheck → tests on every push and PR.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
