import {
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
} from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { BeforeAfterImages } from "../../content/images";
import { SmartImage } from "../ui/SmartImage";

type BeforeAfterProps = {
  images: BeforeAfterImages;
  label: string;
  sizes: string;
  onInteract?: () => void;
};

const clamp = (value: number) => Math.min(100, Math.max(0, value));

/**
 * Draggable before/after comparison. The handle is a keyboard-operable slider;
 * clicking anywhere on the photo moves the divider there.
 */
export function BeforeAfter({ images, label, sizes, onInteract }: BeforeAfterProps) {
  const [position, setPosition] = useState(50);
  const [dragging, setDragging] = useState(false);
  const [snapping, setSnapping] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  const positionAt = (clientX: number) => {
    const rect = frameRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return position;
    return clamp(((clientX - rect.left) / rect.width) * 100);
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    draggingRef.current = true;
    setDragging(true);
    setSnapping(false);
    setPosition(positionAt(event.clientX));
    onInteract?.();
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (draggingRef.current) setPosition(positionAt(event.clientX));
  };

  const endDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    draggingRef.current = false;
    setDragging(false);
  };

  const onFrameClick = (event: MouseEvent<HTMLDivElement>) => {
    if ((event.target as Element).closest("[data-compare-handle]")) return;
    setSnapping(true);
    setPosition(positionAt(event.clientX));
    onInteract?.();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = event.shiftKey ? 10 : 5;
    const next: Record<string, number> = {
      ArrowLeft: position - step,
      ArrowDown: position - step,
      ArrowRight: position + step,
      ArrowUp: position + step,
      PageDown: position - 20,
      PageUp: position + 20,
      Home: 0,
      End: 100,
    };
    if (!(event.key in next)) return;

    // Keep arrow keys from also changing the carousel slide.
    event.preventDefault();
    event.stopPropagation();
    setSnapping(true);
    setPosition(clamp(next[event.key]));
    onInteract?.();
  };

  const rounded = Math.round(position);
  const className = ["compare", dragging && "is-dragging", snapping && "is-snapping"].filter(Boolean).join(" ");

  return (
    <div
      ref={frameRef}
      className={className}
      style={{ "--pos": `${position}%` } as CSSProperties}
      onClick={onFrameClick}
    >
      <SmartImage image={images.after} sizes={sizes} className="compare__img" />
      <div className="compare__before">
        <SmartImage
          image={images.before}
          sizes={sizes}
          className="compare__img"
          style={images.beforeFilter ? { filter: images.beforeFilter } : undefined}
        />
      </div>

      <span className="compare__tag compare__tag--before" style={{ opacity: position < 14 ? 0 : 1 }} aria-hidden="true">
        Before
      </span>
      <span className="compare__tag compare__tag--after" style={{ opacity: position > 86 ? 0 : 1 }} aria-hidden="true">
        After
      </span>

      <div
        className="compare__handle"
        data-compare-handle=""
        role="slider"
        tabIndex={0}
        aria-label={`Before and after comparison: ${label}`}
        aria-orientation="horizontal"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={rounded}
        aria-valuetext={`${rounded}% before, ${100 - rounded}% after`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onKeyDown={onKeyDown}
      >
        <span className="compare__line" aria-hidden="true" />
        <span className="compare__knob" aria-hidden="true">
          <ChevronLeft />
          <ChevronRight />
        </span>
      </div>
    </div>
  );
}
