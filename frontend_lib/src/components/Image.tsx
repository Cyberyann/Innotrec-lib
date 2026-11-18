import { useState, type ImgHTMLAttributes, type ReactNode } from 'react';
import { cx } from './cx';

export interface ImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  /** Required for accessibility; use `alt=""` for purely decorative images. */
  alt: string;
  /** Displayed when `src` fails to load. */
  fallbackSrc?: string;
  /** CSS aspect-ratio, e.g. `16/9`. */
  aspectRatio?: string;
  fit?: 'cover' | 'contain';
  rounded?: boolean | 'full';
  caption?: ReactNode;
}

export function Image({
  src,
  alt,
  fallbackSrc,
  aspectRatio,
  fit = 'cover',
  rounded = false,
  caption,
  className,
  style,
  loading = 'lazy',
  onError,
  ...rest
}: ImageProps) {
  const [failed, setFailed] = useState(false);
  const img = (
    <img
      src={failed && fallbackSrc ? fallbackSrc : src}
      alt={alt}
      loading={loading}
      decoding="async"
      className={cx(
        'iu-image',
        rounded === true && 'iu-image--rounded',
        rounded === 'full' && 'iu-image--circle',
        className,
      )}
      style={{ aspectRatio, objectFit: fit, ...style }}
      onError={(event) => {
        if (!failed) setFailed(true);
        onError?.(event);
      }}
      {...rest}
    />
  );
  if (!caption) return img;
  return (
    <figure className="iu-figure">
      {img}
      <figcaption>{caption}</figcaption>
    </figure>
  );
}
