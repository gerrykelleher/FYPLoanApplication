//tell nextjs this is a client component 
//React structure and hook usage (useState, useMemo) based on React.dev official documentation
//https://react.dev/learn
"use client";
import { useMemo, useRef, useState } from "react";
import Navbar from "../../components/navbar";
import {supabase} from "../../../lib/supabaseClient";

//Types
type FinanceType = "loan" | "pcp";

type Inputs = {
  cashPrice: number;     //vehicle cash price(including VAT)
  deposit: number;       //upfront customer deposit
  fees: number;          //flat fees added
  aprPct: number;        //annual percentage rate (APR) as %
  termMonths: number;    //number of mobths to repay
  financeType: FinanceType;
  balloon: number;       //PCP only: the big final payment (GMFV) if you want to keep the car at the end
};

type Row = { period: number; payment: number; interest: number; principal: number; balance: number; };

type Result = {
  amountFinanced: number;   //cashPrice - deposit + fees
  monthlyPayment: number;   //monthly repayment
  totalMonthlyPaid: number; //total of all monthly payments
  totalAmountRepayable: number; //deposit + fees + totalMonthlyPaid (+ balloon if PCP)
  totalCostOfCredit: number;    //totalAmountRepayable - cashPrice
  rows: Row[];  //repayment schedule rows (first 12 months)
};

//US-14 - User can choose a preset (type of car) with preset finance details
//preset finance options for user to choose from
type FinancePreset = {
  id: string;
  label: string;
  financeType: FinanceType;
  cashPrice: number;
  deposit: number;
  fees: number;
  aprPct: number;
  termMonths: number;
  balloon?: number; // PCP only
};

//US-14 - User can choose a preset (type of car) with preset finance details
//preset car finance options
const financePresets: FinancePreset[] = [
  //Student / budget (Loan)
  {
    id: "ford-fiesta-used",
    label: "Used Ford Fiesta (Loan)",
    financeType: "loan",
    cashPrice: 12000,
    deposit: 1500,
    fees: 0,
    aprPct: 8.5,
    termMonths: 48,
  },
  {
    id: "toyota-yaris-used",
    label: "Used Toyota Yaris (Loan)",
    financeType: "loan",
    cashPrice: 13500,
    deposit: 2000,
    fees: 0,
    aprPct: 8.2,
    termMonths: 48,
  },
  {
    id: "toyota-corolla-used",
    label: "Used Toyota Corolla (Loan)",
    financeType: "loan",
    cashPrice: 16500,
    deposit: 2000,
    fees: 0,
    aprPct: 7.9,
    termMonths: 48,
  },
  {
    id: "vw-golf-used",
    label: "Used VW Golf (Loan)",
    financeType: "loan",
    cashPrice: 19000,
    deposit: 3000,
    fees: 0,
    aprPct: 7.5,
    termMonths: 60,
  },
  {
    id: "hyundai-i30-used",
    label: "Used Hyundai i30 (Loan)",
    financeType: "loan",
    cashPrice: 17500,
    deposit: 2500,
    fees: 0,
    aprPct: 7.8,
    termMonths: 60,
  },

  //Mid range / popular (PCP)
  {
    id: "audi-a3-pcp",
    label: "Audi A3 (PCP)",
    financeType: "pcp",
    cashPrice: 36000,
    deposit: 4000,
    fees: 0,
    aprPct: 6.9,
    termMonths: 48,
    balloon: 16000,
  },
  {
    id: "vw-golf-new-pcp",
    label: "New VW Golf (PCP)",
    financeType: "pcp",
    cashPrice: 34000,
    deposit: 3500,
    fees: 0,
    aprPct: 6.9,
    termMonths: 48,
    balloon: 15000,
  },
  {
    id: "mercedes-a-class-pcp",
    label: "Mercedes A-Class (PCP)",
    financeType: "pcp",
    cashPrice: 42000,
    deposit: 5000,
    fees: 0,
    aprPct: 6.8,
    termMonths: 48,
    balloon: 19000,
  },
  {
    id: "bmw-3series-pcp",
    label: "BMW 3 Series (PCP)",
    financeType: "pcp",
    cashPrice: 48000,
    deposit: 6000,
    fees: 0,
    aprPct: 6.5,
    termMonths: 48,
    balloon: 21000,
  },

  //Family / practical (PCP)
  {
    id: "skoda-octavia-pcp",
    label: "Skoda Octavia (PCP)",
    financeType: "pcp",
    cashPrice: 38000,
    deposit: 4000,
    fees: 0,
    aprPct: 6.8,
    termMonths: 48,
    balloon: 16500,
  },
  {
    id: "toyota-rav4-pcp",
    label: "Toyota RAV4 Hybrid (PCP)",
    financeType: "pcp",
    cashPrice: 52000,
    deposit: 6000,
    fees: 0,
    aprPct: 6.4,
    termMonths: 48,
    balloon: 23000,
  },

  //Electric (PCP)
  {
    id: "tesla-model-3-pcp",
    label: "Tesla Model 3 (PCP)",
    financeType: "pcp",
    cashPrice: 42000,
    deposit: 5000,
    fees: 0,
    aprPct: 5.9,
    termMonths: 36,
    balloon: 18000,
  },
  {
    id: "hyundai-kona-ev-pcp",
    label: "Hyundai Kona Electric (PCP)",
    financeType: "pcp",
    cashPrice: 39500,
    deposit: 4500,
    fees: 0,
    aprPct: 5.5,
    termMonths: 36,
    balloon: 17000,
  },
  {
    id: "kia-ev6-pcp",
    label: "Kia EV6 (PCP)",
    financeType: "pcp",
    cashPrice: 52000,
    deposit: 6000,
    fees: 0,
    aprPct: 5.9,
    termMonths: 36,
    balloon: 24000,
  },

  //High-end / aspirational (PCP)
  {
    id: "bmw-4series-pcp",
    label: "BMW 4 Series Coupe (PCP)",
    financeType: "pcp",
    cashPrice: 62000,
    deposit: 7000,
    fees: 0,
    aprPct: 6.9,
    termMonths: 48,
    balloon: 30000,
  },
  {
    id: "audi-a6-pcp",
    label: "Audi A6 (PCP)",
    financeType: "pcp",
    cashPrice: 65000,
    deposit: 8000,
    fees: 0,
    aprPct: 6.7,
    termMonths: 48,
    balloon: 32000,
  },
];

//Simulation specific types
type LoanState = {
  financeType: FinanceType;
  principal: number;            // amount financed (remaining) – simplified aggregate
  balloon: number;              // PCP balloon (GMFV) if relevant
  annualRate: number;           // decimal, e.g. 0.069
  termMonthsRemaining: number;  // months remaining in the agreement
  monthlyPayment: number;       // recalculated after each scenario
  totalInterestOnFinance: number; // interest over remaining term based on principal
  currentMonth: number;         // for time-based scenarios if needed
};

//A single choice inside a scenario
type ScenarioChoice = {
  id: string;
  label: string;
  apply: (loan: LoanState) => LoanState; //function that applies this choice to a LoanState
  explanation: string;                   //text explaining the impact of this choice
  nextScenarioId?: number;               //optional next scenario id to go to after this choice
  endsSimulation?: boolean;              //optional: ends the simulation if true
};

//Scenario node structure
//https://www.geeksforgeeks.org/reactjs/create-a-text-based-adventure-game-using-react/
type ScenarioNode = {
  id: number;
  title: string;
  description: string;
  choices: ScenarioChoice[];
};

//US-10 - Simulation scenarios are randomised and selected from a large pool of possible scenarios
//Array shuffling logic adapted from GeeksforGeeks:
//"How to Shuffle an Array Using JavaScript" https://www.geeksforgeeks.org/javascript/how-to-shuffle-an-array-using-javascript/
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]; // copy to keep original order intact
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}


//currency rounding
function round2(x: number) {
  return Math.round(x * 100) / 100;
}

//PMT formula function generated with ChatGPT guidance
//Follows the standard annuity equation for fixed rate loans.
//Verified using the Corporate Finance Institute – "Loan Payment Formula" (2025).
function pmtLoan(P: number, r: number, n: number) {
  if (r === 0) return P / n;
  const a = Math.pow(1 + r, n);
  return P * (r * a) / (a - 1);
}

//Calculates the monthly payment for a PCP-style loan that includes a final balloon (GMFV).
//Formula derived from the standard annuity equation with a future value term.
//Created with ChatGPT guidance and verified using the Corporate Finance Institute
function pmtWithBalloon(P: number, FV: number, r: number, n: number) {
  if (r === 0) return (P - FV) / n; // simple linear if 0% APR
  const a = Math.pow(1 + r, n);
  return ((P - (FV / a)) * r) / (1 - (1 / a));
}

//US-02 - 12 month payment amount tracker
//Builds the repayment schedule (amortisation table) showing how the loan is paid off.
//Each row includes: payment number, interest, principal, and remaining balance.
//Created with ChatGPT guidance and verified using the Corporate Finance Institute
function buildAmortizationRows(P: number, r: number, n: number, PMT: number): Row[] {
  const rows: Row[] = [];
  let bal = P;

  const maxRows = Math.min(12, n);  //only show first 12 months
  for (let k = 1; k <= maxRows; k++) {
    const interest = bal * r;
    const principal = PMT - interest;
    bal = bal + interest - PMT; //update balance, add interest, subtract payment
    rows.push({
      period: k,
      payment: round2(PMT),
      interest: round2(interest),
      principal: round2(principal),
      balance: round2(Math.max(bal, 0)), //avoid negative balance
    });
  }
  return rows;
}

//Main calculation function
function calculate(inputs: Inputs): Result {
  //inputs broken into seperate variables
  const { cashPrice, deposit, fees, aprPct, termMonths, financeType, balloon } = inputs;

  //US-02 - 12 month payment amount tracker
  //US-03 - Input Validation
  //input validation
  if (cashPrice <= 0) throw new Error("Cash price must be > 0");
  if (deposit < 0 || fees < 0) throw new Error("Deposit/fees cannot be negative");
  if (termMonths <= 0) throw new Error("Term must be > 0 months");
  if (aprPct < 0) throw new Error("APR cannot be negative");
  if (financeType === "pcp" && balloon < 0) throw new Error("Balloon cannot be negative");
  if (financeType === "pcp" && balloon >= cashPrice)
    throw new Error("Balloon/GMFV should be less than the cash price"); 

  //1. Calculate amount financed
  //cashPrice - deposit + fees
  const amountFinanced = Math.max(0, cashPrice - deposit + fees);
  //2. Convert APR% to monthly rate
  const r = aprPct / 100 / 12;

  //3. Calculate monthly payment (PMT) based on finance type
  const PMT =
    financeType === "loan"
      ? pmtLoan(amountFinanced, r, termMonths)
      : pmtWithBalloon(amountFinanced, balloon, r, termMonths);

  //4. Work out totals
  const totalMonthlyPaid = PMT * termMonths;
  //totalAmountRepayable = deposit + fees + totalMonthlyPaid (+ balloon if PCP)
  const totalAmountRepayable =
    round2(deposit + fees + totalMonthlyPaid + (financeType === "pcp" ? balloon : 0));
    
  //totalCostOfCredit = totalAmountRepayable - cashPrice
  const totalCostOfCredit = round2(totalAmountRepayable - cashPrice);

  //US-02 - 12 month payment amount tracker
  //5. Repayment schedule rows (first 12 months)
  const rows = buildAmortizationRows(amountFinanced, r, termMonths, PMT);

  //6. Return all results (rounded to 2 decimals)
  return {
    amountFinanced: round2(amountFinanced),
    monthlyPayment: round2(PMT),
    totalMonthlyPaid: round2(totalMonthlyPaid),
    totalAmountRepayable,
    totalCostOfCredit,
    rows,
  };
}

