import { useCallback, useEffect, useState, type RefObject } from "react";
import type { EmblaCarouselType } from "embla-carousel";

type Options = {
  delay: number;
  reducedMotion: boolean;
  /** Hovering, focusing or scrolling this element out of view pauses playback. */
  pauseTargetRef: RefObject<HTMLElement | null>;
};

/**
 * Gentle autoplay that never runs for visitors who prefer reduced motion,
 * pauses while the carousel is hovered, focused, off-screen or in a hidden tab,
 * and stops for good once the visitor interacts (until they press play again).
 */
export function useCarouselAutoplay(api: EmblaCarouselType | undefined, { delay, reducedMotion, pauseTargetRef }: Options) {
  const [playing, setPlaying] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [inView, setInView] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);

  useEffect(() => {
    setPlaying(!reducedMotion);
  }, [reducedMotion]);

  useEffect(() => {
    const target = pauseTargetRef.current;
    if (!target) return;

    const onEnter = () => setHovered(true);
    const onLeave = () => setHovered(false);
    const onFocusIn = () => setFocused(true);
    const onFocusOut = (event: FocusEvent) => {
      if (!target.contains(event.relatedTarget as Node | null)) setFocused(false);
    };
    const onVisibility = () => setPageVisible(document.visibilityState === "visible");
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.35 });

    target.addEventListener("pointerenter", onEnter);
    target.addEventListener("pointerleave", onLeave);
    target.addEventListener("focusin", onFocusIn);
    target.addEventListener("focusout", onFocusOut);
    document.addEventListener("visibilitychange", onVisibility);
    observer.observe(target);

    return () => {
      target.removeEventListener("pointerenter", onEnter);
      target.removeEventListener("pointerleave", onLeave);
      target.removeEventListener("focusin", onFocusIn);
      target.removeEventListener("focusout", onFocusOut);
      document.removeEventListener("visibilitychange", onVisibility);
      observer.disconnect();
    };
  }, [pauseTargetRef]);

  const running = Boolean(api) && playing && !hovered && !focused && inView && pageVisible;

  useEffect(() => {
    if (!running || !api) return;

    let timer = window.setTimeout(() => api.scrollNext(), delay);
    // Any slide change (including manual ones) restarts the countdown.
    const restart = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => api.scrollNext(), delay);
    };
    api.on("select", restart);
    return () => {
      window.clearTimeout(timer);
      api.off("select", restart);
    };
  }, [running, api, delay]);

  const stop = useCallback(() => setPlaying(false), []);
  const play = useCallback(() => setPlaying(true), []);

  return { playing, stop, play };
}
