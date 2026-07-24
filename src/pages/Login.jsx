import { cn } from "@/lib/utils";
import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle, useMemo, useCallback, createContext, Children } from "react";
import { cva } from "class-variance-authority";
import { Mail, Gem, Lock, Eye, EyeOff, X, AlertCircle, Check, Loader, ArrowRight } from "lucide-react";
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
   GlassInput — Floating Label with Bottom Line
───────────────────────────────────────── */
const GlassInput = ({ icon, type = "text", placeholder, value, onChange, onKeyDown, inputRef, error, success, shake, helperText }) => {
  const [isFocused, setIsFocused] = useState(false);
  const isActive = isFocused || value.length > 0;

  let lineColor = "bg-black/60";
  if (error) lineColor = "bg-red-500";
  else if (success) lineColor = "bg-green-500";

  let baseLineColor = "bg-black/20";
  if (error) baseLineColor = "bg-red-500/30";
  else if (success) baseLineColor = "bg-green-500/30";

  return (
    <div className={cn("relative w-full flex flex-col items-center mt-3 mb-1", shake && "animate-shake")}>
      {/* Container for input and icon */}
      <div className="relative flex items-center w-full">
        <div className={cn("flex items-center justify-center w-10 mr-1 transition-colors", error ? "text-red-500" : success ? "text-green-500" : "text-black")}>
          {icon}
        </div>
        <div className="relative flex-1 h-12">
          <label
            className={cn(
              "absolute left-0 transition-all duration-300 pointer-events-none font-medium",
              isActive ? "-top-2 text-[0.65rem]" : "top-3 text-[0.85rem]",
              error ? "text-red-500" : success ? "text-green-500" : isActive ? "text-black" : "text-black/50"
            )}
          >
            {placeholder}
          </label>
          <input
            ref={inputRef}
            type={type}
            value={value}
            onChange={onChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={onKeyDown}
            autoComplete="off"
            className={cn("w-full h-full bg-transparent focus:outline-none text-[0.9rem] pt-3 transition-colors", error ? "text-red-500" : success ? "text-green-500" : "text-black")}
          />
        </div>
      </div>
      {/* Bottom Line */}
      <div className={cn("w-full h-px mt-1 relative transition-colors", baseLineColor)}>
        <div className={cn(
          "absolute left-1/2 -translate-x-1/2 top-0 h-[2px] transition-all duration-300",
          lineColor,
          isFocused || error || success ? "w-full" : "w-0"
        )} />
      </div>
      {/* Helper text */}
      <AnimatePresence>
        {helperText && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: "auto", marginTop: 4 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            className="w-full text-left overflow-hidden"
          >
            <span className={cn("text-[0.75rem] font-medium block pt-1", error ? "text-red-500" : success ? "text-green-500" : "text-black/50")}>
              {helperText}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const DefaultLogo = () => (
  <div className="flex items-center justify-center w-[3rem] h-[3rem] rounded-full bg-black text-white font-semibold text-lg shadow-lg -mt-[3.5rem] z-10">
    S
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
  const [loginStatus, setLoginStatus] = useState('idle');
  const [errorType, setErrorType] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [shakeFields, setShakeFields] = useState(false);
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

  /* ── BACKEND LOGIC ── */
  const handleFinalSubmit = (e) => {
    e.preventDefault();
    if (loginStatus === 'loading' || loginStatus === 'success') return;

    if (!email || !password) {
      setLoginStatus('error');
      setErrorType('empty');
      setShakeFields(true);
      setTimeout(() => setShakeFields(false), 500);
      return;
    }

    setLoginStatus('loading');
    setErrorType(null);
    setErrorMessage('');

    apiClient.post('/auth/login', { email, password })
      .then((res) => {
        const { token } = res.data || {};
        if (token) {
          try { localStorage.setItem('token', token); } catch (e) { }
          fireSideCanons();
          setLoginStatus('success');
          setTimeout(() => { window.location.href = '/admin'; }, 900);
        } else {
          setLoginStatus('error');
          setErrorType('wrong_credentials');
        }
      })
      .catch((err) => {
        const message = err?.response?.data?.error || 'Login failed. Please check credentials.';
        setLoginStatus('error');
        if (message.toLowerCase().includes('whitelist') || message.toLowerCase().includes('admin')) {
          setErrorType('not_admin');
          setErrorMessage(message);
        } else {
          setErrorType('wrong_credentials');
          setErrorMessage(message);
        }
      });
  };

  // Handle Google OAuth success
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setLoginStatus('loading');
      setErrorType(null);
      setErrorMessage('');

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
        setLoginStatus('success');

        // Redirect to admin dashboard
        setTimeout(() => { window.location.href = '/admin'; }, 900);
      }
    } catch (err) {
      const message = err?.response?.data?.error || 'Google login failed.';
      setLoginStatus('error');
      if (message.toLowerCase().includes('whitelist') || message.toLowerCase().includes('admin')) {
        setErrorType('not_admin');
        setErrorMessage(message);
      } else {
        setErrorType('wrong_credentials');
        setErrorMessage(message);
      }
    }
  };

  const handleGoogleError = () => {
    setLoginStatus('error');
    setErrorType('wrong_credentials');
    setErrorMessage('Google login failed. Please try again.');
  };

  const handleProgressStep = () => { if (authStep === 'email' && isEmailValid) setAuthStep('password'); };
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleFinalSubmit(e);
    }
  };
  const handleGoBack = () => { if (authStep === 'password') setAuthStep('email'); };

  useEffect(() => {
    if (authStep === 'password') setTimeout(() => passwordInputRef.current?.focus(), 300);
  }, [authStep]);

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

  return (
    <div
      className="min-h-screen w-screen flex flex-col relative overflow-hidden"
      style={{
        backgroundImage: 'url(/nilgiri-forest.webp)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Autofill styles and animations */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          50% { transform: translateX(5px); }
          75% { transform: translateX(-5px); }
        }
        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }
        input[type="password"]::-ms-reveal,
        input[type="password"]::-ms-clear { display: none !important; }
        input[type="password"]::-webkit-credentials-auto-fill-button,
        input[type="password"]::-webkit-strong-password-auto-fill-button { display: none !important; }
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus,
        input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 30px transparent inset !important;
          -webkit-text-fill-color: black !important;
          background-color: transparent !important;
          background-clip: content-box !important;
          transition: background-color 5000s ease-in-out 0s !important;
          color: black !important;
          caret-color: black !important;
        }
      `}</style>

      {/* ══ Centred content ══ */}
      <div className="relative z-10 flex flex-1 items-center justify-center px-6">
        <div className="relative w-[420px]">
          {/* Translucent blur box — independent decorative layer */}
          <div
            className="absolute -inset-x-16 -inset-y-12 rounded-[2.5rem] bg-white/10 backdrop-blur-2xl shadow-[0_8px_40px_rgba(0,0,0,0.12)]"
            style={{ pointerEvents: 'none' }}
          />

          {/* Form content — sits on top, independent of the box */}
          <fieldset disabled={loginStatus === 'loading' || loginStatus === 'success'} className="relative z-10 w-full" style={{ maxWidth: 420 }}>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center w-full gap-6 py-8"
            >
              {/* Heading */}
              <BlurFade delay={0.2} className="text-center w-full mb-4">
                <h1 className="text-3xl font-bold text-black tracking-tight mb-2" style={{ fontFamily: "var(--font-body)" }}>
                  Welcome Back
                </h1>
                <p className="text-[0.8rem] text-black/50 font-medium">
                  Sign in to continue to Admin Panel
                </p>
              </BlurFade>

              {/* Inputs — fill card content width */}
              <BlurFade delay={0.32} className="w-full flex flex-col gap-4 mb-4">
                <GlassInput
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (loginStatus === 'error') setLoginStatus('idle');
                  }}
                  onKeyDown={handleKeyDown}
                  icon={<Mail className="w-[1.1rem] h-[1.1rem]" />}
                  error={loginStatus === 'error' && (errorType === 'empty' || errorType === 'wrong_credentials' || errorType === 'not_admin')}
                  success={loginStatus === 'success'}
                  shake={shakeFields}
                  helperText={loginStatus === 'error' && errorType === 'not_admin' ? (errorMessage || 'Entered email is not an admin email') : undefined}
                />

                <GlassInput
                  inputRef={passwordInputRef}
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (loginStatus === 'error') setLoginStatus('idle');
                  }}
                  onKeyDown={handleKeyDown}
                  icon={
                    isPasswordValid
                      ? (
                        <button type="button" aria-label="Toggle password visibility"
                          onClick={() => setShowPassword(!showPassword)}
                          className="text-inherit hover:opacity-70 transition-opacity">
                          {showPassword ? <EyeOff className="w-[1.1rem] h-[1.1rem]" /> : <Eye className="w-[1.1rem] h-[1.1rem]" />}
                        </button>
                      )
                      : <Lock className="w-[1.1rem] h-[1.1rem] text-inherit" />
                  }
                  error={loginStatus === 'error' && (errorType === 'empty' || errorType === 'wrong_credentials')}
                  success={loginStatus === 'success'}
                  shake={shakeFields}
                  helperText={loginStatus === 'error' && errorType === 'wrong_credentials' ? (errorMessage || 'Login credentials are wrong') : undefined}
                />
              </BlurFade>

              {/* Sign in button */}
              <BlurFade delay={0.42} className="flex justify-center w-full mt-2">
                <button
                  type="button"
                  onClick={handleFinalSubmit}
                  className={cn(
                    "flex items-center justify-center gap-2 w-full py-4 rounded-full font-semibold",
                    "transition-all duration-300 active:scale-[0.97]",
                    loginStatus === 'loading' || loginStatus === 'success'
                      ? "bg-black/80 text-white cursor-wait"
                      : "bg-black text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 cursor-pointer"
                  )}
                >
                  {loginStatus === 'loading' ? <Loader className="w-6 h-6 animate-spin" /> : loginStatus === 'success' ? <Check className="w-6 h-6 text-emerald-400" /> : loginStatus === 'error' ? <X className="w-6 h-6 text-red-400" /> : <ArrowRight className="w-6 h-6" />}
                </button>
              </BlurFade>

              {/* Divider */}
              <BlurFade delay={0.52} className="w-[80%] flex items-center justify-center py-1 mt-2">
                <span className="text-[0.7rem] font-medium text-black/40 uppercase tracking-widest">or</span>
              </BlurFade>

              {/* Custom Google Button */}
              <BlurFade delay={0.62} className="flex justify-center mt-2 relative w-[48px] h-[48px]">
                {/* Visible Custom Button (Just a 'G' text) */}
                <div className="absolute inset-0 w-full h-full rounded-full flex items-center justify-center bg-white shadow-md text-black font-bold text-xl pointer-events-none select-none">
                  G
                </div>

                {/* Invisible Actual Google Login Button */}
                <div className="absolute inset-0 z-10 flex items-center justify-center cursor-pointer opacity-[0.01] overflow-hidden rounded-full">
                  <div style={{ transform: "scale(1.5)" }}>
                    <GoogleLogin
                      onSuccess={handleGoogleSuccess}
                      onError={handleGoogleError}
                      type="icon"
                      shape="circle"
                      size="large"
                    />
                  </div>
                </div>
              </BlurFade>
            </motion.div>
          </fieldset>
        </div>
      </div>
    </div>
  );
};

export default AuthComponent;