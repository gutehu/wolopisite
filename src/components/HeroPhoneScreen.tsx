"use client";

import { useState, useRef, useEffect } from "react";
import { AppPreviewCarousel } from "./AppPreviewCarousel";

const DEMO_VIDEO_SRC = "/assets/videos/Wolopi_demo.mp4";
const POSTER_SRC = "/app-preview/dashboard-velocity.png";

export function HeroPhoneScreen() {
  const [videoFailed, setVideoFailed] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const handleError = () => setVideoFailed(true);
    v.addEventListener("error", handleError);
    return () => v.removeEventListener("error", handleError);
  }, []);

  if (videoFailed) {
    return <AppPreviewCarousel />;
  }

  return (
    <>
      <video
        ref={videoRef}
        src={DEMO_VIDEO_SRC}
        poster={POSTER_SRC}
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 h-full w-full object-cover object-center rounded-xl"
        style={{ objectFit: "cover" }}
        aria-label="Démonstration Wolopi — Arena, Performance, Hub Pro"
      />
      {/* Reflet / ombre interne pour effet écran réaliste */}
      <div
        className="pointer-events-none absolute inset-0 rounded-xl"
        style={{
          boxShadow: "inset 0 1px 2px rgba(255,255,255,0.08), inset 0 -1px 1px rgba(0,0,0,0.15)",
        }}
        aria-hidden
      />
    </>
  );
}
