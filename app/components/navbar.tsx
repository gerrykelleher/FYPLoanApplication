// Navbar layout and hover styling adapted from W3Schools CSS Navbar tutorial (2025)
// https://www.w3schools.com/css/css_navbar_horizontal.asp
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function Navbar() {
  const pathname = usePathname();
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    // Get current session on load
    supabase.auth.getSession().then(({ data }) => {
      setUserEmail(data.session?.user.email ?? null);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user.email ?? null);
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
      {/* CENTER NAV LINKS */}
      <div style={{ display: "flex", margin: "0 auto" }}>
        {[
          { href: "/", label: "Home" },
          { href: "/simulate/car", label: "Car Loan Simulator" },
          { href: "/simulate/mortgage", label: "Mortgage Simulator" },
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
        {userEmail ? (
          <>
            <span
              style={{
                ...linkStyle,
                backgroundColor: "#222",
                borderRadius: "999px",
                marginRight: "10px",
              }}
            >
              👤 {userEmail}
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
