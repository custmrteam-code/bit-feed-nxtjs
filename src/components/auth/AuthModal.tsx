"use client";

// Login / sign-up modal, ported from the popup logic in layout/auth.js
// (initPopupLogic + verifyOTP). Exposes a context so any component (e.g. the
// header subscribe button) can open it via `useAuthModal().open()`.
//
// NOTE (fidelity caveat): the OTP is generated client-side and emailed via
// Apps Script, then compared in the browser — faithful to the legacy flow, but
// insecure. Flagged for future hardening (move generation/verification server
// side).

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  deleteUser,
  fetchSignInMethodsForEmail,
  signInAnonymously,
  updateEmail,
  updateProfile,
} from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { OTP_SCRIPT_URL } from "@/lib/env";
import { saveUserToDB } from "@/lib/data/users";
import { useAuth } from "@/components/auth/AuthProvider";
import { loginWithGoogle, loginWithTwitter } from "@/components/auth/auth-actions";

interface AuthModalContextValue {
  open: () => void;
  close: () => void;
}

const AuthModalContext = createContext<AuthModalContextValue | undefined>(
  undefined,
);

type View = "options" | "email" | "otp";

const OTP_LENGTH = 6;
const RESEND_SECONDS = 30;

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const { refreshRole } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<View>("options");
  const [isLoginMode, setIsLoginMode] = useState(false);
  const [email, setEmail] = useState("");
  const [newsletter, setNewsletter] = useState(false);
  const [otp, setOtp] = useState<string[]>(() => Array(OTP_LENGTH).fill(""));
  const [toast, setToast] = useState<string | null>(null);
  const [resendLeft, setResendLeft] = useState(0);

  const generatedOtp = useRef<string | null>(null);
  const resendTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  const showToast = useCallback((msg: string, hideAfter = 3000) => {
    setToast(msg);
    if (hideAfter) setTimeout(() => setToast(null), hideAfter);
  }, []);

  const reset = useCallback(() => {
    setView("options");
    setIsLoginMode(false);
    setEmail("");
    setNewsletter(false);
    setOtp(Array(OTP_LENGTH).fill(""));
    setToast(null);
    generatedOtp.current = null;
    if (resendTimer.current) clearInterval(resendTimer.current);
    setResendLeft(0);
  }, []);

  const open = useCallback(() => {
    reset();
    setIsOpen(true);
  }, [reset]);

  const close = useCallback(() => {
    setIsOpen(false);
    reset();
  }, [reset]);

  const startResendTimer = useCallback(() => {
    if (resendTimer.current) clearInterval(resendTimer.current);
    setResendLeft(RESEND_SECONDS);
    resendTimer.current = setInterval(() => {
      setResendLeft((prev) => {
        if (prev <= 1) {
          if (resendTimer.current) clearInterval(resendTimer.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const sendOtp = useCallback(
    (targetEmail: string) => {
      generatedOtp.current = Math.floor(
        100000 + Math.random() * 900000,
      ).toString();
      showToast("Sending Code...", 0);
      fetch(OTP_SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify({ email: targetEmail, otp: generatedOtp.current }),
      })
        .then((r) => r.text())
        .then(() => showToast("Code Sent!"))
        .catch((err) => {
          console.error("Error sending email:", err);
          alert("Could not send email. Check console.");
        });
    },
    [showToast],
  );

  const handleEmailSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = email.trim();
      if (!trimmed) return;
      setView("otp");
      sendOtp(trimmed);
      startResendTimer();
      // Focus the first OTP box after it renders.
      requestAnimationFrame(() => otpRefs.current[0]?.focus());
    },
    [email, sendOtp, startResendTimer],
  );

  const verifyOtp = useCallback(async () => {
    const entered = otp.join("");
    if (entered !== generatedOtp.current) {
      alert("Incorrect Code. Please try again.");
      setOtp(Array(OTP_LENGTH).fill(""));
      otpRefs.current[0]?.focus();
      return;
    }

    try {
      const result = await signInAnonymously(auth);
      const user = result.user;
      const userEmail = email.trim();
      const derivedName = userEmail.split("@")[0];
      const isSubscribed = !isLoginMode && newsletter;

      await user.getIdToken(true);
      await updateProfile(user, { displayName: derivedName });
      await updateEmail(user, userEmail); // throws if email already in use

      await saveUserToDB(
        { ...user, email: userEmail, displayName: derivedName },
        isSubscribed,
      );
      await refreshRole();
      close();
      if (isLoginMode) {
        alert("Welcome back! You have successfully signed in.");
      }
    } catch (error) {
      const err = error as { code?: string; message?: string };
      console.error("Link Error:", err.code);

      if (err.code === "auth/email-already-in-use") {
        try {
          const methods = await fetchSignInMethodsForEmail(auth, email.trim());
          if (methods?.includes("google.com")) {
            alert(
              `You already have an account with Google for ${email.trim()}. Please click 'Sign in with Google' instead.`,
            );
          } else {
            alert(
              `The email ${email.trim()} is already registered. Please sign in with your Password or Google account.`,
            );
          }
        } catch {
          alert(
            "This email is already registered. Please sign in using Google or your password.",
          );
        }
        // Clean up the temporary anonymous user so they aren't stuck.
        if (auth.currentUser) {
          try {
            await deleteUser(auth.currentUser);
          } catch (e) {
            console.debug("Cleanup error", e);
          }
        }
        close();
      } else if (err.code === "auth/operation-not-allowed") {
        alert(
          "Config Error: Please enable Anonymous Auth & Email Auth in Firebase Console.",
        );
      } else {
        alert("Error: " + err.message);
      }
    }
  }, [otp, email, isLoginMode, newsletter, refreshRole, close]);

  // Update a single OTP digit, auto-advancing and auto-verifying on the last.
  const setOtpDigit = useCallback(
    (index: number, raw: string) => {
      const digit = raw.replace(/[^0-9]/g, "").slice(-1);
      setOtp((prev) => {
        const next = [...prev];
        next[index] = digit;
        return next;
      });
      if (digit && index < OTP_LENGTH - 1) {
        otpRefs.current[index + 1]?.focus();
      }
      if (digit && index === OTP_LENGTH - 1) {
        setTimeout(verifyOtp, 100);
      }
    },
    [verifyOtp],
  );

  const handleOtpPaste = useCallback(
    (e: React.ClipboardEvent) => {
      e.preventDefault();
      const clean = e.clipboardData
        .getData("text")
        .replace(/[^0-9]/g, "")
        .slice(0, OTP_LENGTH);
      if (!clean) return;
      const next = Array(OTP_LENGTH).fill("");
      clean.split("").forEach((c, i) => (next[i] = c));
      setOtp(next);
      const nextIndex = Math.min(clean.length, OTP_LENGTH - 1);
      otpRefs.current[nextIndex]?.focus();
      if (clean.length === OTP_LENGTH) setTimeout(verifyOtp, 100);
    },
    [verifyOtp],
  );

  const toggleMode = useCallback(() => setIsLoginMode((m) => !m), []);

  const runOAuth = useCallback(
    async (fn: (sub: boolean) => Promise<void>) => {
      try {
        await fn(!isLoginMode && newsletter);
        await refreshRole();
        close();
      } catch (error) {
        const err = error as { code?: string; message?: string };
        if (err.code === "auth/popup-closed-by-user") return;
        console.error("Auth Error:", err);
        alert("Login Failed: " + err.message);
      }
    },
    [isLoginMode, newsletter, refreshRole, close],
  );

  const ctx = useMemo<AuthModalContextValue>(() => ({ open, close }), [
    open,
    close,
  ]);

  const verb = isLoginMode ? "Sign in" : "Sign up";

  return (
    <AuthModalContext.Provider value={ctx}>
      {children}

      <div
        className={`overlay${isOpen ? " active" : ""}`}
        onClick={(e) => {
          if (e.target === e.currentTarget) close();
        }}
      >
        <div className="popup pop-card">
          <div className="pop-header">
            <span className="pop-logo">
              b<span className="text-red">it</span>feed
            </span>
            <div className="close-icon-wrapper" onClick={close}>
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </div>
          </div>

          {view === "options" && (
            <div id="view-options">
              <div className="pop-body">
                <button
                  className="sm-btn"
                  onClick={() => runOAuth(loginWithGoogle)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/assets/google.svg" alt="Google" className="btn-icon" />
                  <span>{verb} with Google</span>
                </button>
                <button
                  className="sm-btn"
                  onClick={() => runOAuth(loginWithTwitter)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="https://img.icons8.com/?size=256w&id=xgCVUXwsgAmA&format=png"
                    alt="X"
                    className="btn-icon"
                  />
                  <span>{verb} with X</span>
                </button>
                {!isLoginMode && (
                  <button className="sm-btn" onClick={() => setView("email")}>
                    <svg
                      className="btn-icon email-icon"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="3" y="4" width="18" height="16" rx="2" ry="2" />
                      <path d="M16 2v4M8 2v4M3 10h18" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                    <span>Sign up with email</span>
                  </button>
                )}
              </div>
              <div className="pop-footer">
                <span>
                  {isLoginMode ? "New here? " : "Already have an account? "}
                </span>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    toggleMode();
                  }}
                >
                  {isLoginMode ? "Create an account" : "Sign in"}
                </a>
              </div>
            </div>
          )}

          {view === "email" && (
            <div id="view-email">
              <h3 className="pop-label">Your email</h3>
              <form className="pop-form" onSubmit={handleEmailSubmit}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="custmr.team@gmail.com"
                  className="pop-input"
                  required
                />
                <button type="submit" className="pop-btn-continue">
                  continue
                </button>
              </form>
              {!isLoginMode && (
                <p className="pop-info checkbox-row">
                  <input
                    type="checkbox"
                    id="newsletter-check"
                    className="pop-check"
                    checked={newsletter}
                    onChange={(e) => setNewsletter(e.target.checked)}
                  />
                  <label htmlFor="newsletter-check">
                    Join our mailing list to receive the latest scholarships news
                    and updates from our team.
                  </label>
                </p>
              )}
              <div className="pop-back-wrap">
                <span className="pop-back" onClick={() => setView("options")}>
                  back
                </span>
              </div>
            </div>
          )}

          {view === "otp" && (
            <div id="view-otp">
              <div className={`otp-toast${toast ? " show" : ""}`}>{toast}</div>
              <h2 className="otp-heading">
                VE<span className="text-red">RI</span>FY EM
                <span className="text-red">AI</span>L AD
                <span className="text-red">DRE</span>SS
              </h2>
              <p className="otp-subtext">
                OTP sent to{" "}
                <span
                  className="email-highlight"
                  onClick={() => setView("email")}
                >
                  {email}
                </span>
              </p>
              <div className="otp-input-group">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => {
                      otpRefs.current[i] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    className="otp-digit"
                    value={digit}
                    onChange={(e) => setOtpDigit(i, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Backspace" && !digit && i > 0) {
                        otpRefs.current[i - 1]?.focus();
                      }
                    }}
                    onPaste={handleOtpPaste}
                  />
                ))}
              </div>
              <button
                className="pop-btn-continue black-btn"
                onClick={verifyOtp}
              >
                {isLoginMode ? "Verify" : "Create"}
              </button>
              <div
                className={`resend-wrapper${resendLeft > 0 ? " disabled" : ""}`}
                onClick={() => {
                  if (resendLeft > 0 || !email.trim()) return;
                  sendOtp(email.trim());
                  showToast("Code Resent!", 2000);
                  startResendTimer();
                }}
              >
                <span>resend</span>
                <span id="resend-timer">
                  {resendLeft > 0
                    ? `(${resendLeft < 10 ? `0${resendLeft}` : resendLeft}s)`
                    : ""}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </AuthModalContext.Provider>
  );
}

export function useAuthModal(): AuthModalContextValue {
  const ctx = useContext(AuthModalContext);
  if (!ctx) throw new Error("useAuthModal must be used within <AuthModalProvider>");
  return ctx;
}
