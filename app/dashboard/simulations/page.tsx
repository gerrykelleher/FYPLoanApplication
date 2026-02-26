//Dashboard page for managing saved simulations
//CRUD (Create, Read, Update, Delete) structure inspired by:
//Blackslate – "Build CRUD React App with Supabase" - https://www.blackslate.io/articles/build-curd-react-app-with-supabase
//ChatGPT was used as a development aid to: Adapt generic CRUD patterns to the saved simulations schema, assist with React state management and UI logic and to help integrate Supabase Auth with Row Level Security (RLS)
"use client";

import { useEffect, useMemo, useState } from "react";
import Navbar from "../../components/navbar";
import { supabase } from "../../../lib/supabaseClient";
import Link from "next/link";
import { useRouter } from "next/navigation";

type SavedSimulationRow = {
  id: string;
  user_id: string;
  created_at: string;

  //user defined name for simulation
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
  payment_history: number[] | null;
};

//Small sparkline component for payment trend
function Sparkline({
  values,
  width = 260,
  height = 70,
}: {
  values: number[] | null;
  width?: number;
  height?: number;
}) {
  const clean = (values ?? []).filter((v) => typeof v === "number" && Number.isFinite(v));

  if (clean.length < 2) {
    return <div style={{ fontSize: "0.85rem", opacity: 0.6 }}>No trend yet</div>;
  }

  const min = Math.min(...clean);
  const max = Math.max(...clean);
  const range = max - min || 1;

  const points = clean
    .map((v, i) => {
      const x = (i / (clean.length - 1)) * width;
      const y = height - ((v - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");

  const last = clean[clean.length - 1];
  const lastY = height - ((last - min) / range) * height;

  return (
    <svg width={width} height={height} style={{ display: "block" }}>
      <polyline fill="none" stroke="#3b82f6" strokeWidth="2" points={points} />
      <circle cx={width} cy={lastY} r="3" fill="#3b82f6" />
    </svg>
  );
}

//Dashboard page component
export default function DashboardPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [authMessage, setAuthMessage] = useState<string | null>(null);

  const [rows, setRows] = useState<SavedSimulationRow[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  //UI state
  const [expandedId, setExpandedId] = useState<string | null>(null);

  //Inline edit state (rename)
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nameDraft, setNameDraft] = useState("");

  //Optional search
  const [search, setSearch] = useState("");

  //Compare selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [compareMsg, setCompareMsg] = useState<string | null>(null);
  const MAX_COMPARE = 4;

  //Fetch user + their saved simulations
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setErrorMsg(null);
      setAuthMessage(null);

      //US-16 - Simple dashboard for saved simulations
      //1. Auth check (Supabase Auth getUser), must be logged in to save
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (cancelled) return;

      if (authError) {
        setLoading(false);
        setAuthMessage("We couldn’t check your login status. Please refresh and try again.");
        console.error(authError);
        return;
      }

      if (!user) {
        setLoading(false);
        setAuthMessage("Please sign in to view your dashboard and save simulations.");
        return;
      }

      //US-16 - Simple dashboard for saved simulations
      //2. Select this user's saved simulations (RLS also enforces this on the server)
      const { data, error } = await supabase
        .from("saved_simulations")
        .select(
          "id, user_id, created_at, name, car_name, finance_type, cash_price, deposit, apr, term_months, balloon, final_monthly_payment, total_interest, months_remaining, decisions, payment_history"
        )
        .order("created_at", { ascending: false });

      if (cancelled) return;

      if (error) {
        setErrorMsg("Failed to load saved simulations. Check console.");
        console.error(error);
        setRows([]);
        setLoading(false);
        return;
      }

      setRows((data ?? []) as SavedSimulationRow[]);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  //Keep compare selections valid if rows change (e.g., deleted)
  useEffect(() => {
    setSelectedIds((prev) => prev.filter((id) => rows.some((r) => r.id === id)));
  }, [rows]);

  function toggleSelected(id: string) {
    setCompareMsg(null);

    setSelectedIds((prev) => {
      const already = prev.includes(id);

      if (already) return prev.filter((x) => x !== id);

      if (prev.length >= MAX_COMPARE) {
        setCompareMsg(`You can compare up to ${MAX_COMPARE} simulations.`);
        return prev;
      }

      return [...prev, id];
    });
  }

  //Filtered rows based on search
  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;

    return rows.filter((r) => {
      const name = (r.name ?? "").toLowerCase();
      const type = r.finance_type.toLowerCase();
      const car = (r.car_name ?? "").toLowerCase();
      return (
        name.includes(q) ||
        type.includes(q) ||
        car.includes(q) ||
        r.id.toLowerCase().includes(q)
      );
    });
  }, [rows, search]);

  //Create a default name if none exists
  function fallbackName(r: SavedSimulationRow) {
    const date = new Date(r.created_at);
    const pretty = date.toLocaleString();
    return `Simulation (${pretty})`;
  }

  //Start rename
  function beginRename(r: SavedSimulationRow) {
    setEditingId(r.id);
    setNameDraft(r.name ?? fallbackName(r));
  }

  //Cancel rename
  function cancelRename() {
    setEditingId(null);
    setNameDraft("");
  }

  //Save rename (UPDATE)
  async function saveRename(id: string) {
    setErrorMsg(null);

    const trimmed = nameDraft.trim();
    if (!trimmed) {
      setErrorMsg("Name cannot be empty.");
      return;
    }

    //update in Supabase
    const { error } = await supabase.from("saved_simulations").update({ name: trimmed }).eq("id", id);

    if (error) {
      setErrorMsg("Failed to rename. Check console.");
      console.error(error);
      return;
    }

    //update locally
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, name: trimmed } : r)));
    cancelRename();
  }

  //Delete
  async function deleteSimulation(id: string) {
    setErrorMsg(null);

    const ok = window.confirm("Delete this simulation? This cannot be undone.");
    if (!ok) return;

    const { error } = await supabase.from("saved_simulations").delete().eq("id", id);

    if (error) {
      setErrorMsg("Failed to delete. Check console.");
      console.error(error);
      return;
    }

    //Remove locally
    setRows((prev) => prev.filter((r) => r.id !== id));
    if (expandedId === id) setExpandedId(null);
    if (editingId === id) cancelRename();
  }

  //Show decisions
  function renderDecisions(decisions: unknown) {
    if (Array.isArray(decisions)) {
      return (
        <ul style={{ margin: 0, paddingLeft: "18px" }}>
          {decisions.map((d, i) => (
            <li key={i}>{String(d)}</li>
          ))}
        </ul>
      );
    }
    //fallback
    return <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>{JSON.stringify(decisions, null, 2)}</pre>;
  }

  return (
    <>
      <Navbar />

      <div style={{ maxWidth: "1000px", margin: "90px auto 50px", padding: "0 16px" }}>
        <h1 style={{ marginBottom: "6px" }}>Your Dashboard</h1>
        <p style={{ opacity: 0.8, marginTop: 0 }}>View, rename, and delete your saved simulations.</p>

        {loading && (
          <div style={{ padding: "14px", border: "1px solid #e5e7eb", borderRadius: "10px" }}>
            Loading…
          </div>
        )}

        {/* Login button when not signed in */}
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

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
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

              <Link
                href="/auth"
                style={{
                  display: "inline-block",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  border: "1px solid #d1d5db",
                  background: "white",
                  color: "#111827",
                  textDecoration: "none",
                  fontWeight: 700,
                }}
              >
                Create account
              </Link>
            </div>

            <div style={{ marginTop: "10px", fontSize: "0.9rem", opacity: 0.8 }}>
              Once you’re signed in, your saved simulations will appear here.
            </div>
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

            <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "12px" }}>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name / car / type / id…"
                style={{
                  flex: 1,
                  padding: "10px 12px",
                  borderRadius: "10px",
                  border: "1px solid #d1d5db",
                }}
              />
              <div style={{ fontSize: "0.9rem", opacity: 0.75 }}>{filteredRows.length} saved</div>
            </div>

            {/* Compare controls */}
            <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "12px", flexWrap: "wrap" }}>
              <button
                onClick={() => router.push(`/compare?ids=${selectedIds.join(",")}`)}
                disabled={selectedIds.length < 2}
                style={{
                  padding: "10px 12px",
                  borderRadius: "10px",
                  border: "none",
                  cursor: selectedIds.length < 2 ? "not-allowed" : "pointer",
                  background: selectedIds.length < 2 ? "#9ca3af" : "#111827",
                  color: "white",
                  fontWeight: 700,
                }}
              >
                Compare ({selectedIds.length})
              </button>

              <button
                onClick={() => {
                  setSelectedIds([]);
                  setCompareMsg(null);
                }}
                disabled={selectedIds.length === 0}
                style={{
                  padding: "10px 12px",
                  borderRadius: "10px",
                  border: "1px solid #d1d5db",
                  cursor: selectedIds.length === 0 ? "not-allowed" : "pointer",
                  background: "white",
                  fontWeight: 700,
                }}
              >
                Clear
              </button>

              <div style={{ fontSize: "0.9rem", opacity: 0.75 }}>Select 2–{MAX_COMPARE} simulations to compare.</div>
            </div>

            {compareMsg && (
              <div
                style={{
                  padding: "12px",
                  border: "1px solid #f59e0b",
                  background: "#fffbeb",
                  borderRadius: "10px",
                  marginBottom: "12px",
                }}
              >
                {compareMsg}
              </div>
            )}

            {filteredRows.length === 0 ? (
              <div style={{ padding: "14px", border: "1px solid #e5e7eb", borderRadius: "10px" }}>
                No saved simulations found.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {filteredRows.map((r) => {
                  const isExpanded = expandedId === r.id;
                  const isEditing = editingId === r.id;

                  return (
                    <div
                      key={r.id}
                      style={{
                        border: "1px solid #e5e7eb",
                        borderRadius: "14px",
                        background: "#fff",
                        padding: "14px 14px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                      }}
                    >
                      {/* Top row */}
                      <div style={{ display: "flex", gap: "12px", justifyContent: "space-between", alignItems: "flex-start" }}>
                        {/* Compare checkbox */}
                        {!isEditing && (
                          <div style={{ paddingTop: "4px" }}>
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(r.id)}
                              onChange={() => toggleSelected(r.id)}
                              aria-label="Select for comparison"
                              style={{ width: "18px", height: "18px", cursor: "pointer" }}
                            />
                          </div>
                        )}

                        <div style={{ flex: 1 }}>
                          {!isEditing ? (
                            <>
                              <div style={{ fontWeight: 700, fontSize: "1.05rem" }}>
                                {r.name ?? fallbackName(r)}
                              </div>
                              <div style={{ fontSize: "0.85rem", opacity: 0.7, marginTop: "2px" }}>
                                {new Date(r.created_at).toLocaleString()} • {r.finance_type.toUpperCase()}
                              </div>

                              <div style={{ fontSize: "0.9rem", opacity: 0.85, marginTop: "2px" }}>
                                <b>Car:</b> {r.car_name ?? "Not specified"}
                              </div>
                            </>
                          ) : (
                            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                              <input
                                value={nameDraft}
                                onChange={(e) => setNameDraft(e.target.value)}
                                style={{
                                  flex: 1,
                                  padding: "10px 12px",
                                  borderRadius: "10px",
                                  border: "1px solid #d1d5db",
                                }}
                              />
                              <button
                                onClick={() => saveRename(r.id)}
                                style={{
                                  padding: "10px 12px",
                                  borderRadius: "10px",
                                  border: "none",
                                  cursor: "pointer",
                                  background: "#10b981",
                                  color: "white",
                                  fontWeight: 600,
                                }}
                              >
                                Save
                              </button>
                              <button
                                onClick={cancelRename}
                                style={{
                                  padding: "10px 12px",
                                  borderRadius: "10px",
                                  border: "1px solid #d1d5db",
                                  cursor: "pointer",
                                  background: "white",
                                  fontWeight: 600,
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        {!isEditing && (
                          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                            <button
                              onClick={() => setExpandedId(isExpanded ? null : r.id)}
                              style={{
                                padding: "10px 12px",
                                borderRadius: "10px",
                                border: "1px solid #d1d5db",
                                cursor: "pointer",
                                background: "white",
                                fontWeight: 600,
                              }}
                            >
                              {isExpanded ? "Hide" : "View"}
                            </button>

                            <button
                              onClick={() => beginRename(r)}
                              style={{
                                padding: "10px 12px",
                                borderRadius: "10px",
                                border: "1px solid #d1d5db",
                                cursor: "pointer",
                                background: "white",
                                fontWeight: 600,
                              }}
                            >
                              Rename
                            </button>

                            <button
                              onClick={() => deleteSimulation(r.id)}
                              style={{
                                padding: "10px 12px",
                                borderRadius: "10px",
                                border: "none",
                                cursor: "pointer",
                                background: "#ef4444",
                                color: "white",
                                fontWeight: 700,
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Expanded details with right side graph */}
                      {isExpanded && !isEditing && (
                        <div
                          style={{
                            marginTop: "12px",
                            paddingTop: "12px",
                            borderTop: "1px solid #e5e7eb",
                            display: "grid",
                            gridTemplateColumns: "1.2fr 0.8fr",
                            gap: "16px",
                            alignItems: "start",
                          }}
                        >
                          {/*metrics and decisions */}
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                              gap: "10px",
                              fontSize: "0.95rem",
                            }}
                            ><div>
                            <b>Finance type:</b> {r.finance_type.toUpperCase()}
                            </div>
                            <div>
                              <b>Cash price:</b> €{Number(r.cash_price).toFixed(2)}
                            </div>
                            <div>
                              <b>Deposit:</b> €{Number(r.deposit).toFixed(2)}
                            </div>
                            <div>
                              <b>APR:</b> {Number(r.apr).toFixed(2)}%
                            </div>
                            <div>
                              <b>Term months:</b> {r.term_months}
                            </div>
                            <div>
                              <b>Balloon:</b>{" "}
                              {r.finance_type === "pcp" ? `€${Number(r.balloon ?? 0).toFixed(2)}` : "N/A"}
                            </div>
                            <div>
                              <b>Final monthly payment:</b> €{Number(r.final_monthly_payment).toFixed(2)}
                            </div>
                            <div>
                              <b>Total interest:</b> €{Number(r.total_interest).toFixed(2)}
                            </div>
                            <div>
                              <b>Months remaining:</b> {r.months_remaining}
                            </div>

                            <div style={{ gridColumn: "1 / -1" }}>
                              <b>Decisions:</b>
                              <div style={{ marginTop: "6px" }}>{renderDecisions(r.decisions)}</div>
                            </div>

                            <div style={{ gridColumn: "1 / -1", fontSize: "0.85rem", opacity: 0.7 }}>
                              <b>ID:</b> {r.id}
                            </div>
                          </div>

                          {/*graph card */}
                          <div
                            style={{
                              border: "1px solid #e5e7eb",
                              borderRadius: "12px",
                              padding: "12px",
                              background: "#f9fafb",
                              boxShadow: "0 1px 6px rgba(0,0,0,0.04)",
                            }}
                          >
                            <div style={{ fontWeight: 800, marginBottom: "8px" }}>
                              Monthly repayment trend
                            </div>

                            <Sparkline values={r.payment_history} width={260} height={70} />

                            <div style={{ marginTop: "8px", fontSize: "0.9rem", opacity: 0.85 }}>
                              {r.payment_history?.length ? (
                                <>
                                  Start: €{r.payment_history[0].toFixed(2)}
                                  <br />
                                  End: €{r.payment_history[r.payment_history.length - 1].toFixed(2)}
                                </>
                              ) : (
                                <>No data saved</>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
