import type { CSSProperties } from "react";
import type { SiteImage } from "../../content/images";

type SmartImageProps = {
  image: SiteImage;
  sizes: string;
  /** Loads eagerly with high fetch priority. Use only for the hero image. */
  priority?: boolean;
  className?: string;
  style?: CSSProperties;
};

export function SmartImage({ image, sizes, priority = false, className, style }: SmartImageProps) {
  return (
    <img
      src={image.src}
      srcSet={image.srcSet || undefined}
      sizes={image.srcSet ? sizes : undefined}
      alt={image.alt}
      width={image.width}
      height={image.height}
      loading={priority ? "eager" : "lazy"}
      decoding={priority ? "auto" : "async"}
      fetchPriority={priority ? "high" : undefined}
      draggable={false}
      className={className}
      style={style}
    />
  );
}