//US-06 - Scenarios built into simulator
//Simulation logic functions
//Recalculates monthly payment and interest
//This is used whenever a scenario choice changes the loan details.
function recalcLoanFromState(loan: LoanState): LoanState {
  const monthlyRate = loan.annualRate / 12;   

  //Works out new monthly repayment
  //Uses either standard loan PMT or PCP with balloon PMT based on finance type
  const pmt =
    loan.financeType === "loan"
      ? pmtLoan(loan.principal, monthlyRate, loan.termMonthsRemaining)
      : pmtWithBalloon(loan.principal, loan.balloon, monthlyRate, loan.termMonthsRemaining);

  const totalRepaid =
    pmt * loan.termMonthsRemaining +
    (loan.financeType === "pcp" ? loan.balloon : 0);
  //everything repaid - amount still owed = total interest
  const totalInterest = round2(totalRepaid - loan.principal);

  return {
    ...loan,  //everything unchanges stays the same
    monthlyPayment: round2(pmt),
    totalInterestOnFinance: totalInterest,
  };
}

//Create the initial LoanState from user inputs and calculation result.
//This is adapted from the GeeksforGeeks text adventure code structure.
function createInitialLoanState(inputs: Inputs, result: Result): LoanState {
  const base: LoanState = {
    financeType: inputs.financeType,
    principal: result.amountFinanced,
    balloon: inputs.financeType === "pcp" ? inputs.balloon : 0,
    annualRate: inputs.aprPct / 100,
    termMonthsRemaining: inputs.termMonths,
    monthlyPayment: 0,           //filled by recalcLoanFromState
    totalInterestOnFinance: 0,   //filled by recalcLoanFromState
    currentMonth: 0,
  };
  return recalcLoanFromState(base);
}

