//Navbar layout and hover styling adapted from W3Schools CSS Navbar tutorial (2025)
//https://www.w3schools.com/css/css_navbar_horizontal.asp
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  const linkStyle: React.CSSProperties = {
    color: "white",
    textAlign: "center" as const,
    padding: "14px 20px",
    textDecoration: "none",
    fontSize: "17px",
    fontWeight: 600,
    transition: "background-color 0.2s ease, color 0.2s ease",
    cursor: "pointer",
    display: "inline-block",
  };

  const activeStyle = {
    backgroundColor: "#0059c1",
  };

  const defaultStyle = {
    backgroundColor: "#333",
  };

  return (
    <div
      style={{
        backgroundColor: "#333",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        padding: "10px 0",
        position: "fixed",
        top: "0",
        width: "100%",
        zIndex: 1000,
      }}
    >
      {/* LEFT SIDE NAV LINKS (unchanged) */}
      <div style={{ display: "flex" }}>
        <Link href="/" passHref>
          <span
            style={{
              ...linkStyle,
              ...(pathname === "/" ? activeStyle : defaultStyle),
            }}
            onMouseOver={(e) => {
              (e.target as HTMLElement).style.backgroundColor = "#444";
            }}
            onMouseOut={(e) => {
              (e.target as HTMLElement).style.backgroundColor =
                pathname === "/" ? "#0059c1" : "#333";
            }}
          >
            Home
          </span>
        </Link>

        <Link href="/simulate/car" passHref>
          <span
            style={{
              ...linkStyle,
              ...(pathname === "/simulate/car" ? activeStyle : defaultStyle),
            }}
            onMouseOver={(e) => {
              (e.target as HTMLElement).style.backgroundColor = "#444";
            }}
            onMouseOut={(e) => {
              (e.target as HTMLElement).style.backgroundColor =
                pathname === "/simulate/car" ? "#0059c1" : "#333";
            }}
          >
            Car Loan Simulator
          </span>
        </Link>

        <Link href="/simulate/mortgage" passHref>
          <span
            style={{
              ...linkStyle,
              ...(pathname === "/simulate/mortgage"
                ? activeStyle
                : defaultStyle),
            }}
            onMouseOver={(e) => {
              (e.target as HTMLElement).style.backgroundColor = "#444";
            }}
            onMouseOut={(e) => {
              (e.target as HTMLElement).style.backgroundColor =
                pathname === "/simulate/mortgage" ? "#0059c1" : "#333";
            }}
          >
            Mortgage Simulator
          </span>
        </Link>
      </div>

      {/*Account Link*/}
      <div style={{ marginLeft: "auto", marginRight: "20px" }}>
        <Link href="/auth" passHref>
          <span
            style={{
              ...linkStyle,
              ...(pathname === "/auth" ? activeStyle : defaultStyle),
              borderRadius: "999px",
            }}
            onMouseOver={(e) => {
              (e.target as HTMLElement).style.backgroundColor = "#444";
            }}
            onMouseOut={(e) => {
              (e.target as HTMLElement).style.backgroundColor =
                pathname === "/auth" ? "#0059c1" : "#333";
            }}
          >
            👤 Account
          </span>
        </Link>
      </div>
    </div>
  );
}
