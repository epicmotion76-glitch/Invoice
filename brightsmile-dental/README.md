# BrightSmile Dental Clinic landing page

A single-page, appointment-focused landing page built with Vite, React, TypeScript,
Motion (scroll reveals) and Embla Carousel (smile gallery). The production build is
prerendered to static HTML, so it can be hosted on any static host.

## Commands

```bash
npm install
npm run dev        # local development
npm run build      # typecheck, build and prerender to dist/
npm run serve      # build, then preview the production output
```

## Editing content

| What | Where |
| --- | --- |
| Clinic name, phone, email, address, hours, rating, social links | `src/content/site.ts` (`clinic`) |
| Services, benefits, reasons, stats, testimonials, gallery cases | `src/content/site.ts` |
| Treatment dropdown options | `src/content/site.ts` (`treatmentOptions`) |
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

- Number and fallback chat message: `clinic.whatsapp` in `src/content/site.ts`
  (digits only, international format, e.g. `351920008205`).
- Message layout: `src/lib/bookingMessage.ts`. Closed days and booking window:
  `isClosedDay` / `bookingWindow` in `src/components/appointment/validation.ts`.

Nothing is stored or sent by the website itself.

## Structure

```
src/
  content/        site copy and images (edit these)
  components/
    layout/       Header, Footer, MobileCtaBar
    sections/     Hero, TrustStrip, Services, WhyUs, Testimonials, FinalCta
    gallery/      SmileGallery, BeforeAfter, useCarouselAutoplay
    appointment/  Appointment section, form, Field, validation, context
    booking/      BookingDialog, Calendar
    ui/           BookVisitLink, WhatsAppIcon, Reveal, SmartImage, Logo, Stars, HoursList
  hooks/          useScrollSpy, usePrefersReducedMotion
  lib/            WhatsApp links, lazy motion features
scripts/prerender.mjs
```
