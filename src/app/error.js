"use client";

export default function GlobalError({ error, reset }) {
  return (
    <section className="card">
      <h2>Something went wrong</h2>
      <p>The app hit an unexpected error while loading data.</p>
      <p style={{ color: "#b91c1c" }}>{error?.message || "Unknown error"}</p>
      <button type="button" onClick={() => reset()}>
        Try Again
      </button>
    </section>
  );
}
