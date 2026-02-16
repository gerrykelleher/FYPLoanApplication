//Supabase JS Reference – "resetPasswordForEmail" - https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail  (Accessed: Feb 2026)
//Supabase Docs – "Email Templates" (Reset password + ConfirmationURL variable) - https://supabase.com/docs/guides/auth/auth-email-templates (Accessed: Feb 2026)
//ChatGPT was used as a development aid to:
//Tailor Supabase password reset flow to this project’s Next.js App Router structure and existing Navbar layout.

"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "../../components/navbar";
import { supabase } from "../../../lib/supabaseClient";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const trimmed = email.trim();
    if (!trimmed) {
      setErrorMsg("Please enter your email address.");
      return;
    }

    setLoading(true);

    //Step 1: Send user reset email (Supabase handles token + email template)
    const { error } = await supabase.auth.resetPasswordForEmail(trimmed, {
      redirectTo: `${window.location.origin}/auth/reset`,
    });

    setLoading(false);

    if (error) {
      console.error(error);
      setErrorMsg("Could not send reset email. Please try again.");
      return;
    }

    setSuccessMsg("If an account exists for this email, a reset link has been sent.");
  }

  return (
    <>
      <Navbar />

      <div style={{ maxWidth: "520px", margin: "90px auto 50px", padding: "0 16px" }}>
        <h1 style={{ marginBottom: "6px" }}>Reset your password</h1>
        <p style={{ opacity: 0.8, marginTop: 0 }}>
          Enter your email and we’ll send you a password reset link.
        </p>

        <form onSubmit={handleSend} style={{ display: "grid", gap: "10px", marginTop: "14px" }}>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            type="email"
            style={{
              padding: "10px 12px",
              borderRadius: "10px",
              border: "1px solid #d1d5db",
            }}
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "10px 12px",
              borderRadius: "10px",
              border: "none",
              cursor: loading ? "default" : "pointer",
              background: "#3b82f6",
              color: "white",
              fontWeight: 800,
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Sending…" : "Send reset link"}
          </button>
        </form>

        <div style={{ marginTop: "12px" }}>
          <Link href="/auth" style={{ textDecoration: "none" }}>
            ← Back to login
          </Link>
        </div>

        {errorMsg && (
          <div
            style={{
              marginTop: "14px",
              padding: "12px",
              border: "1px solid #ef4444",
              background: "#fef2f2",
              borderRadius: "10px",
            }}
          >
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div
            style={{
              marginTop: "14px",
              padding: "12px",
              border: "1px solid #22c55e",
              background: "#dcfce7",
              borderRadius: "10px",
            }}
          >
            {successMsg}
          </div>
        )}
      </div>
    </>
  );
}
