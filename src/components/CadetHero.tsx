import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface CadetHeroProps {
  onInteract?: () => void;
  className?: string;
  children?: React.ReactNode;
}

const MEDIA = {
  plate: "https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/a194141a-44ba-44bb-8372-e6720af994ca.jpg",
  clip: "https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/e1b48476-24ab-456a-bb12-13e63bc60973.mp4",
  helmet: "https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/e8c78660-4497-41b9-82ae-a4738a5edd11.jpg",
};

export const CadetHero: React.FC<CadetHeroProps> = ({ className = "", children }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [helmetOpen, setHelmetOpen] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);

  // Custom Cursor
  const [cursorPos, setCursorPos] = useState({ x: -100, y: -100 });
  const [ringPos, setRingPos] = useState({ x: -100, y: -100 });
  const [isPointerInside, setIsPointerInside] = useState(false);

  // Head tracking state
  const stateRef = useRef({
    targetTime: 2.5,
    currentTime: 2.5,
    duration: 5.04,
    lastMoveTime: Date.now(),
    rafId: 0,
    blobUrl: "",
  });

  // Pre-fetch video as blob for instantaneous seeking without lag
  useEffect(() => {
    let active = true;
    fetch(MEDIA.clip)
      .then((res) => {
        if (!res.ok) throw new Error("Fetch failed");
        return res.blob();
      })
      .then((blob) => {
        if (!active) return;
        const url = URL.createObjectURL(blob);
        stateRef.current.blobUrl = url;
        if (videoRef.current) {
          videoRef.current.src = url;
        }
      })
      .catch((err) => {
        console.warn("Falling back to stream URL for cadet clip:", err);
        if (videoRef.current) {
          videoRef.current.src = MEDIA.clip;
        }
      });

    return () => {
      active = false;
      if (stateRef.current.blobUrl) {
        URL.revokeObjectURL(stateRef.current.blobUrl);
      }
    };
  }, []);

  // Animation & Head-follow loop
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      if (video.duration) {
        stateRef.current.duration = video.duration;
      }
      setVideoLoaded(true);
    };

    video.addEventListener("loadedmetadata", handleLoadedMetadata);

    let ringX = -100;
    let ringY = -100;

    const tick = () => {
      const now = Date.now();
      const idleTime = now - stateRef.current.lastMoveTime;
      const dur = stateRef.current.duration || 5.04;

      // Idle drift after 3.5 seconds without mouse movement
      if (idleTime > 3500) {
        const t = (now - stateRef.current.lastMoveTime - 3500) / 1000;
        stateRef.current.targetTime = dur * (0.5 + 0.32 * Math.sin(t * 1.5));
      }

      // Smooth easing toward target
      stateRef.current.currentTime += (stateRef.current.targetTime - stateRef.current.currentTime) * 0.14;

      // Update video time when not seeking
      if (video && !video.seeking && Math.abs(video.currentTime - stateRef.current.currentTime) > 0.03) {
        try {
          video.currentTime = Math.max(0, Math.min(dur, stateRef.current.currentTime));
        } catch {
          // ignore seek bounds
        }
      }

      // Ring cursor easing
      setCursorPos((cp) => {
        ringX += (cp.x - ringX) * 0.35;
        ringY += (cp.y - ringY) * 0.35;
        setRingPos({ x: ringX, y: ringY });
        return cp;
      });

      stateRef.current.rafId = requestAnimationFrame(tick);
    };

    stateRef.current.rafId = requestAnimationFrame(tick);

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      cancelAnimationFrame(stateRef.current.rafId);
    };
  }, []);

  // Pointer move across window/container
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsPointerInside(true);
    setCursorPos({ x: e.clientX, y: e.clientY });

    stateRef.current.lastMoveTime = Date.now();
    const dur = stateRef.current.duration || 5.04;

    // Map pointer X across window (14% to 86%) to video time 0 -> duration
    const pct = Math.max(0.14, Math.min(0.86, e.clientX / window.innerWidth));
    const normalized = (pct - 0.14) / (0.86 - 0.14); // 0 to 1
    stateRef.current.targetTime = normalized * dur;
  };

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={() => setIsPointerInside(false)}
      className={`relative w-full h-screen overflow-hidden bg-[#02040D] select-none ${className}`}
      style={{
        // 1440x810 relative unit calculation: --u
        // @ts-expect-error CSS variable
        "--u": "max(100vw / 1440, 100vh / 810)",
      }}
    >
      {/* Custom Ring Cursor */}
      {isPointerInside && (
        <div className="hidden lg:block pointer-events-none fixed z-50">
          {/* Exact Dot */}
          <div
            className="fixed w-2 h-2 rounded-full bg-primary -translate-x-1/2 -translate-y-1/2 shadow-[0_0_10px_hsl(var(--primary))]"
            style={{ left: cursorPos.x, top: cursorPos.y }}
          />
          {/* Easing Ring */}
          <div
            className="fixed w-11 h-11 rounded-full border-2 border-primary/60 -translate-x-1/2 -translate-y-1/2 transition-transform duration-75"
            style={{ left: ringPos.x, top: ringPos.y }}
          />
        </div>
      )}

      {/* 1440x810 Centered Cinematic Stage */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto"
        style={{
          width: "calc(1440 * var(--u))",
          height: "calc(810 * var(--u))",
        }}
      >
        {/* 1. Base Plate (1920x1080 artwork) */}
        <img
          src={MEDIA.plate}
          alt="Cadet Skyranger Base"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        />

        {/* 2. Head-Turn Video Overlay */}
        <video
          ref={videoRef}
          muted
          playsInline
          preload="auto"
          className="absolute object-cover pointer-events-none transition-opacity duration-700"
          style={{
            left: "calc(510 * var(--u))",
            top: "calc(255 * var(--u))",
            width: "calc(435 * var(--u))",
            height: "calc(450 * var(--u))",
            opacity: videoLoaded ? 1 : 0,
            WebkitMaskImage: "radial-gradient(ellipse 50% 50% at 50% 46%, black 70%, transparent 98%)",
            maskImage: "radial-gradient(ellipse 50% 50% at 50% 46%, black 70%, transparent 98%)",
          }}
        />

        {/* 3. Glass Bubble Helmet (Drops from top) */}
        <AnimatePresence>
          {helmetOpen && (
            <motion.img
              initial={{ y: "calc(-90 * var(--u))", opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: "calc(-80 * var(--u))", opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
              src={MEDIA.helmet}
              alt="Glass Bubble Helmet"
              className="absolute pointer-events-none"
              style={{
                left: "calc(533 * var(--u))",
                top: "calc(288 * var(--u))",
                width: "calc(360 * var(--u))",
                height: "calc(360 * var(--u))",
                mixBlendMode: "screen",
                WebkitMaskImage: "linear-gradient(to bottom, black 76%, transparent 92%)",
                maskImage: "linear-gradient(to bottom, black 76%, transparent 92%)",
              }}
            />
          )}
        </AnimatePresence>

        {/* 4. PUSH ME Chest Button (Positioned at 675u, 720u) */}
        <motion.button
          type="button"
          aria-label="Toggle Space Helmet"
          aria-pressed={helmetOpen}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.88 }}
          onClick={() => setHelmetOpen((prev) => !prev)}
          className={`absolute flex flex-col items-center justify-center rounded-full font-headline font-black tracking-tight text-white cursor-pointer z-20 transition-all ${
            helmetOpen
              ? "shadow-[0_0_35px_rgba(220,38,38,0.9),inset_0_0_15px_rgba(255,255,255,0.6)] border-2 border-white/80"
              : "shadow-[0_4px_20px_rgba(0,0,0,0.8),inset_0_2px_4px_rgba(255,255,255,0.4)] border border-white/30"
          }`}
          style={{
            left: "calc(675 * var(--u))",
            top: "calc(720 * var(--u))",
            width: "calc(75 * var(--u))",
            height: "calc(75 * var(--u))",
            fontSize: "calc(14 * var(--u))",
            background: "radial-gradient(circle at 35% 30%, #ef4444 0%, #b91c1c 55%, #7f1d1d 100%)",
          }}
        >
          <span className="leading-tight drop-shadow">PUSH</span>
          <span className="leading-tight drop-shadow">ME</span>
        </motion.button>

        {/* 5. Glowing Hero Title (Tuned for Viora Kindergarten & Space Explorer) */}
        <div
          className="absolute w-full text-center pointer-events-none z-10"
          style={{ top: "calc(80 * var(--u))" }}
        >
          <motion.p
            initial={{ opacity: 0, letterSpacing: "0.8em" }}
            animate={{ opacity: 1, letterSpacing: "0.46em" }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="font-bold text-amber-400 uppercase drop-shadow"
            style={{ fontSize: "calc(16 * var(--u))" }}
          >
            VIORA ACADEMY · FUTURE EXPLORERS
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="font-black italic text-white uppercase tracking-tighter"
            style={{
              fontSize: "calc(75 * var(--u))",
              textShadow: "0 0 15px rgba(255,255,255,0.8), 0 0 35px #800020, 0 0 70px rgba(128,0,32,0.6)",
            }}
          >
            CADET SKYRANGER
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.9 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-slate-300 font-medium"
            style={{ fontSize: "calc(19 * var(--u))", marginTop: "calc(4 * var(--u))" }}
          >
            Inspiring Young Minds Beyond the Stars
          </motion.p>
        </div>
      </div>

      {/* Children content (Login Form Overlay) */}
      {children && <div className="relative z-30 w-full h-full pointer-events-none">{children}</div>}
    </div>
  );
};

export default CadetHero;
