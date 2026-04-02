import "./globals.css";
import Link from "next/link";
import { getDbStatus, selectOne } from "@/lib/db";
import { getActingCustomerId } from "@/lib/session";

export const metadata = {
  title: "Student Shop App",
  description: "Next.js + Supabase student project"
};

const navLinks = [
  ["Select Customer", "/select-customer"],
  ["Customer Dashboard", "/dashboard"],
  ["Place Order", "/place-order"],
  ["Order History", "/order-history"],
  ["Warehouse Priority Queue", "/warehouse-priority-queue"],
  ["Run Scoring", "/scoring"]
];

const devOnlyLinks = [["Debug Schema", "/debug/schema"]];

export default async function RootLayout({ children }) {
  const dbStatus = getDbStatus();
  const actingCustomerId = await getActingCustomerId();
  let actingCustomer = null;
  if (dbStatus.ok && actingCustomerId != null) {
    try {
      actingCustomer = await selectOne(
        `
          SELECT customer_id, full_name, email
          FROM customers
          WHERE customer_id = ?
        `,
        [actingCustomerId]
      );
    } catch {
      actingCustomer = null;
    }
  }

  return (
    <html lang="en">
      <body>
        <main className="app-shell">
          <h1>Student Shop App</h1>
          {!dbStatus.ok ? (
            <div className="card" style={{ padding: "0.65rem 1rem", background: "#fef2f2", borderColor: "#fecaca" }}>
              Database unavailable at <code>{dbStatus.path}</code>: {dbStatus.error || "unknown error"}
            </div>
          ) : null}
          {actingCustomer ? (
            <div className="card" style={{ padding: "0.65rem 1rem", background: "#ecfeff", borderColor: "#a5f3fc" }}>
              Acting as customer #{actingCustomer.customer_id}: <strong>{actingCustomer.full_name}</strong> ({actingCustomer.email})
            </div>
          ) : null}
          <nav className="nav">
            {navLinks.map(([label, href]) => (
              <Link key={href} href={href}>
                {label}
              </Link>
            ))}
            {process.env.NODE_ENV === "development"
              ? devOnlyLinks.map(([label, href]) => (
                  <Link key={href} href={href}>
                    {label}
                  </Link>
                ))
              : null}
          </nav>
          {children}
        </main>
      </body>
    </html>
  );
}
