import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Sparkles,
  UserCircle2,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  Globe,
  Loader2,
  ArrowLeft,
  GraduationCap,
  BadgeDollarSign,
  UserCheck,
  Compass,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const MEDIA = {
  still: "https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/f1631235-0a76-464d-8f1d-2c4b48a997d5.jpg",
  video: "https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/e71aea27-a808-4ae3-8231-a469d49285d4.mp4",
};

export const VaultraHero: React.FC = () => {
  const navigate = useNavigate();
  const { signIn, user } = useAuth();
  const { i18n } = useTranslation();
  const [videoReady, setVideoReady] = useState(false);
  const [isLoginActive, setIsLoginActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Spotlight mouse tracking on login card
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isCardHovered, setIsCardHovered] = useState(false);

  const isRtl = i18n.language === "ar";

  useEffect(() => {
    if (user) {
      if (user.role === "superadmin") {
        navigate("/super-admin");
      } else {
        navigate("/admin");
      }
    }
  }, [user, navigate]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleCanPlay = () => {
      setVideoReady(true);
      video.play().catch(() => {});
    };

    video.addEventListener("canplaythrough", handleCanPlay);
    return () => {
      video.removeEventListener("canplaythrough", handleCanPlay);
    };
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const loginEmail = email.includes("@") || email === "super" ? email : `${email.toLowerCase()}@viora.com`;

    try {
      await signIn(loginEmail, password);
      toast.success(isRtl ? "مرحباً بك مجدداً في فيورا!" : "Welcome back to Viora!");

      const savedUser = localStorage.getItem("local_user");
      if (savedUser) {
        const u = JSON.parse(savedUser);
        if (u.role === "superadmin") {
          navigate("/super-admin");
          return;
        }
      }
      navigate("/admin");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : (isRtl ? "فشل تسجيل الدخول" : "Authentication failed");
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = () => {
    setEmail("mina@prodigy.ro");
    setPassword("R0nald0r");
    toast.info(isRtl ? "تم إدخال بيانات الحساب التجريبي!" : "Demo credentials filled!");
  };

  const toggleLanguage = () => {
    i18n.changeLanguage(isRtl ? "en" : "ar");
  };

  // High-end capability modules (Clean, modern, animated — no emojis)
  const features = isRtl
    ? [
        {
          icon: GraduationCap,
          color: "amber",
          title: "حضور وسجلات الأطفال",
          desc: "تسجيل فوري للحضور وملفات شاملة للنمو وتنبيهات أولياء الأمور",
          tag: "مباشر",
        },
        {
          icon: BadgeDollarSign,
          color: "emerald",
          title: "أقساط ورسوم مؤتمتة",
          desc: "إدارة المصروفات المدرسية، جدولة الأقساط، ومتابعة التدفق النقدي",
          tag: "أتمتة",
        },
        {
          icon: UserCheck,
          color: "cyan",
          title: "رواتب ومستحقات الكادر",
          desc: "صرف رواتب المعلمات، تتبع السلف، وحساب ساعات العمل بدقة",
          tag: "كادر",
        },
        {
          icon: Compass,
          color: "rose",
          title: "المعسكر الصيفي والأنشطة",
          desc: "تحويل فوري بين الفصول الدراسية وبرامج المعسكرات والرحلات",
          tag: "مرن",
        },
      ]
    : [
        {
          icon: GraduationCap,
          color: "amber",
          title: "Smart Attendance & Records",
          desc: "Live daily check-in, developmental profiles & parent notices",
          tag: "LIVE",
        },
        {
          icon: BadgeDollarSign,
          color: "emerald",
          title: "Tuition & Smart Billing",
          desc: "Automated fee schedules, installment tracking & instant ledger",
          tag: "AUTO",
        },
        {
          icon: UserCheck,
          color: "cyan",
          title: "Staff Payroll & HR",
          desc: "Educator payroll disbursements, advance deductions & shifts",
          tag: "STAFF",
        },
        {
          icon: Compass,
          color: "rose",
          title: "Summer Camp Mode",
          desc: "Instant switch between regular school term & summer camp",
          tag: "SEASON",
        },
      ];

  return (
    <div className="relative w-full h-screen max-h-screen overflow-hidden bg-[#030308] text-white select-none font-sans flex flex-col justify-between">
      {/* 1. Cinematic Rotating Globe Background */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden flex items-end justify-center">
        {/* Still Plate fallback */}
        <img
          src={MEDIA.still}
          alt="Viora Interactive Globe"
          className="w-full h-full object-cover object-bottom"
        />

        {/* Seamless Video Layer */}
        <video
          ref={videoRef}
          src={MEDIA.video}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          className={`absolute inset-0 w-full h-full object-cover object-bottom transition-opacity duration-1000 ${
            videoReady ? "opacity-100" : "opacity-0"
          }`}
        />

        {/* Ambient Dark Gradient Vignettes */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#030308] via-[#030308]/40 to-[#030308] pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#030308] via-transparent to-[#030308] pointer-events-none opacity-80" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(3,3,8,0.75)_70%,rgba(3,3,8,0.95)_100%)] pointer-events-none" />
      </div>

      {/* 2. Floating Star Particles */}
      <div className="absolute inset-0 z-1 pointer-events-none overflow-hidden">
        {[...Array(16)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white/70"
            style={{
              width: `${(i % 3) + 1.5}px`,
              height: `${(i % 3) + 1.5}px`,
              top: `${(i * 19) % 100}%`,
              left: `${(i * 23) % 100}%`,
            }}
            animate={{
              opacity: [0.2, 0.85, 0.2],
              scale: [1, 1.35, 1],
              y: [0, -12, 0],
            }}
            transition={{
              duration: 4.5 + (i % 3),
              repeat: Infinity,
              ease: "easeInOut",
              delay: (i % 5) * 0.7,
            }}
          />
        ))}
      </div>

      {/* 3. Top Navigation Bar */}
      <header className="relative z-20 w-full max-w-7xl mx-auto px-6 py-4 sm:py-5 flex items-center justify-between shrink-0">
        {/* Brand Mark with Smooth Micro-Interaction */}
        <div
          onClick={() => setIsLoginActive(false)}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="relative w-10 h-10 rounded-full bg-black/85 border border-primary/50 p-1 flex items-center justify-center overflow-hidden shadow-lg shadow-primary/30 group-hover:scale-105 transition-transform">
            <img
              src="/logo-light.png"
              alt="Viora Logo"
              className="w-full h-full object-cover rounded-full scale-110"
              onError={(e) => {
                e.currentTarget.src = "/favicon.png";
              }}
            />
          </div>
          <div>
            <span className="font-headline font-black tracking-[0.22em] text-lg text-white">
              VIORA
            </span>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/12 backdrop-blur-xl text-xs font-semibold text-slate-200 hover:text-white transition-all cursor-pointer"
          >
            <Globe size={13} className="text-amber-400" />
            <span>{isRtl ? "English" : "العربية"}</span>
          </button>

          {!isLoginActive ? (
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setIsLoginActive(true)}
              className="px-5 py-2 rounded-full bg-gradient-to-r from-primary via-[#9e002b] to-[#600018] text-white font-bold text-xs hover:shadow-[0_0_20px_rgba(158,0,43,0.5)] transition-all cursor-pointer flex items-center gap-2 shadow-lg shadow-primary/30"
            >
              <span>{isRtl ? "تسجيل الدخول" : "Sign In"}</span>
              <ArrowRight size={13} className={isRtl ? "rotate-180" : ""} />
            </motion.button>
          ) : (
            <button
              onClick={() => setIsLoginActive(false)}
              className="px-4 py-1.5 rounded-full bg-white/[0.08] hover:bg-white/[0.15] border border-white/15 text-xs font-semibold text-slate-200 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <ArrowLeft size={13} className={isRtl ? "rotate-180" : ""} />
              <span>{isRtl ? "الرئيسية" : "Overview"}</span>
            </button>
          )}
        </div>
      </header>

      {/* 4. Center Stage (Single Page, Smooth Cross-Fade between Presentation & Login) */}
      <div className="relative z-20 w-full max-w-5xl mx-auto px-6 text-center flex flex-col items-center justify-center my-auto flex-1 min-h-0">
        <AnimatePresence mode="wait">
          {!isLoginActive ? (
            /* ======================================================== */
            /* VIEW A: COMPANY PRESENTATION (الشركة بتعمل إيه بشكل راقي) */
            /* ======================================================== */
            <motion.div
              key="presentation"
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -10 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center w-full max-w-4xl"
            >
              {/* Refined Glass Innovation Badge */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.06] border border-white/12 backdrop-blur-xl shadow-lg mb-4"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] sm:text-xs font-semibold text-slate-200 tracking-wide">
                  {isRtl
                    ? "نظام الحضانة الذكي المتكامل للجيل القادم"
                    : "Next-Gen Preschool & Nursery Management Cloud"}
                </span>
              </motion.div>

              {/* Grand Elegant Headline */}
              <motion.h1
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.1 }}
                className="text-3xl sm:text-5xl md:text-5xl lg:text-6xl font-black tracking-tight leading-[1.12] font-headline max-w-3xl"
              >
                {isRtl ? (
                  <>
                    <span className="bg-gradient-to-r from-pink-200 via-white to-rose-200 bg-clip-text text-transparent drop-shadow">
                      إدارة حضانتك الذكية
                    </span>
                    <br />
                    <span className="text-white font-light text-2xl sm:text-4xl md:text-5xl mt-1 block">
                      بكل سلاسة وانسيابية
                    </span>
                  </>
                ) : (
                  <>
                    <span className="bg-gradient-to-r from-pink-200 via-white to-rose-200 bg-clip-text text-transparent drop-shadow">
                      Elevating Early Education
                    </span>
                    <br />
                    <span className="text-white font-light text-2xl sm:text-4xl md:text-5xl mt-1 block">
                      with Intelligent Management
                    </span>
                  </>
                )}
              </motion.h1>

              {/* Concise, Modern Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="mt-3 text-xs sm:text-sm md:text-base text-slate-300 max-w-2xl leading-relaxed font-normal"
              >
                {isRtl
                  ? "منصة متطورة توحد شؤون الأطفال والحضور، أتمتة الرسوم والمصروفات المالية، رواتب المعلمين والموظفين، وبرامج المعسكرات الصيفية في بيئة سحابية واحدة آمنة."
                  : "An all-in-one cloud OS unifying digital child records, automated tuition billing, staff payroll, and summer camp operations in a seamless, secure workspace."}
              </motion.p>

              {/* Sleek Dynamic Capability Modules (No clunky emoji boxes - pure modern glass capsules) */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.75, delay: 0.3 }}
                className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 w-full max-w-4xl mt-5 sm:mt-6"
                dir={isRtl ? "rtl" : "ltr"}
              >
                {features.map((item, idx) => {
                  const Icon = item.icon;
                  const accentColors = {
                    amber: {
                      glow: "hover:border-amber-400/40 hover:shadow-[0_0_25px_rgba(251,191,36,0.15)]",
                      iconBox: "bg-amber-400/10 text-amber-300 border-amber-400/25",
                      tag: "bg-amber-400/10 text-amber-300 border-amber-400/30",
                      topLine: "from-amber-400/50 via-amber-400 to-transparent",
                    },
                    emerald: {
                      glow: "hover:border-emerald-400/40 hover:shadow-[0_0_25px_rgba(52,211,153,0.15)]",
                      iconBox: "bg-emerald-400/10 text-emerald-300 border-emerald-400/25",
                      tag: "bg-emerald-400/10 text-emerald-300 border-emerald-400/30",
                      topLine: "from-emerald-400/50 via-emerald-400 to-transparent",
                    },
                    cyan: {
                      glow: "hover:border-cyan-400/40 hover:shadow-[0_0_25px_rgba(34,211,238,0.15)]",
                      iconBox: "bg-cyan-400/10 text-cyan-300 border-cyan-400/25",
                      tag: "bg-cyan-400/10 text-cyan-300 border-cyan-400/30",
                      topLine: "from-cyan-400/50 via-cyan-400 to-transparent",
                    },
                    rose: {
                      glow: "hover:border-rose-400/40 hover:shadow-[0_0_25px_rgba(251,113,133,0.15)]",
                      iconBox: "bg-rose-400/10 text-rose-300 border-rose-400/25",
                      tag: "bg-rose-400/10 text-rose-300 border-rose-400/30",
                      topLine: "from-rose-400/50 via-rose-400 to-transparent",
                    },
                  }[item.color as "amber" | "emerald" | "cyan" | "rose"];

                  return (
                    <motion.div
                      key={idx}
                      whileHover={{ y: -3, scale: 1.02 }}
                      transition={{ type: "spring", stiffness: 350, damping: 25 }}
                      className={`relative group rounded-2xl p-3 sm:p-3.5 bg-black/40 hover:bg-black/60 border border-white/[0.08] backdrop-blur-xl transition-all duration-300 flex flex-col justify-between text-start overflow-hidden ${accentColors.glow}`}
                    >
                      {/* Subtle top shimmer highlight */}
                      <div className={`absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r ${accentColors.topLine} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

                      {/* Top row: Icon + Micro Status Tag */}
                      <div className="flex items-center justify-between mb-2">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center border shadow-sm ${accentColors.iconBox}`}>
                          <Icon size={16} />
                        </div>
                        <span className={`text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border ${accentColors.tag}`}>
                          {item.tag}
                        </span>
                      </div>

                      {/* Title & Short Description */}
                      <div>
                        <h3 className="font-headline font-bold text-xs sm:text-[13px] text-white tracking-tight mb-1 group-hover:text-slate-100">
                          {item.title}
                        </h3>
                        <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                          {item.desc}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>

              {/* Action Buttons: Opens the Login Card in the Center */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.45 }}
                className="mt-6 sm:mt-7 flex flex-wrap items-center justify-center gap-3.5"
              >
                <motion.button
                  whileHover={{ scale: 1.04, y: -2 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setIsLoginActive(true)}
                  className="px-8 py-3 rounded-full bg-gradient-to-r from-primary via-[#9e002b] to-[#600018] text-white font-bold text-xs sm:text-sm hover:shadow-[0_0_35px_rgba(158,0,43,0.65)] transition-all shadow-xl shadow-primary/35 flex items-center gap-2.5 cursor-pointer border border-white/20"
                >
                  <span>{isRtl ? "دخول المنصة وتسجيل الدخول" : "Access Workspace Portal"}</span>
                  <ArrowRight size={15} strokeWidth={2.5} className={isRtl ? "rotate-180" : ""} />
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => {
                    handleDemoFill();
                    setIsLoginActive(true);
                  }}
                  className="px-5 py-3 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/20 text-white font-semibold text-xs sm:text-sm backdrop-blur-xl transition-all cursor-pointer flex items-center gap-2"
                >
                  <Sparkles size={14} className="text-amber-400 animate-pulse" />
                  <span>{isRtl ? "تجربة سريعة (Demo)" : "Try Admin Demo"}</span>
                </motion.button>
              </motion.div>
            </motion.div>
          ) : (
            /* ======================================================== */
            /* VIEW B: CENTERED SLEEK ANIMATED LOGIN CARD (شاشة اللوجين) */
            /* ======================================================== */
            <motion.div
              key="login"
              ref={cardRef}
              onMouseMove={handleMouseMove}
              onMouseEnter={() => setIsCardHovered(true)}
              onMouseLeave={() => setIsCardHovered(false)}
              initial={{ opacity: 0, scale: 0.93, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: -15 }}
              transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-[420px] rounded-3xl bg-[#070912]/90 border border-white/[0.14] p-6 sm:p-7 shadow-[0_30px_90px_rgba(0,0,0,0.9),0_0_60px_rgba(158,0,43,0.3)] backdrop-blur-2xl text-white overflow-hidden text-start"
            >
              {/* Dynamic Mouse Spotlight */}
              {isCardHovered && (
                <div
                  className="absolute inset-0 pointer-events-none transition-opacity duration-300"
                  style={{
                    background: `radial-gradient(350px circle at ${mousePos.x}px ${mousePos.y}px, rgba(225, 29, 72, 0.12), transparent 70%)`,
                  }}
                />
              )}

              {/* Ambient Glowing Halo */}
              <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-48 h-48 bg-primary/30 rounded-full blur-3xl pointer-events-none" />

              {/* Card Top Bar: Back Button + Language Quick Switch */}
              <div className="flex items-center justify-between mb-4 relative z-10">
                <button
                  type="button"
                  onClick={() => setIsLoginActive(false)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-xs text-slate-300 hover:text-white transition-all cursor-pointer group"
                >
                  <ArrowLeft size={13} className={`group-hover:-translate-x-0.5 transition-transform ${isRtl ? "rotate-180" : ""}`} />
                  <span>{isRtl ? "الرجوع للرئيسية" : "Back to Overview"}</span>
                </button>

                <button
                  type="button"
                  onClick={toggleLanguage}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-[11px] text-slate-300 hover:text-white transition-all cursor-pointer"
                >
                  <Globe size={12} className="text-amber-400" />
                  <span>{isRtl ? "English" : "العربية"}</span>
                </button>
              </div>

              {/* Brand Crest Header: Radiant Cyber Emblem */}
              <div className="flex flex-col items-center text-center mb-4 relative z-10">
                <div className="relative group mb-2">
                  <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-primary via-rose-500 to-amber-500 opacity-70 blur-md group-hover:opacity-100 animate-pulse transition duration-500" />
                  <div className="relative w-14 h-14 rounded-full bg-[#05060b] border border-white/20 p-2 flex items-center justify-center shadow-xl">
                    <img
                      src="/logo-light.png"
                      alt="Viora Logo"
                      className="w-full h-full object-contain filter drop-shadow-[0_0_8px_rgba(225,29,72,0.6)]"
                      onError={(e) => {
                        e.currentTarget.src = "/favicon.png";
                      }}
                    />
                  </div>
                </div>

                <h2 className="text-xl font-black tracking-[0.2em] text-white font-headline">
                  VIORA
                </h2>
                
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-medium text-emerald-300 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{isRtl ? "بوابة النظام السحابي" : "Workspace Portal"}</span>
                </div>
              </div>

              {/* Login Form */}
              <form onSubmit={handleAuth} className="space-y-3 relative z-10" dir={isRtl ? "rtl" : "ltr"}>
                {/* Email field */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300 block">
                    {isRtl ? "اسم المستخدم أو البريد الإلكتروني" : "Username or Email"}
                  </label>
                  <div className="relative group">
                    <div
                      className={`absolute inset-y-0 ${
                        isRtl ? "right-3" : "left-3"
                      } flex items-center pointer-events-none text-slate-400 group-focus-within:text-rose-400 transition-colors`}
                    >
                      <UserCircle2 size={16} />
                    </div>
                    <input
                      className={`w-full bg-white/[0.04] hover:bg-white/[0.07] focus:bg-white/[0.08] border border-white/12 focus:border-rose-500/80 rounded-xl py-2.5 text-xs sm:text-sm text-white focus:ring-2 focus:ring-rose-500/20 transition-all outline-none placeholder:text-slate-500 ${
                        isRtl ? "pr-9 pl-3 text-right" : "pl-9 pr-3 text-left"
                      }`}
                      placeholder="mina@prodigy.ro"
                      type="text"
                      autoComplete="username"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Password field */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300 block">
                    {isRtl ? "كلمة المرور" : "Password"}
                  </label>
                  <div className="relative group">
                    <div
                      className={`absolute inset-y-0 ${
                        isRtl ? "right-3" : "left-3"
                      } flex items-center pointer-events-none text-slate-400 group-focus-within:text-rose-400 transition-colors`}
                    >
                      <Lock size={16} />
                    </div>
                    <input
                      className={`w-full bg-white/[0.04] hover:bg-white/[0.07] focus:bg-white/[0.08] border border-white/12 focus:border-rose-500/80 rounded-xl py-2.5 text-xs sm:text-sm text-white focus:ring-2 focus:ring-rose-500/20 transition-all outline-none placeholder:text-slate-500 ${
                        isRtl ? "pr-9 pl-9 text-right" : "pl-9 pr-9 text-left"
                      }`}
                      placeholder="••••••••"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={4}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={`absolute inset-y-0 ${
                        isRtl ? "left-3" : "right-3"
                      } flex items-center text-slate-400 hover:text-white transition-colors cursor-pointer`}
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 flex flex-col gap-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={loading}
                    className="relative overflow-hidden w-full bg-gradient-to-r from-primary via-[#b30030] to-[#75001f] text-white font-bold text-xs sm:text-sm py-3 rounded-xl hover:shadow-[0_0_25px_rgba(179,0,48,0.55)] transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/30 cursor-pointer disabled:opacity-50 group"
                  >
                    <span className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-[300%] transition-transform duration-1000 ease-out pointer-events-none" />
                    {loading ? (
                      <>
                        <Loader2 size={15} className="animate-spin" />
                        <span>{isRtl ? "جارٍ التحقق..." : "Signing in..."}</span>
                      </>
                    ) : (
                      <>
                        <span>{isRtl ? "تسجيل الدخول" : "Sign In"}</span>
                        <ArrowRight size={14} className={isRtl ? "rotate-180" : ""} />
                      </>
                    )}
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={handleDemoFill}
                    className="w-full bg-amber-400/[0.06] hover:bg-amber-400/[0.12] border border-amber-400/20 hover:border-amber-400/40 text-amber-200 hover:text-amber-100 font-semibold text-xs py-2 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                  >
                    <Sparkles size={13} className="text-amber-400 animate-pulse" />
                    <span>{isRtl ? "تعبئة بيانات الحساب التجريبي (Demo)" : "Fill Demo Credentials"}</span>
                  </motion.button>
                </div>
              </form>

              {/* Footer info */}
              <div className="mt-3 pt-2.5 border-t border-white/[0.08] flex items-center justify-between text-[10px] text-slate-400 relative z-10">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck size={12} className="text-emerald-400" />
                  <span>{isRtl ? "اتصال مشفر 256-bit" : "256-bit SSL Encrypted"}</span>
                </span>
                <span className="font-mono text-[9px] text-slate-400 tracking-wider uppercase">
                  VIORA CLOUD v2.1
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 5. Minimalist Bottom Footer */}
      <footer className="relative z-20 w-full max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between text-[11px] text-slate-400 shrink-0 border-t border-white/[0.06]">
        <span className="flex items-center gap-1.5">
          <ShieldCheck size={13} className="text-emerald-400" />
          <span>{isRtl ? "منصة سحابية آمنة 100%" : "100% Encrypted & Safe Platform"}</span>
        </span>
        <span className="font-mono text-[10px] tracking-widest text-slate-300 uppercase">
          VIORA SAAS v2.1
        </span>
      </footer>
    </div>
  );
};

export default VaultraHero;
