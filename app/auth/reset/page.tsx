//Supabase Docs – Password reset email template uses {{ .ConfirmationURL }} - https://supabase.com/docs/guides/auth/auth-email-templates (Accessed: Feb 2026)
//ChatGPT was used as a development aid to:
//Tailor the reset-password update flow to this project’s UI patterns and Supabase Auth usage.

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../components/navbar";
import { supabase } from "../../../lib/supabaseClient";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (pw1.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      return;
    }
    if (pw1 !== pw2) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    setLoading(true);

    //Step 2: user sets new password (Supabase uses the recovery session created from the email link)
    const { error } = await supabase.auth.updateUser({ password: pw1 });

    setLoading(false);

    if (error) {
      console.error(error);
      setErrorMsg("Could not update password. Please try again.");
      return;
    }

    setSuccessMsg("Password updated. Redirecting to login…");
    setTimeout(() => router.push("/auth"), 1200);
  }

  return (
    <>
      <Navbar />

      <div style={{ maxWidth: "520px", margin: "90px auto 50px", padding: "0 16px" }}>
        <h1 style={{ marginBottom: "6px" }}>Choose a new password</h1>
        <p style={{ opacity: 0.8, marginTop: 0 }}>
          Enter a new password for your account.
        </p>

        <form onSubmit={handleUpdate} style={{ display: "grid", gap: "10px", marginTop: "14px" }}>
          <input
            value={pw1}
            onChange={(e) => setPw1(e.target.value)}
            placeholder="New password"
            type="password"
            style={{
              padding: "10px 12px",
              borderRadius: "10px",
              border: "1px solid #d1d5db",
            }}
          />
          <input
            value={pw2}
            onChange={(e) => setPw2(e.target.value)}
            placeholder="Confirm new password"
            type="password"
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
              background: "#10b981",
              color: "white",
              fontWeight: 800,
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Updating…" : "Update password"}
          </button>
        </form>

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
