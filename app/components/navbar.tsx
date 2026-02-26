// Navbar layout and hover styling adapted from W3Schools CSS Navbar tutorial (2025)
// https://www.w3schools.com/css/css_navbar_horizontal.asp
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { User } from "@supabase/supabase-js";

export default function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Get current session on load
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const linkStyle: React.CSSProperties = {
    color: "white",
    padding: "14px 20px",
    textDecoration: "none",
    fontSize: "17px",
    fontWeight: 600,
    cursor: "pointer",
    display: "inline-block",
  };

  const activeStyle = { backgroundColor: "#0059c1" };
  const defaultStyle = { backgroundColor: "#333" };

  const displayName =
    user?.user_metadata?.username || user?.email || null;

  return (
    <div
      style={{
        backgroundColor: "#333",
        display: "flex",
        alignItems: "center",
        padding: "10px 0",
        position: "fixed",
        top: 0,
        width: "100%",
        zIndex: 1000,
      }}
    >
       {/* LEFT: BRAND */}
 <Link
  href="/"
  style={{
    display: "flex",
    alignItems: "center",
    gap: "12px",
    textDecoration: "none",
  }}
>
  <div
    style={{
      width: "36px",
      height: "36px",
      borderRadius: "10px",
      background: "linear-gradient(135deg, #3b82f6, #6366f1)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontWeight: 800,
      color: "white",
      fontSize: "15px",
      fontFamily: "Arial, sans-serif",
      boxShadow: "0 6px 14px rgba(59,130,246,0.25)",
    }}
  >
    SB
  </div>

  <span
    style={{
      fontWeight: 800,
      fontSize: "19px",
      letterSpacing: "-0.3px",
      fontFamily: "Arial, sans-serif",
      color: "white",
    }}
  >
    SmartBorrow
  </span>
</Link>
      {/* CENTER NAV LINKS */}
      <div style={{ display: "flex", margin: "0 auto" }}>
        {[
          { href: "/", label: "Home" },
          { href: "/simulate/car", label: "Car Loan Simulator" },
          { href: "/dashboard/simulations", label: "My Dashboard" },
        ].map(({ href, label }) => (
          <Link key={href} href={href}>
            <span
              style={{
                ...linkStyle,
                ...(pathname === href ? activeStyle : defaultStyle),
              }}
            >
              {label}
            </span>
          </Link>
        ))}
      </div>

      {/* RIGHT ACCOUNT AREA */}
      <div style={{ marginRight: "20px" }}>
        {user ? (
          <>
            <span
              style={{
                ...linkStyle,
                backgroundColor: "#222",
                borderRadius: "999px",
                marginRight: "10px",
              }}
            >
              👤 {displayName}
            </span>

            <span
              style={{
                ...linkStyle,
                borderRadius: "999px",
              }}
              onClick={async () => {
                await supabase.auth.signOut();
              }}
            >
              Logout
            </span>
          </>
        ) : (
          <Link href="/auth">
            <span
              style={{
                ...linkStyle,
                borderRadius: "999px",
              }}
            >
              👤 Account
            </span>
          </Link>
        )}
      </div>
    </div>
  );
}