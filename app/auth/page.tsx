//Authentication logic adapted using ChatGPT
//based on official Supabase documentation:
//https://supabase.com/docs/guides/auth
//https://supabase.com/docs/reference/javascript/auth-signinwithpassword
"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setMsg(null);

    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    if (mode === "register") {
      const { error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: cleanPassword,
      });
      setMsg(
        error
          ? error.message
          : "Registered! Check your email to confirm (if enabled)."
      );
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPassword,
      });
      setMsg(error ? error.message : "Logged in!");
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: "80px auto", padding: 20 }}>
      <h1>{mode === "login" ? "Login" : "Register"}</h1>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 10 }}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ padding: 10 }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ padding: 10 }}
        />
        <button type="submit" style={{ padding: 10 }}>
          {mode === "login" ? "Login" : "Create account"}
        </button>
      </form>

      <button
        onClick={() => setMode(mode === "login" ? "register" : "login")}
        style={{ marginTop: 12 }}
      >
        Switch to {mode === "login" ? "Register" : "Login"}
      </button>

      {msg && <p style={{ marginTop: 12 }}>{msg}</p>}
    </div>
  );
}
