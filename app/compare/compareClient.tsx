//Next.js Documentation – "useSearchParams" (App Router) - https://nextjs.org/docs/app/api-reference/functions/use-search-params
//Next.js Documentation – "useRouter" (App Router) - https://nextjs.org/docs/app/api-reference/functions/use-router
//Supabase. (2026). “Using Filters.” - https://supabase.com/docs/reference/javascript/using-filters
//ChatGPT was used as a development aid to:
//- Help design the compare flow (select 2–4 simulations, route to /compare?ids=...)
//- Assist with implementing URL parameter handling using useSearchParams
//- Suggest structured comparison table layout and difference-highlighting logic
//- Improve commenting and academic referencing structure for documentation

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

type SavedSimulationRow = {
  id: string;
  user_id: string;
  created_at: string;
  name: string | null;
    car_name: string | null; //optional

  finance_type: "loan" | "pcp";
  cash_price: number;
  deposit: number;
  apr: number;
  term_months: number;
  balloon: number | null;

  final_monthly_payment: number;
  total_interest: number;
  months_remaining: number;

  decisions: unknown;
};

//US-17 - Side-by-side comparison view
//Compare is limited to 4
const MAX_COMPARE = 4;

function formatEuro(n: number) {
  return `€${Number(n).toFixed(2)}`;
}

