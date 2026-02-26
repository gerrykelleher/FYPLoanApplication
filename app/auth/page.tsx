//Authentication UI adapted from GeeksforGeeks sliding login/register template
//Authentication logic adapted using ChatGPT based on official Supabase documentation:
//https://supabase.com/docs/guides/auth
//https://supabase.com/docs/reference/javascript/auth-signinwithpassword
//https://www.scribd.com/document/883924715/Design-a-Responsive-Sliding-Login-Registration-Form-Using-HTML-CSS-JavaScript-GeeksforGeeks

"use client"; //this is a client component

import { useState } from "react";
import type { FormEvent } from "react";
import "./auth.css";
import Navbar from "../components/navbar";
import { supabase } from "@/lib/supabaseClient"; //authentication client

//US-11 - Account creation / log in
export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login"); //mode toggle (login/register)
  const [username, setUsername] = useState(""); //username for registration
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null); //feedback message
  const [loading, setLoading] = useState(false);

  //handles form submission for both login and registration
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);

    //whitespace trimming
    const cleanEmail = email.trim();
    const cleanPassword = password.trim();
    const cleanUsername = username.trim();

    try {
      if (mode === "register") {
        //register new user
        const { error } = await supabase.auth.signUp({
          email: cleanEmail,
          password: cleanPassword,
          options: {
            data: {
              username: cleanUsername || null, //store username in user_metadata
            },
          },
        });
        //set feedback message (error or success)
        setMsg(
          error ? error.message : "Registered! Check your email to confirm (if enabled)."
        );
      } else {
        //login existing user
        const { error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: cleanPassword,
        });
        setMsg(error ? error.message : "Logged in!");
      }
    } finally {
      //stop loading when request is finished
      setLoading(false);
    }
  }

  return (
    <>
      <Navbar />
      <div style={{ height: "90px" }} />

      <div className="auth-page">
        <div className={`auth-container ${mode === "register" ? "active" : ""}`}>
          {/* LOGIN */}
          <div className="form-container sign-in">
            <form onSubmit={handleSubmit}>
              <h1>Sign In</h1>
              <span>Use your email and password</span>

              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />

              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete={mode === "login" ? "current-password" : "new-password"}
              />

              {/* Forgot password link */}
              <div style={{ width: "100%", textAlign: "right", marginTop: "6px" }}>
                <a
                  href="/auth/forgot"
                  style={{ fontSize: "0.9rem", opacity: 0.85, textDecoration: "underline" }}
                >
                  Forgot password?
                </a>
              </div>

              <button type="submit" disabled={loading}>
                {loading ? "Please wait..." : "Login"}
              </button>

              {msg && <p className="msg">{msg}</p>}
            </form>
          </div>

          {/* REGISTER */}
          <div className="form-container sign-up">
            <form onSubmit={handleSubmit}>
              <h1>Create Account</h1>
              <span>Register with email and password</span>

              {/* Username field */}
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
              />

              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />

              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
              />

              <button type="submit" disabled={loading}>
                {loading ? "Please wait..." : "Register"}
              </button>

              {msg && <p className="msg">{msg}</p>}
            </form>
          </div>

          {/* TOGGLE PANEL */}
          <div className="toggle-container">
            <div className="toggle">
              <div className="toggle-panel toggle-left">
                <h1>Welcome back!</h1>
                <p>Already have an account? Log in to save simulations.</p>
                <button
                  type="button"
                  className="ghost"
                  onClick={() => {
                    setMsg(null);
                    setMode("login");
                    setUsername(""); //optional: clear username when switching to login
                  }}
                >
                  Sign In
                </button>
              </div>

              <div className="toggle-panel toggle-right">
                <h1>Welcome!</h1>
                <p>Don't have an account? Register to save simulations.</p>
                <button
                  type="button"
                  className="ghost"
                  onClick={() => {
                    setMsg(null);
                    setMode("register");
                  }}
                >
                  Register
                </button>
              </div>
            </div>
          </div>
        </div>

        <p className="note">You can still use the simulator without logging in.</p>
      </div>
    </>
  );
}