import { useState } from "react";

const ERROR_IMG_SRC =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4KCg==";

type Props = React.ImgHTMLAttributes<HTMLImageElement>;

/**
 * Image that shows a soft pulsing skeleton while loading and a neutral
 * placeholder if the source fails. Keeps the feed from flashing empty
 * boxes during screen transitions.
 *
 * The skeleton is absolutely positioned, so the nearest ancestor should be
 * `relative` (the item-card containers already are). The <img> keeps the
 * caller's className for sizing, so layout is unaffected.
 */
export default function SmartImage({ className, src, alt, onLoad, onError, ...rest }: Props) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  return (
    <>
      {!loaded && (
        <span className="absolute inset-0 z-0 animate-pulse bg-[#E8DDD0]" aria-hidden />
      )}
      <img
        src={errored ? ERROR_IMG_SRC : src}
        alt={alt}
        className={`${className ?? ""} relative z-[1] ${
          loaded ? "opacity-100" : "opacity-0"
        } transition-opacity duration-500`}
        onLoad={(e) => {
          setLoaded(true);
          onLoad?.(e);
        }}
        onError={(e) => {
          setErrored(true);
          setLoaded(true);
          onError?.(e);
        }}
        {...rest}
      />
    </>
  );
}
