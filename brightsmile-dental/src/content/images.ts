/**
 * All photography used on the page lives here so it can be swapped in one place.
 *
 * Images are placeholders served by the Unsplash image CDN, which resizes and
 * converts to AVIF/WebP on the fly. To use your own photos, replace an entry with
 * `{ src: "/images/hero.jpg", srcSet: "", alt, width, height }` (files in /public).
 */

export type SiteImage = {
  src: string;
  srcSet: string;
  alt: string;
  width: number;
  height: number;
};

export type BeforeAfterImages = {
  before: SiteImage;
  after: SiteImage;
  /**
   * Demo only: the sample cases reuse a single photo and tint the "before" half.
   * Remove this once you supply real, consented before/after clinical photos.
   */
  beforeFilter?: string;
};

type Rect = [x: number, y: number, width: number, height: number];

const WIDTHS = [480, 768, 1080, 1440, 1920];

function unsplash(photoId: string, size: [number, number], alt: string, rect?: Rect): SiteImage {
  const [fullWidth, fullHeight] = size;
  const width = rect ? Math.round(fullWidth * rect[2]) : fullWidth;
  const height = rect ? Math.round(fullHeight * rect[3]) : fullHeight;
  const crop = rect ? `&rect=${rect.join(",")}` : "";
  const url = (w: number) =>
    `https://images.unsplash.com/photo-${photoId}?auto=format&fit=max&q=72&w=${w}${crop}`;
  const widths = WIDTHS.filter((w) => w <= width);

  return {
    src: url(Math.min(1080, width)),
    srcSet: widths.map((w) => `${url(w)} ${w}w`).join(", "),
    alt,
    width,
    height,
  };
}

const DULL = "saturate(0.72) sepia(0.28) brightness(0.94) contrast(0.92)";
const STAINED = "sepia(0.42) saturate(1.05) brightness(0.9) contrast(0.9)";

function sampleCase(photo: SiteImage, treatment: string, beforeFilter: string): BeforeAfterImages {
  return {
    after: { ...photo, alt: `Close-up of a smile after ${treatment}` },
    before: { ...photo, alt: `Close-up of the same smile before ${treatment}` },
    beforeFilter,
  };
}

export const images = {
  hero: unsplash(
    "1606811841689-23dfddce3e95",
    [4455, 3341],
    "A dentist talks a relaxed patient through her treatment plan on an overhead screen in a bright, modern clinic",
  ),
  clinicRoom: unsplash(
    "1629909613654-28e377c37b09",
    [5472, 3658],
    "A calm, spotless treatment room with a modern dental chair and soft natural light",
  ),
  digitalScan: unsplash(
    "1600170311833-c2cf5280ce49",
    [5184, 3456],
    "A clinician reviews a 3D digital scan of a patient's teeth on a tablet",
  ),
  gallery: {
    whitening: sampleCase(
      unsplash("1494790108377-be9c29b29330", [3744, 5616], "", [0.26, 0.305, 0.44, 0.22]),
      "professional teeth whitening",
      STAINED,
    ),
    veneers: sampleCase(
      unsplash("1507003211169-0a1dd7228f2d", [3569, 5354], "", [0.24, 0.375, 0.46, 0.23]),
      "porcelain veneers",
      DULL,
    ),
    aligners: sampleCase(
      unsplash("1609840114035-3c981b782dfe", [5472, 3648], ""),
      "clear aligner treatment",
      DULL,
    ),
    implants: sampleCase(
      unsplash("1580489944761-15a19d654956", [3974, 5000], "", [0.31, 0.52, 0.36, 0.215]),
      "a dental implant",
      DULL,
    ),
    makeover: sampleCase(
      unsplash("1611432579699-484f7990b127", [5409, 3606], "", [0.39, 0.36, 0.2, 0.225]),
      "a complete smile makeover",
      STAINED,
    ),
    bonding: sampleCase(
      unsplash("1622253692010-333f2da6031d", [3582, 4478], "", [0.344, 0.234, 0.28, 0.168]),
      "composite bonding",
      DULL,
    ),
  },
} satisfies Record<string, unknown>;
