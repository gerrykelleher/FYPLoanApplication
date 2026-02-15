import { Suspense } from "react";
import Navbar from "../components/navbar";
import CompareClient from "./compareClient";

export const dynamic = "force-dynamic";

export default function ComparePage() {
  return (
    <>
      <Navbar />

      <div style={{ maxWidth: "1100px", margin: "90px auto 50px", padding: "0 16px" }}>
        <Suspense
          fallback={
            <div style={{ padding: "14px", border: "1px solid #e5e7eb", borderRadius: "10px" }}>
              Loading…
            </div>
          }
        >
          <CompareClient />
        </Suspense>
      </div>
    </>
  );
}
