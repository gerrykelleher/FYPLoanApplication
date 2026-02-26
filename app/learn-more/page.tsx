"use client";

import Navbar from "../components/navbar";

export default function LearnMorePage() {
  return (
    <>
      <Navbar />

      <div
        style={{
          maxWidth: "900px",
          margin: "100px auto 60px",
          padding: "0 16px",
        }}
      >
        <h1 style={{ marginBottom: "8px" }}>Learn More About Car Finance</h1>
        <p style={{ opacity: 0.75, marginBottom: "30px" }}>
          Understand the financial concepts behind the decisions you made in the simulator.
        </p>

        {/* SECTION 1 */}
        <ExpandableSection title="What is APR?">
          <p>
            <b>APR (Annual Percentage Rate)</b> represents the yearly cost of borrowing,
            including interest and certain fees.
          </p>
          <p>
            A higher APR increases your monthly repayment and total interest.
            Even a small change (e.g. 5% → 7%) can significantly increase total cost
            over a long term.
          </p>
        </ExpandableSection>

        {/* SECTION 2 */}
        <ExpandableSection title="Why Longer Terms Increase Total Interest">
          <p>
            Extending the loan term lowers your monthly repayment, but increases
            the amount of time interest is charged.
          </p>
          <p>
            This means you may pay less each month — but more overall.
          </p>
          <p>
            The simulator shows this by increasing total interest when you extend the term.
          </p>
        </ExpandableSection>

        {/* SECTION 3 */}
        <ExpandableSection title="What is a Balloon / GMFV Payment?">
          <p>
            In PCP (Personal Contract Purchase) finance, a balloon payment
            (also called a <b>Guaranteed Minimum Future Value</b>) is a large
            final payment due at the end of the agreement.
          </p>
          <p>
            This lowers your monthly payments but means:
          </p>
          <ul>
            <li>You must pay a large amount at the end, OR</li>
            <li>Return the car, OR</li>
            <li>Refinance the balloon.</li>
          </ul>
        </ExpandableSection>

        {/* SECTION 4 */}
        <ExpandableSection title="Why Monthly Repayments Can Be Misleading">
          <p>
            Many buyers focus only on the monthly figure.
          </p>
          <p>
            However, the <b>total interest paid</b> determines the true cost of borrowing.
          </p>
          <p>
            Lower monthly payments often mean:
          </p>
          <ul>
            <li>Longer loan term</li>
            <li>Higher total interest</li>
            <li>Greater financial commitment</li>
          </ul>
        </ExpandableSection>

        {/* SECTION 5 */}
        <ExpandableSection title="Opportunity Cost of Car Finance">
          <p>
            Money used to pay interest could have been saved or invested elsewhere.
          </p>
          <p>
            The more interest you pay, the greater the opportunity cost.
          </p>
          <p>
            Understanding this helps build long-term financial literacy.
          </p>
        </ExpandableSection>

        {/* SECTION 6 */}
        <ExpandableSection title="How This Simulator Supports Learning">
          <p>
            This simulator uses scenario-based learning.
          </p>
          <p>
            Instead of reading theory, you make decisions and immediately
            see how they affect:
          </p>
          <ul>
            <li>Monthly repayment</li>
            <li>Total interest</li>
            <li>Loan term</li>
            <li>Outstanding balance</li>
          </ul>
          <p>
            This active feedback loop improves understanding and financial decision-making skills.
          </p>
        </ExpandableSection>
      </div>
    </>
  );
}

/* ---------------- EXPANDABLE COMPONENT ---------------- */

function ExpandableSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <details
      style={{
        backgroundColor: "#ffffff",
        borderRadius: "14px",
        padding: "16px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
        marginBottom: "16px",
      }}
    >
      <summary
        style={{
          cursor: "pointer",
          fontWeight: 700,
          listStyle: "none",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "6px 4px",
          borderRadius: "10px",
        }}
      >
        <span
          className="chevron"
          style={{
            display: "inline-block",
            transition: "transform 0.2s ease",
            fontSize: "0.95rem",
          }}
        >
          ▶
        </span>

        <span>{title}</span>
      </summary>

      <div style={{ marginTop: "14px", opacity: 0.9, lineHeight: 1.6 }}>
        {children}
      </div>

      <style jsx>{`
        details summary::-webkit-details-marker {
          display: none;
        }
        details summary:hover {
          background: #f3f4f6;
        }
        details[open] .chevron {
          transform: rotate(90deg);
        }
      `}</style>
    </details>
  );
}