//US-06 - Scenarios built into simulator
//US-07 - User can pick between two decisions in reaction to a scenario
//Scenarios
//Each choice updates the LoanState based on user decisions
const loanScenarios: ScenarioNode[] = [
  {
    id: 0,
    title: "Interest Rate Increase",
    description:
      "After one year, your lender increases the interest rate on your finance by 1%. How would you like to respond?",
    choices: [
      {
        id: "rate-up-keep-term",
        label: "Accept higher monthly repayment (keep the same term)",
        apply: (loan) => {
          const updated: LoanState = {
            ...loan,
            annualRate: loan.annualRate + 0.01,
            currentMonth: loan.currentMonth + 12,
          };
          return recalcLoanFromState(updated);
        },
        explanation:
          "You kept the same term, but your monthly repayment increases immediately. This avoids extending the loan but costs more each month.",
        nextScenarioId: 1,
      },
      {
        id: "rate-up-extend-term",
        label: "Extend the term by 12 months to reduce the monthly cost",
        apply: (loan) => {
          const updated: LoanState = {
            ...loan,
            annualRate: loan.annualRate + 0.01,
            termMonthsRemaining: loan.termMonthsRemaining + 12,
            currentMonth: loan.currentMonth + 12,
          };
          return recalcLoanFromState(updated);
        },
        explanation:
          "You reduced your monthly repayment by extending the term, but you'll pay interest for longer and increase the total cost.",
        nextScenarioId: 1,
      },
    ],
  },

  {
    id: 1,
    title: "Missed Payment",
    description:
      "You miss one monthly repayment due to an unexpected expense. Your lender gives you two options to get back on track.",
    choices: [
      {
        id: "catch-up-fee",
        label: "Catch up next month and pay a €50 late fee",
        apply: (loan) => {
          const updated: LoanState = {
            ...loan,
            principal: loan.principal + 50,
          };
          return recalcLoanFromState(updated);
        },
        explanation:
          "You pay a small fee and stay close to your original schedule, but the cost of the loan increases slightly.",
        nextScenarioId: 2,
      },
      {
        id: "add-payment-end",
        label: "Add the missed payment to the end of the loan (extend by 1 month)",
        apply: (loan) => {
          const updated: LoanState = {
            ...loan,
            termMonthsRemaining: loan.termMonthsRemaining + 1,
          };
          return recalcLoanFromState(updated);
        },
        explanation:
          "You avoid the fee, but extending the loan increases the overall interest paid.",
        nextScenarioId: 2,
      },
    ],
  },

  {
    id: 2,
    title: "Unexpected Repair Bill",
    description:
      "Your car needs an unexpected €1,200 repair. You don’t have the cash available. How do you handle it?",
    choices: [
      {
        id: "repair-add-finance",
        label: "Add the €1,200 repair cost to the finance",
        apply: (loan) => {
          const updated: LoanState = {
            ...loan,
            principal: loan.principal + 1200,
          };
          return recalcLoanFromState(updated);
        },
        explanation:
          "You financed the repair. This spreads the cost but increases your total interest paid.",
        nextScenarioId: 3,
      },
      {
        id: "repair-pay-cash",
        label: "Pay the repair using savings",
        apply: (loan) => loan,
        explanation:
          "You used savings to cover the repair. No change to the loan, but your emergency fund is reduced.",
        nextScenarioId: 3,
      },
    ],
  },

  {
    id: 3,
    title: "Insurance & Running Costs Increase",
    description:
      "Insurance prices and fuel costs have increased. Your monthly car-related expenses rise by €45. You need more room in your budget.",
    choices: [
      {
        id: "extend-term-running-costs",
        label: "Extend the finance term by 12 months to lower monthly repayments",
        apply: (loan) => {
          const updated: LoanState = {
            ...loan,
            termMonthsRemaining: loan.termMonthsRemaining + 12,
          };
          return recalcLoanFromState(updated);
        },
        explanation:
          "You reduced monthly repayments to help cover rising costs, but extending the term increases the total interest paid.",
        nextScenarioId: 4,
      },
      {
        id: "keep-term-running-costs",
        label: "Keep the same loan term and adjust your budget elsewhere",
        apply: (loan) => loan,
        explanation:
          "You chose not to adjust the loan. Your repayments remain the same, but your budget becomes tighter.",
        nextScenarioId: 4,
      },
    ],
  },

  {
    id: 4,
    title: "Bonus Lump Sum",
    description:
      "You receive a €2,000 bonus from work. You’re considering using it to reduce your finance balance.",
    choices: [
      {
        id: "bonus-repay-2000",
        label: "Pay €2,000 off the finance balance",
        apply: (loan) => {
          const updated: LoanState = {
            ...loan,
            principal: Math.max(loan.principal - 2000, 0),
          };
          return recalcLoanFromState(updated);
        },
        explanation:
          "Paying down your principal early saves interest and may reduce the term or monthly repayments.",
        nextScenarioId: 5,
      },
      {
        id: "bonus-keep-cash",
        label: "Keep the bonus in savings",
        apply: (loan) => loan,
        explanation:
          "The loan stays the same, but keeping savings gives you a larger emergency fund.",
        nextScenarioId: 5,
      },
    ],
  },

  {
    id: 5,
    title: "Early Settlement Offer",
    description:
      "Your lender offers a discounted settlement figure if you clear the finance now. You could use savings or borrow from family.",
    choices: [
      {
  id: "settle-now",
  label: "Use savings to settle the loan now",
  endsSimulation: true, // ✅ stop immediately if chosen
  apply: (loan) => ({
    ...loan,
    principal: 0,
    balloon: 0,
    termMonthsRemaining: 0,
    monthlyPayment: 0,
    totalInterestOnFinance: 0,
  }),
  explanation:
    "You cleared the loan and saved interest, but used a large amount of savings.",
},

      {
        id: "continue-loan",
        label: "Continue with the current loan",
        apply: (loan) => loan,
        explanation:
          "You kept your savings for flexibility but will pay more interest over time.",
        nextScenarioId: 6,
      },
    ],
  },

  {
    id: 6,
    title: "Negative Equity Warning",
    description:
      "Car values have fallen. You may soon owe more than the car is worth. What do you want to do?",
    choices: [
      {
        id: "reduce-term",
        label: "Reduce the term by 6 months to lower negative equity risk",
        apply: (loan) => {
          const updated: LoanState = {
            ...loan,
            termMonthsRemaining: Math.max(loan.termMonthsRemaining - 6, 1),
          };
          return recalcLoanFromState(updated);
        },
        explanation:
          "You will clear the loan faster and reduce the time spent in negative equity, but monthly repayments increase.",
        nextScenarioId: 7,
      },
      {
        id: "keep-term",
        label: "Keep the same repayment schedule",
        apply: (loan) => loan,
        explanation:
          "Your monthly payments stay affordable, but you may remain in negative equity for longer.",
        nextScenarioId: 7,
      },
    ],
  },

  
  // NEW SCENARIOS (Iteration 3)
  // Non-financial 1 (Location change)
  {
    id: 7,
    title: "Location Change: More Driving",
    description:
      "You move further from work and start driving a lot more. Wear and tear increases and your monthly car costs rise.",
    choices: [
      {
        id: "more-driving-extend-term",
        label: "Lower repayments by extending the term by 6 months",
        apply: (loan) => {
          const updated: LoanState = {
            ...loan,
            termMonthsRemaining: loan.termMonthsRemaining + 6,
          };
          return recalcLoanFromState(updated);
        },
        explanation:
          "Extending the term can ease monthly pressure, but increases the overall interest paid.",
        nextScenarioId: 8,
      },
      {
        id: "more-driving-keep-term",
        label: "Keep the loan the same and adjust your budget elsewhere",
        apply: (loan) => loan,
        explanation:
          "Your loan stays unchanged, but you will need to manage higher running costs through budgeting.",
        nextScenarioId: 8,
      },
    ],
  },

  // Non-financial 2 (Personal event)
  {
    id: 8,
    title: "Personal Circumstance: Unpaid Leave",
    description:
      "A personal situation means you need to take unpaid leave for several weeks. Your income drops temporarily.",
    choices: [
      {
        id: "unpaid-leave-extend-term",
        label: "Extend the term by 12 months to reduce monthly repayments",
        apply: (loan) => {
          const updated: LoanState = {
            ...loan,
            termMonthsRemaining: loan.termMonthsRemaining + 12,
          };
          return recalcLoanFromState(updated);
        },
        explanation:
          "Monthly repayments reduce, but you pay interest for longer, increasing the total cost of credit.",
        nextScenarioId: 9,
      },
      {
        id: "unpaid-leave-keep-term",
        label: "Keep the same loan term and rely on savings for the short term",
        apply: (loan) => loan,
        explanation:
          "Your loan stays unchanged. This can be cheaper long-term, but depends on having savings available.",
        nextScenarioId: 9,
      },
    ],
  },

  // Non-financial 3 (Fuel shock)
  {
    id: 9,
    title: "External Shock: Fuel Prices Rise",
    description:
      "Fuel prices rise sharply due to external factors. Your monthly travel costs increase by about €60.",
    choices: [
      {
        id: "fuel-rise-extend-term",
        label: "Extend the loan by 6 months to create budget breathing room",
        apply: (loan) => {
          const updated: LoanState = {
            ...loan,
            termMonthsRemaining: loan.termMonthsRemaining + 6,
          };
          return recalcLoanFromState(updated);
        },
        explanation:
          "You reduce monthly repayments to help your budget, but increase the interest paid over time.",
        nextScenarioId: 10,
      },
      {
        id: "fuel-rise-keep-term",
        label: "Keep the loan the same and reduce spending elsewhere",
        apply: (loan) => loan,
        explanation:
          "The loan stays the same, but your budget gets tighter due to higher running costs.",
        nextScenarioId: 10,
      },
    ],
  },

  // Financial 1 (Income drop)
  {
    id: 10,
    title: "Income Reduction",
    description:
      "Your income drops by €400 per month due to reduced working hours. You need to lower your monthly expenditure.",
    choices: [
      {
        id: "income-drop-extend-12",
        label: "Extend the term by 12 months to reduce repayments",
        apply: (loan) => {
          const updated: LoanState = {
            ...loan,
            termMonthsRemaining: loan.termMonthsRemaining + 12,
          };
          return recalcLoanFromState(updated);
        },
        explanation:
          "Extending the term reduces monthly repayments but increases total interest over the agreement.",
        nextScenarioId: 11,
      },
      {
        id: "income-drop-keep",
        label: "Keep the agreement the same and cut spending elsewhere",
        apply: (loan) => loan,
        explanation:
          "Your loan cost stays the same, but your monthly budget becomes tighter.",
        nextScenarioId: 11,
      },
    ],
  },

  // Financial 2 (Refinance)
  {
    id: 11,
    title: "Refinance Offer",
    description:
      "A new lender offers a lower APR, but charges a €600 setup fee to refinance. What do you do?",
    choices: [
      {
        id: "refinance-accept",
        label: "Accept the refinance (add €600 fee to the balance)",
        apply: (loan) => {
          // Example: reduce rate by 1%, add fee to principal
          const updated: LoanState = {
            ...loan,
            annualRate: Math.max(loan.annualRate - 0.01, 0),
            principal: loan.principal + 600,
          };
          return recalcLoanFromState(updated);
        },
        explanation:
          "A lower APR can reduce interest, but fees increase your balance. The best option depends on your remaining term.",
        nextScenarioId: 12,
      },
      {
        id: "refinance-decline",
        label: "Decline and stay with your current lender",
        apply: (loan) => loan,
        explanation:
          "You avoid the fee and keep things simple, but you may pay more interest compared to a lower APR option.",
        nextScenarioId: 12,
      },
    ],
  },

  // Financial 3 (Early sale)
  {
    id: 12,
    title: "Selling the Car Early",
    description:
      "You are considering selling the car before the finance ends. This could leave you in negative equity depending on the sale price.",
    choices: [
      {
        id: "sell-early-reduce-term",
        label: "Increase payments by reducing the term by 6 months to clear the balance faster",
        apply: (loan) => {
          const updated: LoanState = {
            ...loan,
            termMonthsRemaining: Math.max(loan.termMonthsRemaining - 6, 1),
          };
          return recalcLoanFromState(updated);
        },
        explanation:
          "Clearing the loan faster reduces the risk of negative equity, but increases monthly repayments.",
        nextScenarioId: 13,
      },
      {
        id: "sell-early-keep",
        label: "Keep the current schedule for affordability",
        apply: (loan) => loan,
        explanation:
          "Your repayments stay affordable, but you may owe more than the car is worth for longer.",
        nextScenarioId: 13,
      },
    ],
  },

  // Financial 4 (Insurance excess)
  {
    id: 13,
    title: "Insurance Excess Payment",
    description:
      "You have a minor accident and must pay a €750 insurance excess. How do you handle the cost?",
    choices: [
      {
        id: "excess-add-finance",
        label: "Add €750 to the finance balance",
        apply: (loan) => {
          const updated: LoanState = {
            ...loan,
            principal: loan.principal + 750,
          };
          return recalcLoanFromState(updated);
        },
        explanation:
          "Spreading the cost helps short-term cashflow, but increases interest because your balance is higher.",
        nextScenarioId: 14,
      },
      {
        id: "excess-pay-savings",
        label: "Pay the €750 from savings",
        apply: (loan) => loan,
        explanation:
          "The loan stays unchanged, but your savings/emergency fund is reduced.",
        nextScenarioId: 14,
      },
    ],
  },

  // Financial 5 (Rate decrease)
  {
    id: 14,
    title: "Interest Rate Decrease",
    description:
      "Market rates fall and your lender offers to reduce your APR by 0.75%. Do you accept?",
    choices: [
      {
        id: "rate-down-accept",
        label: "Accept the lower interest rate",
        apply: (loan) => {
          const updated: LoanState = {
            ...loan,
            annualRate: Math.max(loan.annualRate - 0.0075, 0),
          };
          return recalcLoanFromState(updated);
        },
        explanation:
          "A lower APR reduces interest costs and can reduce repayments over the remaining term.",
        nextScenarioId: 15,
      },
      {
        id: "rate-down-decline",
        label: "Decline and keep the current rate (no changes)",
        apply: (loan) => loan,
        explanation:
          "The loan remains unchanged. This can make sense if there are hidden conditions in real life, but here it keeps costs higher.",
        nextScenarioId: 15,
      },
    ],
  },

  // Financial 6 (PCP mileage penalty - only meaningful for PCP)
  {
    id: 15,
    title: "PCP Mileage Penalty",
    description:
      "You exceeded your PCP mileage limit and may face an extra €500 charge at the end of the agreement.",
    choices: [
      {
        id: "pcp-mileage-pay-now",
        label: "Set aside €500 now (treated as adding to balloon amount)",
        apply: (loan) => {
          if (loan.financeType !== "pcp") return loan;
          const updated: LoanState = {
            ...loan,
            balloon: loan.balloon + 500,
          };
          return recalcLoanFromState(updated);
        },
        explanation:
          "Planning for the mileage charge avoids a surprise later, but increases the total end cost for PCP users.",
        nextScenarioId: 16,
      },
      {
        id: "pcp-mileage-ignore",
        label: "Ignore it for now and deal with it later",
        apply: (loan) => loan,
        explanation:
          "No immediate change, but you risk a larger end-of-term bill in a PCP agreement.",
        nextScenarioId: 16,
      },
    ],
  },

  // Financial 7 (€1,000 gift)
  {
    id: 16,
    title: "Unexpected Gift",
    description:
      "You receive €1,000 as a gift. What do you do with it?",
    choices: [
      {
        id: "gift-pay-1000",
        label: "Pay €1,000 off the finance balance",
        apply: (loan) => {
          const updated: LoanState = {
            ...loan,
            principal: Math.max(loan.principal - 1000, 0),
          };
          return recalcLoanFromState(updated);
        },
        explanation:
          "Reducing principal early lowers interest and can improve the overall cost of the finance agreement.",
        nextScenarioId: 17,
      },
      {
        id: "gift-save-1000",
        label: "Keep the €1,000 in savings",
        apply: (loan) => loan,
        explanation:
          "You keep liquidity and emergency savings, but your loan costs remain unchanged.",
        nextScenarioId: 17,
      },
    ],
  },

  // Financial 8 (Extension offer)
  {
    id: 17,
    title: "Loan Extension Offer",
    description:
      "Your lender offers to extend the loan term to reduce monthly repayments. Do you accept the extension?",
    choices: [
      {
        id: "extension-accept-12",
        label: "Accept the extension (extend by 12 months)",
        apply: (loan) => {
          const updated: LoanState = {
            ...loan,
            termMonthsRemaining: loan.termMonthsRemaining + 12,
          };
          return recalcLoanFromState(updated);
        },
        explanation:
          "Monthly repayments can reduce, but the loan lasts longer and total interest increases.",
      },
      {
        id: "extension-decline",
        label: "Decline and keep the original term",
        apply: (loan) => loan,
        explanation:
          "Your loan stays unchanged. This keeps the finish date the same and can reduce interest compared to extending.",
      },
    ],
  },

    // Geopolitical / Trade: Tariffs increase vehicle and parts costs
  {
    id: 18,
    title: "Global Trade Tariffs Raise Car Costs",
    description:
      "New global trade tariffs on vehicles and key components increase import costs across Europe. Dealers raise prices on new and used cars, and repair parts become more expensive.",
    choices: [
      {
        id: "tariffs-absorb-cost",
        label: "Accept higher monthly repayments to keep the same term",
        apply: (loan) => {
          //Simulate higher overall cost by increasing principal
          const updated: LoanState = {
            ...loan,
            principal: loan.principal + 900, // realistic moderate shock
          };
          return recalcLoanFromState(updated);
        },
        explanation:
          "You kept the same term, but your balance increases due to higher vehicle/parts costs, which pushes up your repayment.",
      },
      {
        id: "tariffs-extend-term",
        label: "Extend the term by 6 months to reduce monthly pressure",
        apply: (loan) => {
          const updated: LoanState = {
            ...loan,
            principal: loan.principal + 900,
            termMonthsRemaining: loan.termMonthsRemaining + 6,
          };
          return recalcLoanFromState(updated);
        },
        explanation:
          "Extending the term lowers the monthly impact, but you pay interest for longer, increasing the total cost.",
      },
    ],
  },

  //Economic: Inflation surge causes rate increases
  {
    id: 19,
    title: "Inflation Surge Raises Interest Rates",
    description:
      "Inflation stays high and interest rates rise across the economy. Your lender increases your APR by 1.5%.",
    choices: [
      {
        id: "inflation-keep-term",
        label: "Accept the new APR and keep the same term",
        apply: (loan) => {
          const updated: LoanState = {
            ...loan,
            annualRate: loan.annualRate + 0.015,
          };
          return recalcLoanFromState(updated);
        },
        explanation:
          "Your monthly repayment increases because borrowing is now more expensive, but your finish date stays the same.",
      },
      {
        id: "inflation-extend-12",
        label: "Extend the term by 12 months to reduce the monthly repayment",
        apply: (loan) => {
          const updated: LoanState = {
            ...loan,
            annualRate: loan.annualRate + 0.015,
            termMonthsRemaining: loan.termMonthsRemaining + 12,
          };
          return recalcLoanFromState(updated);
        },
        explanation:
          "Extending the term reduces the monthly pressure, but increases the total interest paid over the agreement.",
      },
    ],
  },

  //Policy: Government tax/emissions changes increase costs
  {
    id: 20,
    title: "Government Policy Increases Vehicle Costs",
    description:
      "A change in vehicle tax/emissions charges increases your yearly motoring costs. Your monthly budget becomes tighter.",
    choices: [
      {
        id: "policy-adjust-budget",
        label: "Keep the finance the same and adjust your budget elsewhere",
        apply: (loan) => loan,
        explanation:
          "Your loan stays unchanged, but higher running costs reduce your monthly flexibility.",
      },
      {
        id: "policy-extend-term",
        label: "Extend the term by 6 months to reduce monthly repayments",
        apply: (loan) => {
          const updated: LoanState = {
            ...loan,
            termMonthsRemaining: loan.termMonthsRemaining + 6,
          };
          return recalcLoanFromState(updated);
        },
        explanation:
          "Lower repayments create breathing room, but extending the term increases total interest paid.",
      },
    ],
  },

  //Personal: Family circumstance change increases expenses
  {
    id: 21,
    title: "Family Circumstances Change",
    description:
      "A change in family circumstances increases your monthly expenses. You need to create more room in your budget.",
    choices: [
      {
        id: "family-extend-term",
        label: "Extend the term by 12 months to reduce monthly repayments",
        apply: (loan) => {
          const updated: LoanState = {
            ...loan,
            termMonthsRemaining: loan.termMonthsRemaining + 12,
          };
          return recalcLoanFromState(updated);
        },
        explanation:
          "Extending the term reduces your monthly repayments, but you will pay interest for longer.",
      },
      {
        id: "family-keep-term",
        label: "Keep the same term and reduce spending elsewhere",
        apply: (loan) => loan,
        explanation:
          "Your finance stays the same, but you must cut other spending to manage higher household costs.",
      },
    ],
  },

  //Personal: Tax refund received
  {
  id: 22,
  title: "Tax Refund",
  description:
    "You receive a €1,500 tax refund after filing your annual return. You can use this money strategically.",
  choices: [
    {
      id: "tax-refund-pay-loan",
      label: "Use the €1,500 to reduce the finance balance",
      apply: (loan) => {
        const updated: LoanState = {
          ...loan,
          principal: Math.max(loan.principal - 1500, 0),
        };
        return recalcLoanFromState(updated);
      },
      explanation:
        "Using the refund to reduce your balance lowers interest and improves the overall cost of the finance.",
    },
    {
      id: "tax-refund-save",
      label: "Keep the refund in savings",
      apply: (loan) => loan,
      explanation:
        "Your loan remains unchanged, but keeping savings improves financial security.",
    },
  ],
},

//Personal: Lower insurance premium
{
  id: 23,
  title: "Lower Insurance Premium",
  description:
    "You switch insurance provider and reduce your annual premium by €300, improving your monthly budget.",
  choices: [
    {
      id: "insurance-keep-loan",
      label: "Keep the loan the same and enjoy extra monthly flexibility",
      apply: (loan) => loan,
      explanation:
        "Lower running costs make repayments more comfortable without changing the loan.",
    },
    {
      id: "insurance-reduce-term",
      label: "Reduce the loan term by 3 months using the savings",
      apply: (loan) => {
        const updated: LoanState = {
          ...loan,
          termMonthsRemaining: Math.max(loan.termMonthsRemaining - 3, 1),
        };
        return recalcLoanFromState(updated);
      },
      explanation:
        "Shortening the term helps you clear the finance sooner and reduces total interest.",
    },
  ],
},

//Personal: Trade in consideration
{
  id: 24,
  title: "Trade-In Consideration",
  description:
    "A dealer offers a trade-in deal on your car. The value could help reduce your outstanding finance, but may not fully clear it.",
  choices: [
    {
      id: "trade-in-accept",
      label: "Accept the trade-in and reduce your finance balance by €2,000",
      apply: (loan) => {
        const updated: LoanState = {
          ...loan,
          principal: Math.max(loan.principal - 2000, 0),
        };
        return recalcLoanFromState(updated);
      },
      explanation:
        "The trade-in reduces your balance and interest, but you give up the car earlier.",
    },
    {
      id: "trade-in-decline",
      label: "Decline the trade-in and keep the current agreement",
      apply: (loan) => loan,
      explanation:
        "You avoid changing vehicles, but your finance continues unchanged.",
    },
  ],
},

//Personal: Strong used car market
{
  id: 25,
  title: "Strong Used Car Market",
  description:
    "Demand for used cars has increased, and your car is now worth more than expected. This improves your equity position.",
  choices: [
    {
      id: "used-market-reduce-balance",
      label: "Use the increased value to reduce your finance balance by €2,500",
      apply: (loan) => {
        const updated: LoanState = {
          ...loan,
          principal: Math.max(loan.principal - 2500, 0),
        };
        return recalcLoanFromState(updated);
      },
      explanation:
        "Higher car value improves your equity position and reduces interest by lowering the balance.",
    },
    {
      id: "used-market-no-change",
      label: "Do nothing and keep the current agreement",
      apply: (loan) => loan,
      explanation:
        "Your loan stays unchanged, but you retain flexibility in case you sell or trade in later.",
    },
  ],
},

//Personal: Cost of living reduction
{
  id: 26,
  title: "Cost of Living Reduction",
  description:
    "Your rent decreases or household bills fall, leaving you with an extra €120 per month in disposable income.",
  choices: [
    {
      id: "living-costs-overpay",
      label: "Use the extra money to overpay the loan each month",
      apply: (loan) => {
        const updated: LoanState = {
          ...loan,
          principal: Math.max(loan.principal - 1200, 0), // simulates regular overpayments
        };
        return recalcLoanFromState(updated);
      },
      explanation:
        "Regular overpayments reduce interest and help clear the loan faster.",
    },
    {
      id: "living-costs-save",
      label: "Keep the extra money for savings and emergencies",
      apply: (loan) => loan,
      explanation:
        "Your loan remains unchanged, but improved savings increase financial security.",
    },
  ],
},

//Personal: Insurance Renewal Shock
{
  id: 27,
  title: "Insurance Renewal Shock",
  description:
    "Your car insurance renewal comes in much higher than expected, adding an extra €55 per month to your costs.",
  choices: [
    {
      id: "insurance-shock-extend-term",
      label: "Extend the term by 6 months to reduce monthly repayments",
      apply: (loan) => {
        const updated: LoanState = {
          ...loan,
          termMonthsRemaining: loan.termMonthsRemaining + 6,
        };
        return recalcLoanFromState(updated);
      },
      explanation:
        "Extending the term can reduce monthly repayments, but increases total interest paid over time.",
    },
    {
      id: "insurance-shock-budget",
      label: "Keep the loan the same and cut spending elsewhere",
      apply: (loan) => loan,
      explanation:
        "Your finance stays unchanged, which can be cheaper long-term, but your monthly budget becomes tighter.",
    },
  ],
},

//Personal: Unexpected Medical Expense
{
  id: 28,
  title: "Unexpected Medical Expense",
  description:
    "You have an unexpected medical cost of €900 and need to decide how to manage it alongside your car finance.",
  choices: [
    {
      id: "medical-use-savings",
      label: "Pay the €900 from savings and keep the loan unchanged",
      apply: (loan) => loan,
      explanation:
        "Your finance remains unchanged, but your emergency fund is reduced which may increase future risk.",
    },
    {
      id: "medical-extend-term",
      label: "Extend the term by 12 months to create breathing room",
      apply: (loan) => {
        const updated: LoanState = {
          ...loan,
          termMonthsRemaining: loan.termMonthsRemaining + 12,
        };
        return recalcLoanFromState(updated);
      },
      explanation:
        "Lower monthly repayments can help cashflow, but extending the term increases total interest paid.",
    },
  ],
},

//Personal: Pay Rise / New Job
{
  id: 29,
  title: "Pay Rise",
  description:
    "You get a pay rise, leaving you with an extra €180 per month after tax. You can use it to improve your finances.",
  choices: [
    {
      id: "payrise-overpay",
      label: "Use the extra money to overpay the finance each month",
      apply: (loan) => {
        const updated: LoanState = {
          ...loan,
          principal: Math.max(loan.principal - 1800, 0), // simulates several months of overpayments
        };
        return recalcLoanFromState(updated);
      },
      explanation:
        "Overpaying reduces your principal, which lowers interest and can improve the overall cost of the agreement.",
    },
    {
      id: "payrise-save",
      label: "Keep the extra money for savings and emergencies",
      apply: (loan) => loan,
      explanation:
        "Your finance remains unchanged, but extra savings improve resilience against future shocks.",
    },
  ],
},

//Personal: Household Bills Increase
{
  id: 30,
  title: "Household Bills Increase",
  description:
    "Your household bills rise due to energy price increases, adding €70 per month to your expenses.",
  choices: [
    {
      id: "bills-increase-extend-6",
      label: "Extend the term by 6 months to reduce monthly repayments",
      apply: (loan) => {
        const updated: LoanState = {
          ...loan,
          termMonthsRemaining: loan.termMonthsRemaining + 6,
        };
        return recalcLoanFromState(updated);
      },
      explanation:
        "Extending the term can reduce monthly repayments, but increases total interest because you borrow for longer.",
    },
    {
      id: "bills-increase-nochange",
      label: "Keep the finance the same and adjust your budget elsewhere",
      apply: (loan) => loan,
      explanation:
        "Your repayments stay the same, which can reduce interest long-term, but you’ll need to cut other spending.",
    },
  ],
},

//Personal: Car Tax / NCT / Service Due
{
  id: 31,
  title: "Car Running Costs Due",
  description:
    "Your NCT, car tax, and servicing are due around the same time, costing €650 in one month.",
  choices: [
    {
      id: "running-costs-pay-savings",
      label: "Pay the €650 from savings and keep the loan unchanged",
      apply: (loan) => loan,
      explanation:
        "Your finance stays unchanged, but you reduce savings. This avoids adding extra borrowing costs.",
    },
    {
      id: "running-costs-add-balance",
      label: "Add the €650 to your finance balance to spread the cost",
      apply: (loan) => {
        const updated: LoanState = {
          ...loan,
          principal: loan.principal + 650,
        };
        return recalcLoanFromState(updated);
      },
      explanation:
        "Spreading the cost helps short-term cashflow, but increases interest because your balance is higher.",
    },
  ],
},

//Market: Used Car Value Drop (Negative Equity Risk)
{
  id: 32,
  title: "Used Car Value Drops",
  description:
    "Used car prices fall and your car is now worth less than expected. You’re worried about negative equity if you needed to sell.",
  choices: [
    {
      id: "value-drop-increase-payments",
      label: "Increase repayments by reducing the term by 6 months to clear the balance faster",
      apply: (loan) => {
        const updated: LoanState = {
          ...loan,
          termMonthsRemaining: Math.max(loan.termMonthsRemaining - 6, 1),
        };
        return recalcLoanFromState(updated);
      },
      explanation:
        "Clearing the finance sooner reduces time spent in negative equity, but increases monthly repayments.",
    },
    {
      id: "value-drop-keep-term",
      label: "Keep the current schedule and avoid making changes",
      apply: (loan) => loan,
      explanation:
        "Your repayments stay more affordable, but you may remain in negative equity for longer if values stay low.",
    },
  ],
},

//PCP Specific: End-of-Term Decision (Keep / Hand Back)
{
  id: 33,
  title: "PCP End-of-Term Choice",
  description:
    "Your PCP term is coming to an end soon. You need to decide how you want to handle the balloon payment (GMFV).",
  choices: [
    {
      id: "pcp-end-pay-balloon",
      label: "Plan to pay the balloon (reduce savings now to prepare)",
      apply: (loan) => {
        if (loan.financeType !== "pcp") return loan;
        const updated: LoanState = {
          ...loan,
          balloon: Math.max(loan.balloon - 1000, 0), // simulates saving/planning towards the balloon
        };
        return recalcLoanFromState(updated);
      },
      explanation:
        "Preparing for the balloon reduces end-of-term stress, but ties up money that could be used elsewhere.",
    },
    {
      id: "pcp-end-hand-back",
      label: "Plan to hand the car back and avoid the balloon payment",
      apply: (loan) => {
        if (loan.financeType !== "pcp") return loan;
        const updated: LoanState = {
          ...loan,
          balloon: 0, // simulated decision to not keep the car
        };
        return recalcLoanFromState(updated);
      },
      explanation:
        "Avoiding the balloon reduces end-of-term cost, but you won’t own the car and may need another vehicle arrangement.",
    },
  ],
},

];

