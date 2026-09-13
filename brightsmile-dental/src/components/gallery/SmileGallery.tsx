import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import useEmblaCarousel from "embla-carousel-react";
import type { EmblaOptionsType } from "embla-carousel";
import { ArrowLeft, ArrowRight, Pause, Play } from "lucide-react";
import { galleryItems } from "../../content/site";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";
import { Reveal } from "../ui/Reveal";
import { BeforeAfter } from "./BeforeAfter";
import { useCarouselAutoplay } from "./useCarouselAutoplay";
import "./SmileGallery.css";

const carouselOptions: EmblaOptionsType = {
  loop: true,
  align: "center",
  duration: 32,
  // Dragging the comparison handle must not swipe the carousel.
  watchDrag: (_api, event) => !(event.target instanceof Element && event.target.closest("[data-compare-handle]")),
};

const count = galleryItems.length;

export function SmileGallery() {
  const reducedMotion = usePrefersReducedMotion();
  const [viewportRef, api] = useEmblaCarousel(carouselOptions);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const slidesRef = useRef<HTMLDivElement>(null);
  const autoplay = useCarouselAutoplay(api, { delay: 6500, reducedMotion, pauseTargetRef: slidesRef });
  const { stop: stopAutoplay } = autoplay;

  useEffect(() => {
    if (!api) return;
    const onSelect = () => setSelectedIndex(api.selectedScrollSnap());
    onSelect();
    api.on("select", onSelect);
    api.on("reInit", onSelect);
    api.on("pointerDown", stopAutoplay);
    return () => {
      api.off("select", onSelect);
      api.off("reInit", onSelect);
      api.off("pointerDown", stopAutoplay);
    };
  }, [api, stopAutoplay]);

  const goTo = useCallback(
    (index: number) => {
      stopAutoplay();
      api?.scrollTo(index, reducedMotion);
    },
    [api, reducedMotion, stopAutoplay],
  );
  const goPrev = useCallback(() => {
    stopAutoplay();
    api?.scrollPrev(reducedMotion);
  }, [api, reducedMotion, stopAutoplay]);
  const goNext = useCallback(() => {
    stopAutoplay();
    api?.scrollNext(reducedMotion);
  }, [api, reducedMotion, stopAutoplay]);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      goPrev();
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      goNext();
    }
  };

  const current = galleryItems[selectedIndex];

  return (
    <section id="gallery" className="gallery section" aria-labelledby="gallery-title">
      <div className="container">
        <Reveal className="gallery__head">
          <div className="section-head">
            <p className="eyebrow eyebrow--light">Smile Gallery</p>
            <h2 id="gallery-title" className="section-title">
              Transformations that speak for themselves.
            </h2>
            <p className="section-lede">
              Drag the handle on each photo to compare before and after. Every plan is tailored, so your result will be
              uniquely yours.
            </p>
          </div>
        </Reveal>
      </div>

      <div
        className="carousel"
        role="region"
        aria-roledescription="carousel"
        aria-label="Before and after smile transformations"
        onKeyDown={onKeyDown}
      >
        <div className="carousel__viewport" ref={viewportRef}>
          <div className="carousel__track" ref={slidesRef}>
            {galleryItems.map((item, index) => {
              const selected = index === selectedIndex;
              return (
                <div
                  key={item.id}
                  className={`carousel__slide${selected ? " is-selected" : ""}`}
                  role="group"
                  aria-roledescription="slide"
                  aria-label={`${index + 1} of ${count}: ${item.treatment}`}
                  inert={!selected}
                >
                  <article className="case">
                    <BeforeAfter
                      images={item.images}
                      label={item.treatment}
                      sizes="(min-width: 900px) 640px, 92vw"
                      onInteract={stopAutoplay}
                    />
                    <div className="case__body">
                      <p className="case__count" aria-hidden="true">
                        {String(index + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
                      </p>
                      <h3 className="case__title">{item.treatment}</h3>
                      <p className="case__outcome">{item.outcome}</p>
                      <dl className="case__details">
                        {item.details.map((detail) => (
                          <div key={detail.label}>
                            <dt>{detail.label}</dt>
                            <dd>{detail.value}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  </article>
                </div>
              );
            })}
          </div>
        </div>

        <div className="container">
          <div className="carousel__controls">
            <button
              type="button"
              className="carousel__toggle"
              onClick={autoplay.playing ? autoplay.stop : autoplay.play}
              aria-label={autoplay.playing ? "Pause slideshow" : "Play slideshow"}
            >
              {autoplay.playing ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
              <span aria-hidden="true">{autoplay.playing ? "Pause" : "Play"}</span>
            </button>

            <div className="carousel__dots">
              {galleryItems.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  className="carousel__dot"
                  aria-label={`Show slide ${index + 1}: ${item.treatment}`}
                  aria-current={index === selectedIndex ? "true" : undefined}
                  onClick={() => goTo(index)}
                />
              ))}
            </div>

            <div className="carousel__arrows">
              <button type="button" className="carousel__arrow" onClick={goPrev} aria-label="Previous slide">
                <ArrowLeft aria-hidden="true" />
              </button>
              <button type="button" className="carousel__arrow" onClick={goNext} aria-label="Next slide">
                <ArrowRight aria-hidden="true" />
              </button>
            </div>
          </div>

          <p className="sr-only" aria-live={autoplay.playing ? "off" : "polite"} aria-atomic="true">
            Slide {selectedIndex + 1} of {count}: {current.treatment}
          </p>

          <p className="gallery__note">
            Illustrative sample images. Individual results vary and depend on a clinical assessment.
          </p>
        </div>
      </div>
    </section>
  );
}
