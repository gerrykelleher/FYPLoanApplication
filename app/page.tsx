//Code adapted from W3Schools (2025) React Router and Styling Examples
// https://www.w3schools.com/react/react_router.asp
// https://www.w3schools.com/react/react_styling.asp

"use client";
import Link from "next/link";
import type { CSSProperties } from "react";
import Navbar from "./components/navbar";

//US-04 - A landing page where the user can select the car loan or mortgage simulator
export default function Home() {
  //Page layout and typography
  const pageStyle: CSSProperties = {
    position: "relative",
    textAlign: "center",
    fontFamily: "Arial, sans-serif",
    padding: "120px 20px 60px", // extra top padding for fixed navbar
    background:
      "radial-gradient(1200px 600px at 50% 0%, rgba(59,130,246,0.12), transparent 55%), #f9fafb",
    minHeight: "100vh",
  };

  //Primary button style for navigation links
  const buttonStyle: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    margin: "10px",
    padding: "14px 22px",
    borderRadius: "12px",
    backgroundColor: "#3b82f6",
    color: "white",
    textDecoration: "none",
    fontWeight: 800,
    fontSize: "16px",
    transition: "transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease",
    boxShadow: "0 8px 20px rgba(59,130,246,0.18)",
    border: "1px solid rgba(59,130,246,0.35)",
    minWidth: "240px",
  };

  //Secondary button style
  const secondaryButtonStyle: CSSProperties = {
    ...buttonStyle,
    backgroundColor: "#111827",
    border: "1px solid rgba(17,24,39,0.35)",
    boxShadow: "0 8px 20px rgba(17,24,39,0.14)",
  };

  const cardStyle: CSSProperties = {
    maxWidth: "920px",
    margin: "26px auto 0",
    padding: "26px",
    borderRadius: "18px",
    backgroundColor: "#ffffff",
    border: "1px solid #e5e7eb",
    boxShadow: "0 10px 24px rgba(0,0,0,0.06)",
  };

  const featureGridStyle: CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "14px",
    marginTop: "18px",
    textAlign: "left",
  };

  const featureItemStyle: CSSProperties = {
    border: "1px solid #e5e7eb",
    background: "#f9fafb",
    borderRadius: "14px",
    padding: "14px 14px",
  };

  return (
    <>
      {/* Global Navbar */}
      <Navbar />

      <div style={pageStyle}>
        {/* SmartBorrow header */}
        <div style={{ maxWidth: "920px", margin: "0 auto" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "10px",
              padding: "8px 12px",
              borderRadius: "999px",
              backgroundColor: "rgba(59,130,246,0.12)",
              border: "1px solid rgba(59,130,246,0.25)",
              color: "#1d4ed8",
              fontWeight: 800,
              fontSize: "14px",
            }}
          >
            ✅ Classroom-ready • Scenario-based learning
          </div>

          <h1 style={{ fontSize: "44px", fontWeight: 900, marginTop: "18px", marginBottom: "10px", color: "#111827" }}>
            SmartBorrow
          </h1>

          <p style={{ fontSize: "18px", marginTop: "0px", color: "#374151", lineHeight: 1.55 }}>
            Make smarter borrowing decisions through interactive simulation.
            <br />
            Learn how repayments, interest, and term changes behave in real life.
          </p>

          {/* Primary CTAs */}
          <div
            style={{
              marginTop: "26px",
              display: "flex",
              flexWrap: "wrap",
              gap: "12px",
              justifyContent: "center",
            }}
          >
            <Link href="/simulate/car" style={buttonStyle} className="navBtn primaryBtn">
              🚗 Start Car Finance Simulator
            </Link>

            <Link href="/dashboard/simulations" style={secondaryButtonStyle} className="navBtn secondaryBtn">
              📊 Open Dashboard
            </Link>
          </div>

          {/* Supporting links */}
          <div style={{ marginTop: "18px", display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link
              href="/learn-more"
              className="learnLink"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                backgroundColor: "#ffffff",
                color: "#111827",
                padding: "10px 14px",
                borderRadius: "999px",
                textDecoration: "none",
                fontWeight: 800,
                fontSize: "14px",
                border: "1px solid #e5e7eb",
                boxShadow: "0 6px 14px rgba(0,0,0,0.05)",
              }}
            >
              ℹ️ Learn More
              <span style={{ opacity: 0.7 }}>→</span>
            </Link>

            <Link
              href="/auth"
              className="learnLink"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                backgroundColor: "#ffffff",
                color: "#111827",
                padding: "10px 14px",
                borderRadius: "999px",
                textDecoration: "none",
                fontWeight: 800,
                fontSize: "14px",
                border: "1px solid #e5e7eb",
                boxShadow: "0 6px 14px rgba(0,0,0,0.05)",
              }}
            >
              👤 Account
              <span style={{ opacity: 0.7 }}>→</span>
            </Link>
          </div>

          {/* What it does (simple, demo-friendly) */}
          <div style={cardStyle}>
            <div style={{ fontWeight: 900, fontSize: "18px", color: "#111827" }}>
              What you can do in SmartBorrow
            </div>
            <div style={{ opacity: 0.75, marginTop: "6px", color: "#374151" }}>
              Built to help students understand borrowing decisions.
            </div>

            <div style={featureGridStyle}>
              <div style={featureItemStyle}>
                <div style={{ fontWeight: 900, marginBottom: "4px" }}>Scenario simulation</div>
                <div style={{ opacity: 0.8, lineHeight: 1.45 }}>
                  Make real-life decisions and watch repayments change instantly.
                </div>
              </div>

              <div style={featureItemStyle}>
                <div style={{ fontWeight: 900, marginBottom: "4px" }}>Graphical insights</div>
                <div style={{ opacity: 0.8, lineHeight: 1.45 }}>
                  Track monthly payment trends and the impact of each choice.
                </div>
              </div>

              <div style={featureItemStyle}>
                <div style={{ fontWeight: 900, marginBottom: "4px" }}>Save & compare</div>
                <div style={{ opacity: 0.8, lineHeight: 1.45 }}>
                  Save simulations and compare outcomes side-by-side.
                </div>
              </div>

              <div style={featureItemStyle}>
                <div style={{ fontWeight: 900, marginBottom: "4px" }}>Classroom-focused</div>
                <div style={{ opacity: 0.8, lineHeight: 1.45 }}>
                  Designed for financial literacy learning in Ireland.
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ marginTop: "46px", fontSize: "14px", color: "#6b7280" }}>
            © 2026 <b>SmartBorrow</b> — Educational simulator for financial literacy classes in Ireland.
          </div>
        </div>

        {/* Hover and focus effects only for main buttons */}
        <style jsx>{`
          .primaryBtn:hover {
            background-color: #2563eb;
            transform: translateY(-2px);
            box-shadow: 0 14px 28px rgba(59, 130, 246, 0.22);
            color: #fff;
          }
          .secondaryBtn:hover {
            background-color: #0b1220;
            transform: translateY(-2px);
            box-shadow: 0 14px 28px rgba(17, 24, 39, 0.18);
            color: #fff;
          }
          .navBtn:focus {
            outline: 2px solid #2563eb;
            outline-offset: 3px;
          }
          .learnLink:hover {
            transform: translateY(-1px);
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.08);
          }
          .learnLink:focus {
            outline: 2px solid #2563eb;
            outline-offset: 3px;
          }
        `}</style>
      </div>
    </>
  );
}