//Child component: responsible only for rendering only one scenario at a time
//Pattern inspired by "Story" component in GeeksforGeeks text adventure.
//Layout and card styling adapted from W3Schools "How to - cards"
//Save simulation UX enhancements (loading state, success feedback, disabled states) were implemented with guidance from ChatGPT
function LoanScenarioView({
  scenario,
  onChoose, //when the choice is made, calls back to parent with the selected choice
}: {
  scenario: ScenarioNode; //shows current scenario
  onChoose: (choice: ScenarioChoice) => void;
}) {
  return (
    <div
      className="card mx-auto mt-4"
      style={{
        maxWidth: "720px",
        borderRadius: "12px",
        border: "1px solid #e5e7eb",
        boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
        backgroundColor: "#ffffff",
      }}
    >
      
      <div className="card-body">
        <h2
          className="card-title"
          style={{ marginBottom: "8px", fontSize: "1.4rem" }}
        >
          {scenario.title}
        </h2>
        <p
          className="card-text"
          style={{ marginBottom: "16px", opacity: 0.9, lineHeight: 1.5 }}
        >
          {scenario.description}
        </p>

        {/*US-07 - User can pick between two decisions in reaction to a scenario
        {/* Buttons styled as a vertical choice list – pattern adapted from W3Schools button groups */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>

         
          {scenario.choices.map((choice) => (
            <button
              key={choice.id}
              className="btn interactive-choice"
              onClick={(e) => {
                //ripple effect
                const ripple = document.createElement("span");
                ripple.className = "ripple";
                e.currentTarget.appendChild(ripple);
                setTimeout(() => ripple.remove(), 500);

                onChoose(choice);
              }}
            >
              {choice.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Final summary card adapted from W3Schools "How To - CSS Modals" and "How To - CSS Cards"
import Link from "next/link";

//US-09 - A “simulation complete” details page with information on how the user ended up after they made their decisions
function FinalSummary({
  finalLoan,
  decisions,
  onClose,
  carName,
}: {
  finalLoan: LoanState;
  decisions: string[];
  onClose: () => void;
  carName: string;
}) {
  //Tracks whether the save request is currently in progress
  const [isSaving, setIsSaving] = useState(false);

  //Tracks whether the simulation has been successfully saved
  const [isSaved, setIsSaved] = useState(false);

  //Stores any save-related error message
  const [saveError, setSaveError] = useState<string | null>(null);

  //Handles saving the simulation for signed-in users only
  async function handleSaveSimulation() {
    //Prevent duplicate saves
    if (isSaving || isSaved) return;

    setIsSaving(true);
    setSaveError(null);

    //US-15 - User can save, rename, organise, delete completed simulations
    //Retrieve the currently authenticated user from Supabase
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    //If no user is signed in, block saving
    if (authError || !user) {
      setIsSaving(false);
      setSaveError("Please sign in to save your simulation.");
      return;
    }

    //US-15 - User can save, rename, organise, delete completed simulations
    //Insert the simulation into the saved_simulations table
    const { error } = await supabase.from("saved_simulations").insert({
      user_id: user.id,
      car_name: carName || null, 
      finance_type: finalLoan.financeType,
      cash_price: finalLoan.principal,
      deposit: 0,
      apr: finalLoan.annualRate * 100,
      term_months: finalLoan.termMonthsRemaining,
      balloon: finalLoan.financeType === "pcp" ? finalLoan.balloon : null,

      final_monthly_payment: finalLoan.monthlyPayment,
      total_interest: finalLoan.totalInterestOnFinance,
      months_remaining: finalLoan.termMonthsRemaining,

      decisions: decisions,
    });

    // Handle database insert failure
    if (error) {
      setSaveError("Failed to save simulation. Please try again.");
      setIsSaving(false);
      return;
    }

    //US-15 - User can save, rename, organise, delete completed simulations
    // Mark simulation as successfully saved
    setIsSaving(false);
    setIsSaved(true);
  }

  const summaryCardStyle: React.CSSProperties = {
    backgroundColor: "#f9fafb",
    borderRadius: "10px",
    padding: "14px 16px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  };

  const valueStyle: React.CSSProperties = {
    fontSize: "1.25rem",
    fontWeight: "bold",
    color: "#111827",
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "16px",
      }}
    >
      <div
        style={{
          maxWidth: "800px",
          width: "100%",
          background: "#ffffff",
          borderRadius: "16px",
          boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
          padding: "32px 40px",
          fontFamily: "Arial, sans-serif",
        }}
      >
        {/* Header */}
        <div
          style={{
            borderBottom: "1px solid #e5e7eb",
            paddingBottom: "12px",
            marginBottom: "20px",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "1.8rem" }}>
            Simulation Summary
          </h2>
          <p style={{ opacity: 0.8, marginTop: "6px" }}>
            Here's a clear breakdown of how your decisions impacted your finance agreement.
          </p>
        </div>

        {/* Success banner shown after save */}
        {isSaved && (
          <div
            style={{
              backgroundColor: "#dcfce7",
              border: "1px solid #22c55e",
              color: "#166534",
              padding: "10px 14px",
              borderRadius: "8px",
              marginBottom: "16px",
              fontWeight: 600,
            }}
          >
            ✅ Simulation saved successfully.
            <div style={{ marginTop: "6px" }}>
              <Link href="/dashboard/simulations" style={{ textDecoration: "underline" }}>
                View dashboard
              </Link>
            </div>
          </div>
        )}

        {/* Error banner if save fails */}
        {saveError && (
          <div
            style={{
              backgroundColor: "#fee2e2",
              border: "1px solid #ef4444",
              color: "#7f1d1d",
              padding: "10px 14px",
              borderRadius: "8px",
              marginBottom: "16px",
            }}
          >
            {saveError}
          </div>
        )}

        {/* Summary stats */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "16px",
            marginBottom: "22px",
          }}
        >
          {carName && (
          <p style={{ marginTop: "6px", opacity: 0.85 }}>
            <b>Car:</b> {carName}
          </p>
        )}
          <div style={summaryCardStyle}>
            <b>Final monthly payment</b>
            <span style={valueStyle}>
              €{finalLoan.monthlyPayment.toFixed(2)}
            </span>
          </div>

          <div style={summaryCardStyle}>
            <b>Total interest remaining</b>
            <span style={valueStyle}>
              €{finalLoan.totalInterestOnFinance.toFixed(2)}
            </span>
          </div>

          <div style={summaryCardStyle}>
            <b>Months remaining</b>
            <span style={valueStyle}>
              {finalLoan.termMonthsRemaining}
            </span>
          </div>

          <div style={summaryCardStyle}>
            <b>Annual interest rate</b>
            <span style={valueStyle}>
              {(finalLoan.annualRate * 100).toFixed(2)}%
            </span>
          </div>
        </div>

        {/* Decisions list */}
        <h3>Decisions you made</h3>
        <ul style={{ lineHeight: 1.6, marginBottom: "28px" }}>
          {decisions.map((label, index) => (
            <li key={index}>{label}</li>
          ))}
        </ul>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: "12px" }}>
          <button
            onClick={handleSaveSimulation}
            disabled={isSaving || isSaved}
            style={{
              backgroundColor: isSaved ? "#9ca3af" : "#10b981",
              color: "white",
              padding: "10px 22px",
              borderRadius: "8px",
              border: "none",
              cursor: isSaved ? "default" : "pointer",
              fontSize: "1rem",
            }}
          >
            {isSaving ? "Saving…" : isSaved ? "Saved" : "Save simulation"}
          </button>

          <button
            onClick={onClose}
            style={{
              backgroundColor: "#3b82f6",
              color: "white",
              padding: "10px 22px",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              fontSize: "1rem",
            }}
          >
            Close summary
          </button>
        </div>
      </div>
    </div>
  );
}


//Parent component: holds the current LoanState & scenario id.
//Pattern inspired by "Game" component in GeeksforGeeks text adventure.
//Layout and progress bar adapted from W3Schools "How To - Progress Bars"
function LoanSimulation({
  initialLoan,
  scenarios,
  onExit,
  carName,
}: {
  initialLoan: LoanState;
  scenarios: ScenarioNode[];
  onExit: () => void;
  carName: string;
}) {


  const [loan, setLoan] = useState<LoanState>(initialLoan);
  const [scenarioIndex, setScenarioIndex] = useState<number>(0);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [previousLoan, setPreviousLoan] = useState<LoanState | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [decisionHistory, setDecisionHistory] = useState<string[]>([]);
  const [endMessage, setEndMessage] = useState<string | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<number[]>([  //Track monthly payment trend for sparkline graph
    initialLoan.monthlyPayment,
  ]);



  const scenario = scenarios[scenarioIndex] ?? null;
  const totalScenarios = scenarios.length;
  const currentIndex = scenario ? scenarioIndex + 1 : totalScenarios;

  const progressPct =
  totalScenarios > 0 ? (currentIndex / totalScenarios) * 100 : 0;



  //US-06 - Scenarios built into simulator
  //US-07 - User can pick between two decisions in reaction to a scenario
  function handleChoice(choice: ScenarioChoice) {
  //US-08 - A before and after of loan details from a user’s decision
  //stores current loan for before/after comparison
  setPreviousLoan(loan);

  //US-09 - A “simulation complete” details page with information on how the user ended up after they made their decisions
  //record the label of the decision
  setDecisionHistory((prev) => [...prev, choice.label]);

  //US-08 - A before and after of loan details from a user’s decision
  //Apply user choice
  const updatedLoan = choice.apply(loan); 
  setLoan(updatedLoan);
  
  //US-18 - Graphical Insights
  setPaymentHistory((prev) => [...prev, updatedLoan.monthlyPayment]); //track payment changes for sparkline graph
  setExplanation(choice.explanation);

  //If finance is fully cleared, end simulation early
const outstanding =
  updatedLoan.principal +
  (updatedLoan.financeType === "pcp" ? updatedLoan.balloon : 0);

if (outstanding <= 0) {
  setEndMessage("Simulation ended early: your finance balance reached €0.");
  //US-09 - A “simulation complete” details page with information on how the user ended up after they made their decisions
  setShowSummary(true);
  setScenarioIndex(scenarios.length); // forces scenario to null
  return;
}


  //stop early if the choice indicates to end the simulation
  if (choice.endsSimulation) {
    setEndMessage("Simulation ended early: you chose to settle the finance agreement.");
    setShowSummary(true);
    setScenarioIndex(scenarios.length); // forces scenario to null
    return;
  }

  const nextIndex = scenarioIndex + 1;

  if (nextIndex >= scenarios.length) {
    setShowSummary(true);
    setScenarioIndex(scenarios.length); // forces scenario to null
  } else {
    setScenarioIndex(nextIndex);
  }
}

  //US-10 - Simulation scenarios are randomised and selected from a large pool of possible scenarios
  //Resets all state to initial values to allow restarting the simulation 
  function handleRestart() {
    setLoan(initialLoan);
    setScenarioIndex(0);
    setExplanation(null);
    setPreviousLoan(null);
    setShowSummary(false);
    setDecisionHistory([]);
    setEndMessage(null);
    setPaymentHistory([initialLoan.monthlyPayment]);
  }

  //US-18 - Graphical Insights
  //Sparkline graph to show trends over time
  function Sparkline({
  values,
  width = 200,
  height = 45,
}: {
  values: number[];
  width?: number;
  height?: number;
}) {
  if (!values || values.length < 2) {
    return <div style={{ fontSize: "0.85rem", opacity: 0.6 }}>No trend yet</div>;
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * width;
      const y = height - ((v - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");

  const lastValue = values[values.length - 1];
  const lastY = height - ((lastValue - min) / range) * height;

  return (
    <svg width={width} height={height}>
      <polyline
        fill="none"
        stroke="#3b82f6"
        strokeWidth="2"
        points={points}
      />
      <circle cx={width} cy={lastY} r="3" fill="#3b82f6" />
    </svg>
  );
}


  //US-08 - A before and after of loan details from a user’s decision
  //helper to render change arrows/colour
  function renderChange(before: number, after: number, isRate = false) {
    if (after > before) {
      return (
        <span style={{ color: "#b91c1c", fontWeight: 500 }}>
          {isRate ? after.toFixed(2) + "%" : "€" + after.toFixed(2)} ▲
        </span>
      );
    }
    if (after < before) {
      return (
        <span style={{ color: "#15803d", fontWeight: 500 }}>
          {isRate ? after.toFixed(2) + "%" : "€" + after.toFixed(2)} ▼
        </span>
      );
    }
    return (
      <span style={{ opacity: 0.8 }}>
        {isRate ? after.toFixed(2) + "%" : "€" + after.toFixed(2)}
      </span>
    );
  }

  function renderMonthsChange(before: number, after: number) {
    if (after > before) {
      return (
        <span style={{ color: "#b91c1c", fontWeight: 500 }}>
          {after} months ▲
        </span>
      );
    }
    if (after < before) {
      return (
        <span style={{ color: "#15803d", fontWeight: 500 }}>
          {after} months ▼
        </span>
      );
    }
    return <span style={{ opacity: 0.8 }}>{after} months</span>;
  }

  return (
    <div
      style={{
        backgroundColor: "#f3f4f6",
        minHeight: "100vh",
        paddingTop: "80px",
      }}
    >
      <div
        className="container"
        style={{ maxWidth: "960px", margin: "0 auto 40px auto" }}
      >
        <h1 style={{ textAlign: "center" }}>Car Loan Simulation</h1>
        <p
          className="lead mt-3"
          style={{ textAlign: "center", opacity: 0.85 }}
        >
          Make decisions and see how they change your repayments, term and total
          interest over time.
        </p>

        {/*Progress bar (adapted from W3Schools progress bar example)*/}
        <div
          style={{
            margin: "20px auto 10px auto",
            maxWidth: "480px",
            backgroundColor: "#e5e7eb",
            borderRadius: "999px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "10px",
              width: `${progressPct}%`,
              background:
                "linear-gradient(90deg, #3b82f6 0%, #6366f1 50%, #22c55e 100%)",
              transition: "width 0.25s ease-out",
            }}
          />
        </div>
        <div style={{ textAlign: "center", marginBottom: "10px" }}>
          {scenario ? (
            <span className="small">
              Scenario {currentIndex} of {totalScenarios}
            </span>
          ) : (
            <span className="small">Simulation complete</span>
          )}
        </div>

          {/*US-18 - Graphical Insights}
          {/*Sparkline graph showing monthly payment trend over time*/}
        <div
  style={{
    backgroundColor: "#ffffff",
    borderRadius: "14px",
    padding: "16px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
    marginBottom: "16px",
    maxWidth: "720px",
    marginLeft: "auto",
    marginRight: "auto",
  }}
>
  <div style={{ fontWeight: 700, marginBottom: "8px" }}>
    Monthly repayment trend
  </div>

  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
    <Sparkline values={paymentHistory} />

    <div style={{ fontSize: "0.9rem", opacity: 0.8 }}>
      Start: €{paymentHistory[0].toFixed(2)}
      <br />
      Now: €{paymentHistory[paymentHistory.length - 1].toFixed(2)}
    </div>
  </div>
</div>


        {/*Loan summary card*/}
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "14px",
            padding: "24px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
            marginTop: "10px",
            marginBottom: "10px",
          }}
        >
          <p>
            <b>Principal remaining:</b> €{loan.principal.toFixed(2)}
          </p>
          <p>
            <b>Annual interest rate:</b>{" "}
            {(loan.annualRate * 100).toFixed(2)}%
          </p>
          <p>
            <b>Term remaining:</b> {loan.termMonthsRemaining} months
          </p>
          <p>
            <b>Monthly repayment:</b> €{loan.monthlyPayment.toFixed(2)}
          </p>
          <p>
            <b>Total interest on this finance:</b> €
            {loan.totalInterestOnFinance.toFixed(2)}
          </p>
          {loan.financeType === "pcp" && (
            <p>
              <b>Balloon / GMFV at end:</b> €{loan.balloon.toFixed(2)}
            </p>
          )}
        </div>

        {/* US-08 - A before and after of loan details from a user’s decision
        {/*Before vs After*/}
        {previousLoan && (
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "14px",
              padding: "18px 20px",
              boxShadow: "0 1px 6px rgba(0,0,0,0.05)",
              marginBottom: "16px",
              maxWidth: "720px",
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            <h5 style={{ marginBottom: "10px" }}>Impact of your last decision</h5>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "0.9rem",
              }}
            >
              <thead>
                <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                  <th
                    style={{
                      textAlign: "left",
                      paddingBottom: "6px",
                      fontWeight: 600,
                    }}
                  >
                    Metric
                  </th>
                  <th
                    style={{
                      textAlign: "left",
                      paddingBottom: "6px",
                      fontWeight: 600,
                    }}
                  >
                    Before
                  </th>
                  <th
                    style={{
                      textAlign: "left",
                      paddingBottom: "6px",
                      fontWeight: 600,
                    }}
                  >
                    After
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: "4px 0" }}>Monthly repayment</td>
                  <td style={{ padding: "4px 0" }}>
                    €{previousLoan.monthlyPayment.toFixed(2)}
                  </td>
                  <td style={{ padding: "4px 0" }}>
                    {renderChange(
                      previousLoan.monthlyPayment,
                      loan.monthlyPayment
                    )}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: "4px 0" }}>Total interest</td>
                  <td style={{ padding: "4px 0" }}>
                    €{previousLoan.totalInterestOnFinance.toFixed(2)}
                  </td>
                  <td style={{ padding: "4px 0" }}>
                    {renderChange(
                      previousLoan.totalInterestOnFinance,
                      loan.totalInterestOnFinance
                    )}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: "4px 0" }}>Term remaining</td>
                  <td style={{ padding: "4px 0" }}>
                    {previousLoan.termMonthsRemaining} months
                  </td>
                  <td style={{ padding: "4px 0" }}>
                    {renderMonthsChange(
                      previousLoan.termMonthsRemaining,
                      loan.termMonthsRemaining
                    )}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: "4px 0" }}>Annual interest rate</td>
                  <td style={{ padding: "4px 0" }}>
                    {(previousLoan.annualRate * 100).toFixed(2)}%
                  </td>
                  <td style={{ padding: "4px 0" }}>
                    {renderChange(
                      previousLoan.annualRate * 100,
                      loan.annualRate * 100,
                      true
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/*US-09 - A “simulation complete” details page with information on how the user ended up after they made their decisions
        {/* Scenario or completion message */}
        {scenario ? (
          <LoanScenarioView scenario={scenario} onChoose={handleChoice} />
        ) : (
          <div
            className="card mt-4 mx-auto"
            style={{
              maxWidth: "720px",
              borderRadius: "12px",
              border: "1px solid #e5e7eb",
              backgroundColor: "#ffffff",
              boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
            }}
          >
            <div className="card-body">
              <h2 className="card-title">Simulation complete</h2>

                { endMessage ? (
                  <p className="card-text">
                    {endMessage} You can restart, or go back to the calculator to try different loan details.
                  </p>
                ) : (
                  <p className="card-text">
                    You have reached the end of the current set of scenarios. You can restart, or go back to the calculator to try different loan details.
                  </p>
                )}

              <button className="btn btn-secondary" onClick={handleRestart}>
                Restart Simulation
              </button>
              <button
                className="btn btn-outline-primary"
                style={{ marginLeft: "10px" }}
                onClick={onExit}
              >
                Back to Calculator
              </button>
            </div>

            {showSummary && (
              <FinalSummary
                finalLoan={loan}
                decisions={decisionHistory}
                onClose={() => setShowSummary(false)}
                carName={carName}
              />
            )}
          </div>
        )}
          
            {explanation && (
      <div
        style={{
          maxWidth: "720px",
          margin: "16px auto 0",
          padding: "12px 16px",
          backgroundColor: "#f0f9ff",
          borderLeft: "4px solid #3b82f6",
          borderRadius: "8px",
          boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: "4px" }}>
          💡 What this means
        </div>
        <p style={{ margin: 0, lineHeight: 1.5 }}>
          {explanation}
        </p>
      </div>
    )}


        <div
          style={{
            marginTop: "16px",
            display: "flex",
            justifyContent: "center",
            gap: "10px",
          }}
        >
          <button className="btn btn-secondary" onClick={handleRestart}>
            Restart Simulation
          </button>
          <button className="btn btn-outline-primary" onClick={onExit}>
            Back to Calculator
          </button>
        </div>
      </div>
    </div>
  );
}

