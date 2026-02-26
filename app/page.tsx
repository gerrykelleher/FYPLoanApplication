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
    backgroundColor: "#f9fafb",
    minHeight: "100vh",
  };

  //Button style for navigation links
  const buttonStyle: CSSProperties = {
    display: "inline-block",
    margin: "10px",
    padding: "14px 28px",
    borderRadius: "8px",
    backgroundColor: "#0070f3",
    color: "white",
    textDecoration: "none",
    fontWeight: "bold",
    fontSize: "16px",
    transition: "all 0.3s ease",
    boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
  };

  return (
    <>
      {/* Global Navbar */}
      <Navbar />

      <div style={pageStyle}>

        {/* Top-right Account link */}
        <div style={{ position: "absolute", top: 20, right: 20 }}>
          <Link
            href="/auth"
            style={{
              display: "inline-block",
              backgroundColor: "#111827",
              color: "#fff",
              padding: "10px 16px",
              borderRadius: "999px",
              textDecoration: "none",
              fontWeight: 700,
              fontSize: "14px",
            }}
          >
            👤 Account
          </Link>
        </div>

        <h1 style={{ fontSize: "32px", color: "#111" }}>
          Financial Literacy Classroom Tool
        </h1>

        <p style={{ marginTop: "10px", color: "#444", fontSize: "17px" }}>
          Learn how borrowing and repayments work through interactive simulators.
        </p>

        {/*US-04 - A landing page where the user can select the car loan or mortgage simulator
        {/* Navigation Buttons */}
        <div style={{ marginTop: "50px" }}>
          <Link href="/simulate/car" style={buttonStyle} className="navBtn">
            🚗 Car Finance Simulator
          </Link>

           <Link href="/dashboard/simulations" style={buttonStyle} className="navBtn">
    📊 Dashboard (Saved Simulations)
  </Link>
</div>

        {/* Learn more link */}
        <div style={{ marginTop: "30px" }}>
          <Link
            href="/learn-more"
            style={{
              display: "inline-block",
              backgroundColor: "#e5e7eb",
              color: "#333",
              padding: "10px 20px",
              borderRadius: "6px",
              textDecoration: "none",
              fontWeight: "600",
              fontSize: "15px",
            }}
          >
            ℹ️ Learn More
          </Link>
        </div>

        {/* About / Extra info */}
        <div style={{ marginTop: "60px", fontSize: "15px", color: "#555" }}>
          <p>
            Educational simulator built for financial literacy classes in Ireland.
          </p>
        </div>

        {/* Hover and focus effects only for main buttons */}
        <style jsx>{`
          .navBtn:hover {
            background-color: #0059c1;
            transform: scale(1.05);
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
            color: #fff;
          }
          .navBtn:focus {
            outline: 2px solid #0059c1;
            outline-offset: 2px;
          }
        `}</style>
      </div>
    </>
  );
}
