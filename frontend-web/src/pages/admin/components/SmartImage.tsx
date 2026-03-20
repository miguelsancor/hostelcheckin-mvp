import React, { memo, useEffect, useState } from "react";
import { imageFallbackText, imageShell, imageSkeleton } from "../admin.styles";

type Props = {
  src: string;
  alt: string;
  style: React.CSSProperties;
  onClick?: () => void;
  eager?: boolean;
};

export const SmartImage = memo(function SmartImage({
  src,
  alt,
  style,
  onClick,
  eager = false,
}: Props) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setLoaded(false);
    setFailed(false);
  }, [src]);

  if (failed) {
    return (
      <div style={{ ...imageShell, ...style }}>
        <div style={imageFallbackText}>Sin vista previa</div>
      </div>
    );
  }

  return (
    <div style={{ ...imageShell, ...style }}>
      {!loaded && <div style={imageSkeleton} />}
      <img
        src={src}
        alt={alt}
        onClick={onClick}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={eager ? "high" : "low"}
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        style={{
          ...style,
          opacity: loaded ? 1 : 0,
          transition: "opacity 180ms ease",
          position: "relative",
          zIndex: 2,
        }}
      />
    </div>
  );
});