//react component for the car finance simulator page
export default function CarFinanceSimulatorPage() {
  //switches between setup/calculator and simulation mode
  const [mode, setMode] = useState<"setup" | "simulate">("setup");
  const [simLoan, setSimLoan] = useState<LoanState | null>(null);

  //US-01 - Build a car loan calculator where the user can put in their own inputs
  //default values
  const [financeType, setFinanceType] = useState<FinanceType>("loan");
  const [cashPrice, setCashPrice] = useState(25000);
  const [deposit, setDeposit] = useState(5000);
  const [fees, setFees] = useState(0);
  const [aprPct, setAprPct] = useState(6.9);
  const [termMonths, setTermMonths] = useState(60);
  const [balloon, setBalloon] = useState(10000); //used for PCP only
  const [error, setError] = useState<string | null>(null);
  const [shuffledScenarios, setShuffledScenarios] = useState<ScenarioNode[]>([]); //shuffles the scenarios when starting simulator
  const [showSchedule, setShowSchedule] = useState(false); //hides/shows repayment schedule
  const [inputTab, setInputTab] = useState<"presets" | "custom">("presets");  //which input tab is active
  const [selectedPresetId, setSelectedPresetId] = useState<string>(""); //which preset is selected
  const [carName, setCarName] = useState<string>(""); //stores the name of the car for display in the simulator


  //keep a separate string for the term input to avoid getting stuck at 1
  const [termStr, setTermStr] = useState("60");

  //US-01 - Build a car loan calculator where the user can put in their own inputs
  //US-03 - Input Validation
  //useMemo recalculates result when inputs change, keeps UI responsive
  const result = useMemo(() => {
    try {
      setError(null);
      const res = calculate({ cashPrice, deposit, fees, aprPct, termMonths, financeType, balloon });
      return res;
    } catch (e: any) {
      setError(e?.message || "Invalid inputs");
      return null;
    }
    //Recalculate when any input changes
  }, [cashPrice, deposit, fees, aprPct, termMonths, financeType, balloon]);

  //ref used to scroll to the Custom details section (must be top-level in the component, not inside a function)
const customSectionRef = useRef<HTMLDivElement | null>(null);

//handler for the "Edit preset details" button
function handleEditPresetDetails() {
  setInputTab("custom");

  // Wait for the Custom tab to render, then scroll to it
  setTimeout(() => {
    customSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 0);
}
  //Start the simulator with the current inputs
 function handleBeginSimulator() {
  if (!result || error) return;

  const inputs: Inputs = { cashPrice, deposit, fees, aprPct, termMonths, financeType, balloon };
  const initialLoan = createInitialLoanState(inputs, result);

  //US-10 - Simulation scenarios are randomised and selected from a large pool of possible scenarios
  //Selecting a random subset 
  const shuffled = shuffleArray(loanScenarios);
  const selected = shuffled.slice(0, 10); //10 scenarios per simulation

  setShuffledScenarios(selected);
  setSimLoan(initialLoan);
  setMode("simulate");
}

//US-14 - User can choose a preset (type of car) with preset finance details
//Applies a selected preset to the calculator inputs
function applyPreset(preset: FinancePreset) {
  setFinanceType(preset.financeType);
  setCashPrice(preset.cashPrice);
  setDeposit(preset.deposit);
  setFees(preset.fees);
  setAprPct(preset.aprPct);
  setTermMonths(preset.termMonths);
  setTermStr(String(preset.termMonths)); // keep term input in sync
  setCarName(preset.label); //store car name for display in simulator

  if (preset.financeType === "pcp") {
    setBalloon(preset.balloon ?? 0);
  }
}




  //UI structure for the simulator page
  //W3Schools ("React Forms") and React.dev documentation, with structure refined
  //used ChatGPT as aid
  return (
    <>
      <Navbar />  {/*Added navbar*/}

      {/* SETUP / CALCULATOR MODE */}
      {mode === "setup" && (
        <div className="container" style={{ marginTop: "80px" }}> {/*Added margin so it doesn’t overlap */}

          <h1>Car Finance Simulator</h1>
          {/*Instruction line for users*/}
          <p style={{ marginBottom: "20px", opacity: 0.8 }}>
            Enter your car details below to simulate your loan repayments and costs.
          </p>
          <p className="lead mt-4">
            Compare a standard <b>car loan</b> vs <b>PCP</b> (with balloon/GMFV).
          </p>

                  {/*Card-style wrapper for calculator */}
                  {/* Input mode tabs (Presets vs Custom) */}
                  {/* Input mode tabs – visual structure adapted from W3Schools Tabs, logic implemented with React state */}
        <div
          className="tab"
          role="tablist"
          aria-label="Input mode tabs"
          style={{ marginBottom: "16px" }}
        >
          <button
            type="button"
            className={`tablinks ${inputTab === "presets" ? "active" : ""}`}
            onClick={() => setInputTab("presets")}
            role="tab"
            aria-selected={inputTab === "presets"}
          >
            🚗 Example cars
          </button>

          <button
            type="button"
            className={`tablinks ${inputTab === "custom" ? "active" : ""}`}
            onClick={() => setInputTab("custom")}
            role="tab"
            aria-selected={inputTab === "custom"}
          >
            ✏️ Custom details
          </button>
        </div>

        <p className="small" style={{ marginBottom: "12px", opacity: 0.75 }}>
          Choose a preset to get started quickly, or enter your own finance details.
        </p>

        {inputTab === "presets" && (
          <div className="tabcontent">
            <div
              style={{
                background: "linear-gradient(135deg, #f9fafb, #ffffff)",
                border: "1px solid #e5e7eb",
                borderRadius: "12px",
                padding: "18px",
                marginBottom: "20px",
                boxShadow: "0 4px 10px rgba(0,0,0,0.04)",
                position: "relative",
              }}
            >     
                  {/*US-14 - User can choose a preset (type of car) with preset finance details
                  {/* Preset details */}
{selectedPresetId && (
  <div
    style={{
      marginTop: "12px",
      padding: "12px 14px",
      border: "1px solid #e5e7eb",
      borderRadius: "10px",
      backgroundColor: "#f9fafb",
    }}
  >
    <div style={{ fontWeight: 600, marginBottom: "8px" }}>
      Preset details
    </div>

    {/* Preset summary values */}
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: "8px",
      }}
    >
      <div><b>Cash price:</b> €{cashPrice.toLocaleString()}</div>
      <div><b>Deposit:</b> €{deposit.toLocaleString()}</div>
      <div><b>APR:</b> {aprPct}%</div>
      <div><b>Term:</b> {termMonths} months</div>

      {financeType === "pcp" && (
        <div><b>Balloon / GMFV:</b> €{balloon.toLocaleString()}</div>
      )}
    </div>

    {/* Clear edit CTA */}
    <div
      style={{
        marginTop: "12px",
        display: "flex",
        gap: "10px",
        alignItems: "center",
      }}
    >
      <button
        type="button"
        className="btn btn-outline-primary"
        onClick={handleEditPresetDetails}
        style={{
          borderRadius: "10px",
          padding: "10px 14px",
          fontWeight: 600,
        }}
      >
        ✏️ Edit preset details
      </button>

      <span style={{ fontSize: "0.9rem", opacity: 0.8 }}>
        Opens <b>Custom details</b>
      </span>
    </div>
  </div>
)}


              <label className="label">
                <span className="tooltip">
                  Choose a car preset
                  <span className="tooltiptext">
                    Select a realistic Irish car finance example. You can still edit the
                    details afterwards.
                  </span>
                </span>

                <div
  style={{
    position: "relative",
    maxWidth: "720px",
  }}
>         {/* US-14 - User can choose a preset (type of car) with preset finance details*/}
          <select
            className="select"
            value={selectedPresetId}
            onChange={(e) => {
              const id = e.target.value;
              setSelectedPresetId(id);

              const preset = financePresets.find((p) => p.id === id);
              if (preset) {
                applyPreset(preset);
              }
            }}
            style={{
              appearance: "none",
              WebkitAppearance: "none",
              MozAppearance: "none",
              width: "100%",
              padding: "12px 44px 12px 14px",
              borderRadius: "10px",
              border: "1px solid #d1d5db",
              backgroundColor: "#ffffff",
              fontSize: "0.95rem",
              cursor: "pointer",
              boxShadow: "0 1px 6px rgba(0,0,0,0.04)",
              transition: "border-color 0.15s ease, box-shadow 0.15s ease",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "#3b82f6";
              e.currentTarget.style.boxShadow = "0 0 0 4px rgba(59,130,246,0.15)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "#d1d5db";
              e.currentTarget.style.boxShadow = "0 1px 6px rgba(0,0,0,0.04)";
            }}
          >
            <option value="">Select a preset...</option>
            {financePresets.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.label}
              </option>
            ))}
          </select>

          {/* Custom dropdown arrow */}
          <span
            style={{
              position: "absolute",
              right: "14px",
              top: "50%",
              transform: "translateY(-50%)",
              pointerEvents: "none",
              color: "#6b7280",
              fontSize: "0.9rem",
            }}
          >
            ▼
          </span>
        </div>

              </label>

              <p className="small mt-8" style={{ color: "#6b7280" }}>
                Selecting a preset will automatically populate realistic finance values.
                You can fine-tune them in <b>Custom details</b>.
              </p>
            </div>
          </div>
        )}




          <div
            style={{
              backgroundColor: "#f9f9f9",
              borderRadius: "10px",
              padding: "30px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              marginTop: "30px",
            }}
          >
            {/*Inputs*/}
            {inputTab === "custom" && (
            <div ref={customSectionRef} className="grid-2 mt-20">
              <div className="grid-gap-10">
                {/*Finance Type*/}
                <label className="label">
                  <span className="tooltip">
                    Finance Type
                    <span className="tooltiptext">
                      Choose between a <b>standard car loan</b> or a <b>PCP (Personal Contract Plan)</b>. 
                      PCPs include a final payment known as the GMFV.
                    </span>
                  </span>
                  <select
                    className="select"
                    value={financeType}
                    onChange={(e) => setFinanceType(e.target.value as FinanceType)}
                  >
                    <option value="loan">Loan (no balloon)</option>
                    <option value="pcp">PCP (with balloon/GMFV)</option>
                  </select>
                </label>

                {/* US-01 - Build a car loan calculator where the user can put in their own inputs */}
                {/*Where user edits inputs */}
                {/* Car name input */}
                <label className="label">
              Car name (optional)
              <input
                className="input"
                type="text"
                value={carName}
                onChange={(e) => setCarName(e.target.value)}
                placeholder="e.g. 2019 VW Golf"
              />
            </label>

                {/* US-05 - Tooltips added to loan form headings
                {/*Car Price Input*/}
                <label className="label">
                  <span className="tooltip">
                    Cash Price (€)
                    <span className="tooltiptext">
                      The full on-the-road price of the vehicle including VAT.
                    </span>
                  </span>
                  <input
                    className="input"
                    type="number"
                    value={cashPrice.toString()}
                    onChange={(e) => {
                      const v = Number(e.target.value) || 0;
                      setCashPrice(Math.min(Math.max(v, 0), 250000));
                    }}
                    min={0}
                    max={250000}
                  />

                </label>



                {/*Deposit Input*/}
                <label className="label">
                  <span className="tooltip">
                    Deposit (€)
                    <span className="tooltiptext">
                      The upfront amount you pay before financing. A higher deposit reduces monthly payments.
                    </span>
                  </span>
                  <input
                    className="input"
                    type="number"
                    value={deposit.toString()}
                    onChange={(e) => {
                      const v = Number(e.target.value) || 0;
                      setDeposit(Math.min(Math.max(v, 0), cashPrice));
                    }}
                    min={0}
                    max={cashPrice}
                  />
                </label>

                {/*Fees Input*/}
                <label className="label">
                  <span className="tooltip">
                    Flat Fees (€)
                    <span className="tooltiptext">
                      Any one-time admin or documentation charges added to the finance agreement.
                    </span>
                  </span>
                  <input
                    className="input"
                    type="number"
                    value={fees.toString()}
                    onChange={(e) => {
                      const v = Number(e.target.value) || 0;
                      setFees(Math.min(Math.max(v, 0), 5000));
                    }}
                    min={0}
                    max={5000}
                  />
                </label>
              </div>

              {/*Right column inputs*/}
              <div className="grid-gap-10">
                {/*APR Input*/}
                <label className="label">
                  <span className="tooltip">
                    APR (%)
                    <span className="tooltiptext">
                      The <b>Annual Percentage Rate (APR)</b> is the yearly cost of borrowing, 
                      including interest and any fees.
                    </span>
                  </span>
                  <input
                    className="input"
                    type="number"
                    step="0.01"
                    value={aprPct.toString()}
                    onChange={(e) => {
                      const v = Number(e.target.value) || 0;
                      setAprPct(Math.min(Math.max(v, 0), 50));
                    }}
                    min={0}
                    max={50}
                  />
                </label>

                {/*Term Input*/}
                <label className="label">
                  <span className="tooltip">
                    Term (months)
                    <span className="tooltiptext">
                      The total number of months you will make repayments over.
                    </span>
                  </span>
                  <input
                    className="input"
                    type="text"            
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={termStr}
                    onChange={(e) => {
                      const s = e.target.value;
                      if (s === "") { setTermStr(""); return; } //allow empty while typing
                      const num = Number(s);
                      if (Number.isNaN(num)) return; //ignore non-numeric inputs
                      if (num > 96) { setTermStr("96"); setTermMonths(96); return; } //cap high
                      setTermStr(s);
                      if (num >= 1) setTermMonths(num); //only update numeric state when valid
                    }}
                    onBlur={() => {
                      //on leaving field, clamp to valid range
                      const num = Number(termStr);
                      const clamped = Math.min(Math.max(num || 1, 1), 96);
                      setTermStr(String(clamped));
                      setTermMonths(clamped);
                    }}
                    placeholder="e.g. 60"
                  />
                </label>

                {/*Balloon Input for PCP only*/}
                {financeType === "pcp" && (
                  <label className="label">
                    <span className="tooltip">
                      Balloon / GMFV at End (€)
                      <span className="tooltiptext">
                        The <b>Guaranteed Minimum Future Value (GMFV)</b> is a final lump-sum due at the end 
                        of a PCP agreement if you wish to keep the car.
                      </span>
                    </span>
                    <input
                      className="input"
                      type="number"
                      value={balloon.toString()}
                      onChange={(e) => setBalloon(Number(e.target.value) || 0)}
                      min={0}
                      max={cashPrice}
                    />
                  </label>
                )}

                {/*Amount financed explanation*/}
                <div className="small mt-8">
                  <b>Amount financed</b> = Cash Price − Deposit + Fees
                </div>
              </div>
            </div>
            )}

            {/* US-03 - Input Validation
            {/*Errors*/}
            {error && (
              <p className="text-danger mt-12">
                {error}
              </p>
            )}
 
            {/* US-01 - Build a car loan calculator where the user can put in their own inputs */}
            {/*Results*/}
            {result && !error && (
              <div className="mt-24">
                <h2>Results</h2>
                <div className="grid-4 mt-8">
                  <Stat label="Amount financed" value={`€${result.amountFinanced.toFixed(2)}`} />
                  <Stat label="Monthly repayment" value={`€${result.monthlyPayment.toFixed(2)}`} />
                  <Stat label="Total amount repayable" value={`€${result.totalAmountRepayable.toFixed(2)}`} />
                  <Stat label="Total cost of credit" value={`€${result.totalCostOfCredit.toFixed(2)}`} />
                </div>

                      {/* Repayment schedule dropdown (styled using ChatGPT assistance) */}
        <details className="mt-24" style={{ maxWidth: "100%" }}>
          <summary
            style={{
              cursor: "pointer",
              listStyle: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
              padding: "12px 14px",
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: "10px",
              boxShadow: "0 1px 6px rgba(0,0,0,0.04)",
              fontWeight: 600,
            }}
          >
            <span>View repayment schedule (first 12 months)</span>
            <span style={{ fontWeight: 500, opacity: 0.75 }}>Click to expand</span>
          </summary>

          <div style={{ marginTop: "12px" }}>
            <table className="table mt-8">
              <thead>
                <tr>
                  <Th>#</Th>
                  <Th>Payment</Th>
                  <Th>Interest</Th>
                  <Th>Principal</Th>
                  <Th>Balance</Th>
                </tr>
              </thead>
              <tbody>
                {result.rows.map((r) => (
                  <tr key={r.period}>
                    <Td>{r.period}</Td>
                    <Td>€{r.payment.toFixed(2)}</Td>
                    <Td>€{r.interest.toFixed(2)}</Td>
                    <Td>€{r.principal.toFixed(2)}</Td>
                    <Td>€{r.balance.toFixed(2)}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>



                {/*PCP note*/}
                {financeType === "pcp" && (
                  <p className="small mt-12">
                    PCP leaves a final <b>balloon/GMFV</b> due at the end of the term. The balance above
                    will reduce but not reach €0 within the term.
                  </p>
                )}

                {/*Begin Simulator button*/}
                <button className="btn btn-primary mt-24" onClick={handleBeginSimulator}>
                  Begin Simulator
                </button>
                <p className="small mt-2" style={{ opacity: 0.8 }}>
                  Start the simulator to see how real-life scenarios affect your repayments.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/*simulation – uses the Game/Story-style structure inspired by GeeksforGeeks*/}
      {mode === "simulate" && simLoan && (
        <LoanSimulation
          initialLoan={simLoan}
          scenarios={shuffledScenarios}
          onExit={() => {
            setMode("setup");
            setSimLoan(null);
          }}
          carName={carName}
        />
      )}
    </>
  );
}

//neat table for displaying a label and value
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card">
      <div className="stat-key">{label}</div>
      <div className="stat-val">{value}</div>
    </div>
  );
}

