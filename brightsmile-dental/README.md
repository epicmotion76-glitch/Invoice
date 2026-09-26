# BrightSmile Dental Clinic landing page

A single-page, appointment-focused landing page built with Vite, React, TypeScript,
Motion (scroll reveals) and Embla Carousel (smile gallery). The production build is
prerendered to static HTML. The page itself can be hosted on any static host; the AI
receptionist's `/api/chat` endpoint runs as a Vercel Function (see below).

## Commands

```bash
npm install
npm run dev        # local development (also serves /api/chat)
npm run build      # typecheck, build and prerender to dist/
npm run serve      # build, then preview the production output
npm test           # AI receptionist unit and integration tests (Vitest)
```

## Editing content

| What | Where |
| --- | --- |
| Clinic name, phone, email, address, hours, rating, social links | `src/content/clinic.ts` (`clinic`) |
| Services, treatment dropdown options | `src/content/clinic.ts` |
| Benefits, reasons, stats, testimonials, gallery cases | `src/content/site.ts` |
| Facts the AI receptionist may share | `src/content/clinicKnowledge.ts` |
| Photos | `src/content/images.ts` |
| Colours, fonts, radii, shadows | `src/styles/tokens.css` |

The street address and patient reviews are sample content and must be replaced
before launch. The privacy policy and social links point to `#` placeholders.

### Photos

Photos are Unsplash placeholders delivered through its image CDN (auto WebP/AVIF,
responsive `srcset`). To use your own, put files in `public/images/` and replace the
entries in `src/content/images.ts` with `{ src, srcSet, alt, width, height }`.

The gallery's "before" images are the same photo with a CSS tint (`beforeFilter`).
Replace each case with real, consented before/after photos and remove
`beforeFilter`. Avoid anything that identifies a patient.

## Bookings via WhatsApp

Every **Book Your Visit** button opens a booking dialog with Name, Phone and a
calendar (past days, Sundays and dates more than 6 months ahead can't be picked).
**Send on WhatsApp** opens a chat with the clinic containing:

```
Name = Ana Ferreira
Phone = +351 912 345 678
Date = Tuesday, 15 September 2026
```

The full appointment form uses the same calendar and message style, adding
`Email`, `Treatment` and `Message` lines. The patient presses Send in WhatsApp to
deliver it.

- Number and fallback chat message: `clinic.whatsapp` in `src/content/clinic.ts`
  (digits only, international format, e.g. `351920008205`).
- Message layout: `src/lib/bookingMessage.ts`. Closed days and booking window:
  `isClosedDay` / `bookingWindow` in `src/components/appointment/validation.ts`.

Nothing is stored or sent by the website itself.

## AI receptionist

A floating **Ask BrightSmile AI** chat (bottom right) answers clinic questions, suggests the
right service, collects an appointment request conversationally and hands it to reception on
WhatsApp, reusing the helpers above. It is a receptionist, not a dentist: it doesn't diagnose,
recommend medication or confirm bookings.

- **Setup:** add `AI_API_KEY` (an Anthropic or Google Gemini API key) to the Vercel project's environment
  variables, and to `.env.local` for local development. `.env.example` lists the optional
  settings. Without a key, emergency guidance and reception hand-off still work and other
  questions get a "temporarily unavailable" reply with the clinic's contact details.
- **Flow:** browser (`src/components/ai-receptionist/`) → `POST /api/chat` (`api/chat.ts`) →
  `server/receptionist/handler.ts`. Before any model call, the handler answers possible
  emergencies (fixed "call 112" guidance), attempts to extract its instructions, and explicit
  requests for reception. Everything else goes to Claude with four server-side tools: clinic
  information, appointment updates (validated with the booking form's rules), WhatsApp
  preparation, and reception hand-off. Replies stream back as newline-delimited JSON.
  The model is Claude or Gemini, depending on `AI_PROVIDER` / the key.
- **Knowledge:** only `src/content/clinic.ts` and `src/content/clinicKnowledge.ts`. Anything not
  listed there (prices, insurance, staff) gets "I don't have confirmed information". To move to
  RAG later, implement `KnowledgeSource` in `server/receptionist/knowledge.ts`.
- **Prompt and safety rules:** `server/receptionist/prompt.ts` and `safety.ts` (server-only).
- **Providers:** `server/receptionist/anthropic.ts` (Claude) and `gemini.ts` (Google Gemini, via
  REST), both behind the `ReceptionistModel` interface in `model.ts`.
- **Privacy:** conversations live only in the open page's memory; they are not stored, and the
  server logs only error types. Analytics events (`src/components/ai-receptionist/analytics.ts`)
  carry no message text.
- **Languages:** English and European Portuguese. UI copy is in
  `src/components/ai-receptionist/i18n.ts`.

Node runs the server-side modules as ES modules without a bundler, so relative imports in
`api/`, `server/` and the shared files they use carry `.js` extensions.

## Structure

```
src/
  content/        site copy, clinic facts, AI knowledge and images (edit these)
  components/
    layout/       Header, Footer, MobileCtaBar
    sections/     Hero, TrustStrip, Services, WhyUs, Testimonials, FinalCta
    gallery/      SmileGallery, BeforeAfter, useCarouselAutoplay
    appointment/  Appointment section, form, Field, validation, context
    booking/      BookingDialog, Calendar
    ui/           BookVisitLink, WhatsAppIcon, Reveal, SmartImage, Logo, Stars, HoursList
    ai-receptionist/  chat widget: launcher, window, messages, cards, state, i18n, analytics
  hooks/          useScrollSpy, usePrefersReducedMotion
  lib/            WhatsApp links, lazy motion features
    receptionist/ appointment rules and chat protocol shared with the server
api/chat.ts       Vercel Function entry for the AI receptionist
server/receptionist/  request handler, prompt, tools, safety triage, model provider
tests/receptionist/   Vitest suites
scripts/prerender.mjs
```
