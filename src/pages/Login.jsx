import { cn } from "@/lib/utils";
import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle, useMemo, useCallback, createContext, Children } from "react";
import { cva } from "class-variance-authority";
import { Mail, Gem, Lock, Eye, EyeOff, X, AlertCircle, PartyPopper, Loader } from "lucide-react";
import apiClient from "@/api/client";
import { AnimatePresence, motion, useInView } from "framer-motion";
import confetti from "canvas-confetti";
import { GoogleLogin } from '@react-oauth/google';

const ConfettiContext = createContext({});

const Confetti = forwardRef((props, ref) => {
  const { options, globalOptions = { resize: true, useWorker: true }, manualstart = false, ...rest } = props;
  const instanceRef = useRef(null);
  const canvasRef = useCallback((node) => {
    if (node !== null) {
      if (instanceRef.current) return;
      instanceRef.current = confetti.create(node, { ...globalOptions, resize: true });
    } else {
      if (instanceRef.current) {
        instanceRef.current.reset();
        instanceRef.current = null;
      }
    }
  }, [globalOptions]);
  const fire = useCallback((opts = {}) => instanceRef.current?.({ ...options, ...opts }), [options]);
  const api = useMemo(() => ({ fire }), [fire]);
  useImperativeHandle(ref, () => api, [api]);
  useEffect(() => { if (!manualstart) fire(); }, [manualstart, fire]);
  return <canvas ref={canvasRef} {...rest} />;
});
Confetti.displayName = "Confetti";