//table header styling
function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="th">
      {children}
    </th>
  );
}
//cell styling
function Td({ children }: { children: React.ReactNode }) {
  return <td className="td">{children}</td>;
}


//---Code References---
//PMT (annuity) formula and approach adapted from: Corporate Finance Institute (CFI), "Loan Payment Formula" (accessed Nov 2025).
//used ChatGPT (OpenAI, 2025) to help me understand the structure of the PMT formula and to assist in converting it into a working TypeScript function.
//Validations and rounding logic was written by me and all tests were done by me.
//https://corporatefinanceinstitute.com/resources/wealth-management/annuity/

//React structure and hook usage (useState, useMemo) based on React.dev official documentation
//https://react.dev/learn

//Input handling and form structure adapted from W3Schools "React Forms" (accessed Nov 2025):
//https://www.w3schools.com/react/react_forms.asp

//Tooltips: structure and CSS adapted from W3Schools "CSS Tooltip" examples (accessed Nov 2025), then customised to suit this project
//https://www.w3schools.com/css/css_tooltip.asp

//Navbar style adapted from W3Schools "CSS Horizontal Navigation Bar"(accessed Nov 2025), then customised to suit this project.
//https://www.w3schools.com/Css/css_navbar_horizontal.asp
//https://www.w3schools.com/react/react_router.asp

