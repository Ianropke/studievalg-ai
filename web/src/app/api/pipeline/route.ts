import { NextResponse } from "next/server";
import { execFile } from "child_process";
import path from "path";
import util from "util";

const execFilePromise = util.promisify(execFile);

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const query = String(body?.query || "Datalogi og Jura").slice(0, 300);
    const riskTolerance = Number(body?.riskTolerance ?? 0.3);

    const projectRoot = path.resolve(process.cwd(), "..");
    const pythonScript = path.join(projectRoot, "agents", "multi_agent_engine.py");
    const venvPython = path.join(projectRoot, "venv", "bin", "python");

    // Execute Python script securely using execFile (avoids shell injection vulnerabilities)
    const { stdout } = await execFilePromise(venvPython, [
      pythonScript,
      "--query", query,
      "--risk", String(riskTolerance)
    ], { cwd: projectRoot });

    // Parse output JSON
    const jsonMatch = stdout.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const payload = JSON.parse(jsonMatch[0]);
      return NextResponse.json(payload);
    } else {
      return NextResponse.json({ error: "Could not parse JSON output from multi-agent engine", raw: stdout });
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to execute multi-agent engine";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