//US-17 - Side-by-side comparison view
export default function CompareClient() {
  const searchParams = useSearchParams();   //to read ?ids= from URL
  const idsParam = searchParams.get("ids") ?? "";   //comma separated list of simulation IDs to compare

  //Read and clean IDs from URL, limit to MAX_COMPARE
  const ids = useMemo(() => {
    const parts = idsParam
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    //Remove duplicates while preserving order, and limit to MAX_COMPARE
    return Array.from(new Set(parts)).slice(0, MAX_COMPARE);
  }, [idsParam]);

  const [loading, setLoading] = useState(true);
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [sims, setSims] = useState<SavedSimulationRow[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setErrorMsg(null);
      setAuthMessage(null);

      /**
        Auth gate: Your dashboard already requires login, but we keep this page safe if a user opens /compare directly. Supabase RLS should still enforce row access server-side.
       */
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (cancelled) return;

      if (authError) {
        setAuthMessage("We couldn’t check your login status. Please refresh and try again.");
        setLoading(false);
        return;
      }

      if (!user) {
        setAuthMessage("Please sign in to compare your saved simulations.");
        setLoading(false);
        return;
      }

      //Need at least 2 simulations to compare
      if (ids.length < 2) {
        setErrorMsg("Please select at least 2 simulations to compare.");
        setLoading(false);
        return;
      }

      /**
       * Fetch only the selected simulations:
       * Uses Supabase `filter()` to get rows where the ID is in our selected list.
       * The "in" syntax means: return rows whose id matches any of the selected IDs.
       * This method is shown in the Supabase JavaScript filter documentation.
       */
      const { data, error } = await supabase
        .from("saved_simulations")
        .select(
          "id, user_id, created_at, name, car_name, finance_type, cash_price, deposit, apr, term_months, balloon, final_monthly_payment, total_interest, months_remaining, decisions"
        )
        //Supabase filter syntax documented (PostgREST "in" style)
        .filter("id", "in", `(${ids.join(",")})`);

      if (cancelled) return;

      if (error) {
        console.error(error);
        setErrorMsg("Failed to load simulations for comparison.");
        setLoading(false);
        return;
      }

      const fetched = (data ?? []) as SavedSimulationRow[];

      // Re-order results to match selection order
      const byId = new Map(fetched.map((r) => [r.id, r]));
      const ordered = ids.map((id) => byId.get(id)).filter(Boolean) as SavedSimulationRow[];

      setSims(ordered);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [ids]);

  //Create a default name if none exists
  function fallbackName(r: SavedSimulationRow) {
    const date = new Date(r.created_at);
    const pretty = date.toLocaleString();
    return `Simulation (${pretty})`;
  }

  //Define the rows we want to compare, with a label and a function to get the value from a simulation
  const compareRows = useMemo(() => {
    return [
      { label: "Finance type", get: (r: SavedSimulationRow) => r.finance_type.toUpperCase() },
      { label: "Cash price", get: (r: SavedSimulationRow) => formatEuro(r.cash_price) },
      { label: "Deposit", get: (r: SavedSimulationRow) => formatEuro(r.deposit) },
      { label: "APR", get: (r: SavedSimulationRow) => `${Number(r.apr).toFixed(2)}%` },
      { label: "Term months", get: (r: SavedSimulationRow) => String(r.term_months) },
      {
        label: "Balloon",
        get: (r: SavedSimulationRow) =>
          r.finance_type === "pcp" ? formatEuro(Number(r.balloon ?? 0)) : "N/A",
      },
      { label: "Final monthly payment", get: (r: SavedSimulationRow) => formatEuro(r.final_monthly_payment) },
      { label: "Total interest", get: (r: SavedSimulationRow) => formatEuro(r.total_interest) },
      { label: "Months remaining", get: (r: SavedSimulationRow) => String(r.months_remaining) },
    ];
  }, []);

  function isDifferent(values: string[]) {
    return new Set(values).size > 1;
  }

  return (
    <>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "12px" }}>
        <div>
          <h1 style={{ marginBottom: "6px" }}>Compare Simulations</h1>
          <p style={{ opacity: 0.8, marginTop: 0 }}>Side-by-side view of how different decisions affect outcomes.</p>
        </div>

        <Link
          href="/dashboard/simulations"
          style={{
            display: "inline-block",
            padding: "10px 14px",
            borderRadius: "10px",
            border: "1px solid #d1d5db",
            background: "white",
            color: "#111827",
            textDecoration: "none",
            fontWeight: 700,
            height: "fit-content",
          }}
        >
          Back to dashboard
        </Link>
      </div>

      {loading && (
        <div style={{ padding: "14px", border: "1px solid #e5e7eb", borderRadius: "10px" }}>Loading…</div>
      )}

      {!loading && authMessage && (
        <div
          style={{
            padding: "16px",
            border: "1px solid #f59e0b",
            background: "#fffbeb",
            borderRadius: "12px",
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: "6px" }}>You’re not signed in</div>
          <div style={{ opacity: 0.85, marginBottom: "12px" }}>{authMessage}</div>
          <Link
            href="/auth"
            style={{
              display: "inline-block",
              padding: "10px 14px",
              borderRadius: "10px",
              background: "#3b82f6",
              color: "white",
              textDecoration: "none",
              fontWeight: 700,
            }}
          >
            Log in
          </Link>
        </div>
      )}

      {!loading && !authMessage && (
        <>
          {errorMsg && (
            <div
              style={{
                padding: "12px",
                border: "1px solid #ef4444",
                background: "#fef2f2",
                borderRadius: "10px",
                marginBottom: "12px",
              }}
            >
              {errorMsg}
            </div>
          )}

          {!errorMsg && sims.length >= 2 && (
            <div
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: "14px",
                background: "#fff",
                overflowX: "auto",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              }}
            >
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 800 }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left", padding: "12px", borderBottom: "1px solid #e5e7eb" }}>Field</th>
                    {sims.map((s) => (
                      <th
                        key={s.id}
                        style={{ textAlign: "left", padding: "12px", borderBottom: "1px solid #e5e7eb" }}
                      >
                        <div style={{ fontWeight: 800 }}>{s.name ?? fallbackName(s)}</div>
                        {s.car_name && (
                    <div style={{ fontSize: "0.85rem", opacity: 0.85, marginTop: "2px" }}>
                        <b>Car:</b> {s.car_name}
                    </div>
                    )}

                        <div style={{ fontSize: "0.85rem", opacity: 0.7, marginTop: "2px" }}>
                          {new Date(s.created_at).toLocaleString()} • {s.finance_type.toUpperCase()}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {compareRows.map((row) => {
                    const values = sims.map((s) => row.get(s));
                    const different = isDifferent(values);

                    return (
                      <tr key={row.label} style={{ background: different ? "#f9fafb" : "white" }}>
                        <td style={{ padding: "12px", borderBottom: "1px solid #f3f4f6", fontWeight: 700 }}>
                          {row.label}
                          {different && (
                            <span style={{ marginLeft: 8, fontSize: "0.8rem", opacity: 0.7 }}>(diff)</span>
                          )}
                        </td>

                        {values.map((v, idx) => (
                          <td key={idx} style={{ padding: "12px", borderBottom: "1px solid #f3f4f6" }}>
                            {v}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </>
  );
}