//Scenario engine structure (parent holds current scenario + state, child renders scenario from an array)
//adapted from the pattern in GeeksforGeeks "Create a Text-based Adventure Game using React":
//Used ChatGPT as aid to adapt the structure to my loan simulation context.
//https://www.geeksforgeeks.org/reactjs/create-a-text-based-adventure-game-using-react/

//Card layout for scenario view adapted from W3Schools "How to - CSS Cards" (accessed Nov 2025):
//https://www.w3schools.com/howto/howto_css_cards.asp

//Progress bar style adapted from W3Schools "How To - CSS Progress Bars" (accessed Nov 2025):
//https://www.w3schools.com/howto/howto_css_progressbar.asp

//Button styling and interactive effects (hover, active, ripple) adapted from W3Schools "How To - Animated Buttons",
//"How To - Ripple Effect Button" and "How To - Button Groups" (accessed Nov 2025):
//https://www.w3schools.com/howto/howto_css_animate_buttons.asp
//https://www.w3schools.com/howto/howto_css_ripple_buttons.asp
//https://www.w3schools.com/howto/howto_css_button_group.asp

//Final summary modal layout (overlay, centred content and card-style stats) adapted from W3Schools:
//"How To - CSS Modals" and "How To - CSS Cards" (accessed Nov 2025):
//https://www.w3schools.com/howto/howto_css_modals.asp
//https://www.w3schools.com/howto/howto_css_cards.asp

//Dropdown select styling adapted from W3Schools "How To - Custom Select" (accessed Jan 2026):
//https://www.w3schools.com/tags/tag_select.asp
//https://www.w3schools.com/howto/howto_custom_select.asp

//Tab structure and styling adapted from W3Schools "How To - CSS Tabs" (accessed Jan 2026):
//https://www.w3schools.com/howto/howto_js_tabs.asp