export function TextLoop({ children, className, interval = 2, transition = { duration: 0.3 }, variants, onIndexChange, stopOnEnd = false }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const items = Children.toArray(children);
  useEffect(() => {
    const intervalMs = interval * 1000;
    const timer = setInterval(() => {
      setCurrentIndex((current) => {
        if (stopOnEnd && current === items.length - 1) { clearInterval(timer); return current; }
        const next = (current + 1) % items.length;
        onIndexChange?.(next);
        return next;
      });
    }, intervalMs);
    return () => clearInterval(timer);
  }, [items.length, interval, onIndexChange, stopOnEnd]);
  const motionVariants = {
    initial: { y: 20, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: -20, opacity: 0 },
  };
  return (
    <div className={cn('relative inline-block whitespace-nowrap', className)}>
      <AnimatePresence mode='popLayout' initial={false}>
        <motion.div key={currentIndex} initial='initial' animate='animate' exit='exit' transition={transition} variants={variants || motionVariants}>
          {items[currentIndex]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function BlurFade({ children, className, variant, duration = 0.4, delay = 0, yOffset = 6, inView = true, inViewMargin = "-50px", blur = "6px" }) {
  const ref = useRef(null);
  const inViewResult = useInView(ref, { once: true, margin: inViewMargin });
  const isInView = !inView || inViewResult;
  const defaultVariants = {
    hidden: { y: yOffset, opacity: 0, filter: `blur(${blur})` },
    visible: { y: -yOffset, opacity: 1, filter: `blur(0px)` },
  };
  const combinedVariants = variant || defaultVariants;
  return (
    <motion.div ref={ref} initial="hidden" animate={isInView ? "visible" : "hidden"} exit="hidden"
      variants={combinedVariants} transition={{ delay: 0.04 + delay, duration, ease: "easeOut" }} className={className}>
      {children}
    </motion.div>
  );
}

/* ─────────────────────────────────────────
   GlassButton — original pill style restored,
   inline-flex so it never stretches full width
───────────────────────────────────────── */
const glassButtonVariants = cva(
  "relative isolate cursor-pointer rounded-full transition-all duration-200",
  {
    variants: { size: { default: "text-base font-medium", sm: "text-sm font-medium", lg: "text-lg font-medium", icon: "h-10 w-10" } },
    defaultVariants: { size: "default" }
  }
);
const glassButtonTextVariants = cva(
  "glass-button-text relative block select-none tracking-tighter",
  {
    variants: { size: { default: "px-6 py-3.5", sm: "px-5 py-2.5", lg: "px-8 py-4", icon: "flex h-10 w-10 items-center justify-center" } },
    defaultVariants: { size: "default" }
  }
);

const GlassButton = React.forwardRef(({ className, children, size, contentClassName, onClick, ...props }, ref) => {
  const handleWrapperClick = (e) => {
    const button = e.currentTarget.querySelector('button');
    if (button && e.target !== button) button.click();
  };
  return (
    <div className={cn("glass-button-wrap cursor-pointer rounded-full relative inline-flex", className)} onClick={handleWrapperClick}>
      <button className={cn("glass-button relative z-10", glassButtonVariants({ size }))} ref={ref} onClick={onClick} {...props}>
        <span className={cn(glassButtonTextVariants({ size }), contentClassName)}>{children}</span>
      </button>
      <div className="glass-button-shadow rounded-full pointer-events-none"></div>
    </div>
  );
});
GlassButton.displayName = "GlassButton";

/* ─────────────────────────────────────────
   Google Icon
───────────────────────────────────────── */
const GoogleIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" className="w-5 h-5">
    <g fillRule="evenodd" fill="none">
      <g fillRule="nonzero" transform="translate(3, 2)">
        <path fill="#4285F4" d="M57.8123233,30.1515267 C57.8123233,27.7263183 57.6155321,25.9565533 57.1896408,24.1212666 L29.4960833,24.1212666 L29.4960833,35.0674653 L45.7515771,35.0674653 C45.4239683,37.7877475 43.6542033,41.8844383 39.7213169,44.6372555 L39.6661883,45.0037254 L48.4223791,51.7870338 L49.0290201,51.8475849 C54.6004021,46.7020943 57.8123233,39.1313952 57.8123233,30.1515267" />
        <path fill="#34A853" d="M29.4960833,58.9921667 C37.4599129,58.9921667 44.1456164,56.3701671 49.0290201,51.8475849 L39.7213169,44.6372555 C37.2305867,46.3742596 33.887622,47.5868638 29.4960833,47.5868638 C21.6960582,47.5868638 15.0758763,42.4415991 12.7159637,35.3297782 L12.3700541,35.3591501 L3.26524241,42.4054492 L3.14617358,42.736447 C7.9965904,52.3717589 17.959737,58.9921667 29.4960833,58.9921667" />
        <path fill="#FBBC05" d="M12.7159637,35.3297782 C12.0932812,33.4944915 11.7329116,31.5279353 11.7329116,29.4960833 C11.7329116,27.4640054 12.0932812,25.4976752 12.6832029,23.6623884 L12.6667095,23.2715173 L3.44779955,16.1120237 L3.14617358,16.2554937 C1.14708246,20.2539019 0,24.7439491 0,29.4960833 C0,34.2482175 1.14708246,38.7380388 3.14617358,42.736447 L12.7159637,35.3297782" />
        <path fill="#EB4335" d="M29.4960833,11.4050769 C35.0347044,11.4050769 38.7707997,13.7975244 40.9011602,15.7968415 L49.2255853,7.66898166 C44.1130815,2.91684746 37.4599129,0 29.4960833,0 C17.959737,0 7.9965904,6.62018183 3.14617358,16.2554937 L12.6832029,23.6623884 C15.0758763,16.5505675 21.6960582,11.4050769 29.4960833,11.4050769" />
      </g>
    </g>
  </svg>
);

/* ─────────────────────────────────────────
   GlassInput — fully frosted, matches card glass
───────────────────────────────────────── */
const GlassInput = ({ icon, type = "text", placeholder, value, onChange, onKeyDown, inputRef }) => (
  <div
    className={cn(
      "flex items-center w-full rounded-2xl overflow-hidden",
      "bg-white/8 backdrop-blur-2xl",
      "border border-white/25",
      "shadow-[inset_0_1px_0_rgba(255,255,255,0.18),inset_0_-1px_0_rgba(0,0,0,0.08),0_2px_16px_rgba(0,0,0,0.15)]",
      "transition-all duration-250",
      "focus-within:bg-white/14 focus-within:border-white/45",
      "focus-within:shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_4px_24px_rgba(0,0,0,0.2)]"
    )}
  >
    {/* left icon strip — slightly darker tint for depth */}
    <div className="flex items-center justify-center w-12 h-13 flex-shrink-0 text-white/50"
      style={{ minHeight: '3rem' }}>
      {icon}
    </div>
    {/* subtle vertical divider */}
    <div className="w-px self-stretch my-2.5 bg-white/12 flex-shrink-0" />
    <input
      ref={inputRef}
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      autoComplete="off"
      style={{ minHeight: '3rem' }}
      className="flex-1 px-4 bg-transparent text-white placeholder:text-white/38 focus:outline-none text-[0.875rem] font-medium tracking-wide"
    />
  </div>
);

/* ─────────────────────────────────────────
   Modal steps data
───────────────────────────────────────── */
const modalSteps = [
  { message: "Authenticating...", icon: <Loader className="w-10 h-10 text-white animate-spin" /> },
  { message: "Welcome Back!", icon: <PartyPopper className="w-10 h-10 text-emerald-300" /> }
];

const DefaultLogo = () => (
  <div className="bg-white/20 backdrop-blur-sm text-white rounded-xl p-2 border border-white/30">
    <Gem className="h-5 w-5" />
  </div>
);

/* ═══════════════════════════════════════════
   Main Component
═══════════════════════════════════════════ */
export const AuthComponent = ({ logo = <DefaultLogo /> }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authStep, setAuthStep] = useState("email");
  const [modalStatus, setModalStatus] = useState('closed');
  const [modalErrorMessage, setModalErrorMessage] = useState('');
  const confettiRef = useRef(null);
  const passwordInputRef = useRef(null);

  const isEmailValid = /\S+@\S+\.\S+/.test(email);
  const isPasswordValid = password.length >= 6;

  const fireSideCanons = () => {
    const fire = confettiRef.current?.fire;
    if (fire) {
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };
      const particleCount = 50;
      fire({ ...defaults, particleCount, origin: { x: 0, y: 1 }, angle: 60 });
      fire({ ...defaults, particleCount, origin: { x: 1, y: 1 }, angle: 120 });
    }
  };

  /* ── BACKEND LOGIC UNCHANGED ── */
  const handleFinalSubmit = (e) => {
    e.preventDefault();
    if (modalStatus !== 'closed') return;
    if (!isEmailValid || !isPasswordValid) {
      setModalErrorMessage('Please enter a valid email and password (min 6 chars).');
      setModalStatus('error');
      return;
    }
    setModalStatus('loading');
    apiClient.post('/auth/login', { email, password })
      .then((res) => {
        const { token } = res.data || {};
        if (token) {
          try { localStorage.setItem('token', token); } catch (e) { }
          fireSideCanons();
          setModalStatus('success');
          setTimeout(() => { window.location.href = '/admin'; }, 900);
        } else {
          setModalErrorMessage('Login failed.');
          setModalStatus('error');
        }
      })
      .catch((err) => {
        const message = err?.response?.data?.error || 'Login failed. Please check credentials.';
        setModalErrorMessage(message);
        setModalStatus('error');
      });
  };

  // Handle Google OAuth success
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setModalStatus('loading');
      setModalErrorMessage('');

      // Send Google token to backend for verification
      const response = await apiClient.post('/auth/google', {
        googleToken: credentialResponse.credential,
      });

      if (response.data.token) {
        // Store JWT in localStorage
        localStorage.setItem('token', response.data.token);
        try {
          localStorage.setItem('user', JSON.stringify(response.data.user));
        } catch (e) { }

        // Fire celebration confetti
        fireSideCanons();
        setModalStatus('success');
        
        // Redirect to admin dashboard
        setTimeout(() => { window.location.href = '/admin'; }, 900);
      }
    } catch (err) {
      const message = err?.response?.data?.error || 'Google login failed. Please check if your email is whitelisted.';
      setModalErrorMessage(message);
      setModalStatus('error');
    }
  };

  const handleGoogleError = () => {
    setModalErrorMessage('Google login failed. Please try again.');
    setModalStatus('error');
  };

  const handleProgressStep = () => { if (authStep === 'email' && isEmailValid) setAuthStep('password'); };
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (authStep === 'email') handleProgressStep();
      else handleFinalSubmit(e);
    }
  };
  const handleGoBack = () => { if (authStep === 'password') setAuthStep('email'); };
  const closeModal = () => { setModalStatus('closed'); setModalErrorMessage(''); };

  useEffect(() => {
    if (authStep === 'password') setTimeout(() => passwordInputRef.current?.focus(), 300);
  }, [authStep]);

  useEffect(() => {
    if (modalStatus === 'success') fireSideCanons();
  }, [modalStatus]);

  /* ── Hide any global navbar while mounted ── */
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const styleEl = document.createElement('style');
    styleEl.id = 'login-hide-header-style';
    styleEl.innerHTML = `
      .main-navbar, header, nav,
      .navbar-mobile-overlay, .navbar-container,
      [class*="navbar"], [class*="header"], [class*="nav-"] {
        display: none !important;
      }
      .app-container { background-color: transparent !important; }
      body, html { overflow: hidden !important; margin: 0 !important; padding: 0 !important; }
    `;
    document.head.appendChild(styleEl);
    return () => {
      document.body.style.overflow = prevOverflow;
      const existing = document.getElementById('login-hide-header-style');
      if (existing) existing.remove();
    };
  }, []);

  /* ── Modal ── */
  const Modal = () => (
    <AnimatePresence>
      {modalStatus !== 'closed' && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backdropFilter: 'blur(16px)', background: 'rgba(0,0,0,0.5)' }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 12 }}
            transition={{ type: 'spring', damping: 24, stiffness: 320 }}
            className={cn(
              "relative w-full max-w-xs mx-4 flex flex-col items-center gap-5 px-8 py-9 rounded-3xl",
              "bg-white/12 backdrop-blur-2xl border border-white/22",
              "shadow-[0_24px_60px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.2)]"
            )}
          >
            {(modalStatus === 'error' || modalStatus === 'success') && (
              <button onClick={closeModal}
                className="absolute top-3 right-3 p-1.5 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-all">
                <X className="w-4 h-4" />
              </button>
            )}
            {modalStatus === 'error' && <>
              <AlertCircle className="w-10 h-10 text-red-300" />
              <p className="text-sm font-medium text-white/85 text-center">{modalErrorMessage}</p>
              <GlassButton onClick={closeModal} size="sm">Try Again</GlassButton>
            </>}
            {modalStatus === 'loading' && <>
              <Loader className="w-10 h-10 text-white animate-spin" />
              <p className="text-sm font-medium text-white/85">Authenticating…</p>
            </>}
            {modalStatus === 'success' && <>
              <PartyPopper className="w-10 h-10 text-emerald-300" />
              <p className="text-sm font-medium text-white/85">Welcome back!</p>
            </>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const bgUrl = 'https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Ftravelbeloved.in%2Fwp-content%2Fuploads%2F2024%2F08%2Fthe-nilgiris-1654612145_6a5d2a183561e8c39267.webp&f=1&nofb=1&ipt=5913543b85acda1d4386c3efbc1adafb1253fea4d602c027c7e32dc02daf49ba';

  return (
    <div
      style={{
        height: '100vh',
        overflow: 'hidden',
        backgroundImage: `url(${bgUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        position: 'fixed',
        inset: 0,
      }}
      className="w-screen flex flex-col"
    >
      {/* Autofill + animation styles */}
      <style>{`
        input[type="password"]::-ms-reveal,
        input[type="password"]::-ms-clear { display: none !important; }
        input[type="password"]::-webkit-credentials-auto-fill-button,
        input[type="password"]::-webkit-strong-password-auto-fill-button { display: none !important; }
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus,
        input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 30px transparent inset !important;
          -webkit-text-fill-color: white !important;
          background-color: transparent !important;
          background-clip: content-box !important;
          transition: background-color 5000s ease-in-out 0s !important;
          color: white !important;
          caret-color: white !important;
        }

        @keyframes shimmer-pan {
          0%   { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
        .title-shimmer {
          background: linear-gradient(110deg,
            rgba(255,255,255,1) 20%,
            rgba(255,255,255,0.48) 45%,
            rgba(255,255,255,1) 65%
          );
          background-size: 250% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer-pan 5s linear infinite;
        }

        @keyframes btn-glow {
          0%, 100% { box-shadow: 0 4px 18px rgba(255,255,255,0.20), inset 0 1px 0 rgba(255,255,255,0.7); }
          50%       { box-shadow: 0 6px 28px rgba(255,255,255,0.34), inset 0 1px 0 rgba(255,255,255,0.85); }
        }
        .signin-btn-active { animation: btn-glow 2.8s ease-in-out infinite; }
      `}</style>

      {/* Subtle dark vignette so card pops against background */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 55%, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0.52) 100%)' }} />

      {/* Confetti */}
      <Confetti ref={confettiRef} manualstart
        className="fixed top-0 left-0 w-full h-full pointer-events-none z-[999]" />

      {/* Modal */}
      <Modal />

      {/* ══ Centred card ══ */}
      <div className="relative z-10 flex flex-1 items-center justify-center px-6">
        <fieldset disabled={modalStatus !== 'closed'} className="w-full" style={{ maxWidth: 420 }}>

          <motion.div
            initial={{ opacity: 0, y: 28, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              "relative flex flex-col items-center gap-6",
              /* generous padding — content never touches glass edge */
              "px-12 pt-10 pb-9",
              "rounded-3xl",
              "bg-white/10 backdrop-blur-2xl",
              "border border-white/22",
              "shadow-[0_32px_80px_rgba(0,0,0,0.38),inset_0_1px_0_rgba(255,255,255,0.28)]"
            )}
          >
            {/* Inner top highlight line */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px pointer-events-none"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent)' }} />

            {/* Logo */}
            <BlurFade delay={0.1}>
              <div className="p-3 rounded-2xl bg-white/15 border border-white/25 backdrop-blur-sm shadow-[0_2px_12px_rgba(0,0,0,0.15)]">
                {logo}
              </div>
            </BlurFade>

            {/* Heading */}
            <BlurFade delay={0.2} className="text-center space-y-1.5 w-full">
              <h1
                className="title-shimmer text-[2.1rem] font-light leading-none"
                style={{ fontFamily: "'Georgia','Palatino Linotype',serif", letterSpacing: '-0.02em' }}
              >
                Welcome back
              </h1>
              <p className="text-[0.78rem] text-white/50 font-medium tracking-wide">
                Sign in to Admin panel
              </p>
            </BlurFade>

            {/* Google — centered pill, natural (not full) width */}
            <BlurFade delay={0.32} className="flex justify-center w-full">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                text="signin_with"
                size="large"
              />
            </BlurFade>

            {/* Divider */}
            <BlurFade delay={0.42} className="w-full">
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-white/15" />
                <span className="text-[0.67rem] font-semibold text-white/32 tracking-widest uppercase">or</span>
                <div className="flex-1 h-px bg-white/15" />
              </div>
            </BlurFade>

            {/* Inputs — fill card content width (padding gives breathing room from edge) */}
            <BlurFade delay={0.5} className="w-full" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <GlassInput
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={handleKeyDown}
                icon={<Mail className="w-4 h-4" />}
              />

              <GlassInput
                inputRef={passwordInputRef}
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                icon={
                  isPasswordValid
                    ? (
                      <button type="button" aria-label="Toggle password visibility"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-white/58 hover:text-white transition-colors">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    )
                    : <Lock className="w-4 h-4" />
                }
              />
            </BlurFade>

            {/* Sign in — wide pill, prominent */}
            <BlurFade delay={0.65} className="flex justify-center w-full">
              <button
                type="button"
                onClick={handleFinalSubmit}
                className={cn(
                  "px-16 py-3.5 rounded-full font-semibold text-base tracking-wide",
                  "transition-all duration-200 ease-out active:scale-[0.97]",
                  isEmailValid && isPasswordValid
                    ? "bg-white text-gray-800 signin-btn-active hover:scale-[1.02]"
                    : "bg-white/12 text-white/32 border border-white/14 cursor-not-allowed"
                )}
              >
                Sign in
              </button>
            </BlurFade>
          </motion.div>
        </fieldset>
      </div>
    </div>
  );
};

export default AuthComponent;