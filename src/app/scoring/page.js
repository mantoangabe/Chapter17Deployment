import fs from "node:fs";
import path from "node:path";
import { execFile } from "node:child_process";
import { redirect } from "next/navigation";

const PYTHON_TIMEOUT_MS = 120000;
const OUTPUT_LIMIT = 300;

function runPythonInference(scriptPath) {
  return new Promise((resolve, reject) => {
    execFile(
      "python",
      [scriptPath],
      {
        cwd: process.cwd(),
        timeout: PYTHON_TIMEOUT_MS,
        maxBuffer: 1024 * 1024
      },
      (error, stdout, stderr) => {
        if (error) {
          reject({
            error,
            stdout: stdout || "",
            stderr: stderr || ""
          });
          return;
        }
        resolve({
          stdout: stdout || "",
          stderr: stderr || ""
        });
      }
    );
  });
}

function extractScoredCount(stdout) {
  if (!stdout) return null;
  const patterns = [
    /(\d+)\s+orders?\s+scored/i,
    /scored\s+(\d+)\s+orders?/i,
    /(\d+)\s+predictions?/i
  ];
  for (const regex of patterns) {
    const match = stdout.match(regex);
    if (match) return Number(match[1]);
  }
  return null;
}

function cleanMessage(text) {
  return String(text || "").trim().slice(0, OUTPUT_LIMIT);
}

async function runScoringAction() {
  "use server";

  const scriptPath = path.join(process.cwd(), "jobs", "run_inference.py");
  const timestamp = new Date().toISOString();

  if (!fs.existsSync(scriptPath)) {
    redirect(
      `/scoring?status=error&timestamp=${encodeURIComponent(timestamp)}&message=${encodeURIComponent(
        "Script not found: jobs/run_inference.py"
      )}`
    );
  }

  try {
    const { stdout, stderr } = await runPythonInference(scriptPath);
    const scoredCount = extractScoredCount(stdout);
    const status = stderr.trim() ? "warning" : "success";
    const message = cleanMessage(stderr || stdout || "Scoring completed.");

    redirect(
      `/scoring?status=${status}&timestamp=${encodeURIComponent(timestamp)}&count=${
        scoredCount == null ? "" : scoredCount
      }&message=${encodeURIComponent(message)}`
    );
  } catch (result) {
    const rawMessage =
      result?.stderr ||
      result?.stdout ||
      result?.error?.message ||
      "Python scoring failed.";
    const message = cleanMessage(rawMessage);
    redirect(
      `/scoring?status=error&timestamp=${encodeURIComponent(timestamp)}&message=${encodeURIComponent(message)}`
    );
  }
}

export default function ScoringPage({ searchParams }) {
  const status = String(searchParams?.status || "");
  const message = String(searchParams?.message || "");
  const count = String(searchParams?.count || "");
  const timestamp = String(searchParams?.timestamp || "");

  return (
    <section className="card">
      <h2>Run Scoring</h2>
      <p>
        Runs <code>python jobs/run_inference.py</code> on the server to write order-level predictions into{" "}
        <code>order_predictions</code>.
      </p>

      <form action={runScoringAction}>
        <button type="submit">Run Scoring</button>
      </form>

      {status ? (
        <div className="card" style={{ marginTop: "1rem" }}>
          <p>
            <strong>Status:</strong> {status}
          </p>
          <p>
            <strong>Orders scored:</strong> {count || "Not reported by script output"}
          </p>
          <p>
            <strong>Timestamp:</strong> {timestamp || "N/A"}
          </p>
          <p>
            <strong>Output:</strong> {message || "No output"}
          </p>
        </div>
      ) : null}
    </section>
  );
}
