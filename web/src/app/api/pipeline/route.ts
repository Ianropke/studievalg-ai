import { NextResponse } from "next/server";
import { exec } from "child_process";
import path from "path";
import util from "util";

const execPromise = util.promisify(exec);

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const query = body?.query || "Datalogi og Jura";
    const riskTolerance = body?.riskTolerance || 0.3;

    const projectRoot = path.resolve(process.cwd(), "..");
    const pythonScript = path.join(projectRoot, "agents", "multi_agent_engine.py");
    const venvPython = path.join(projectRoot, "venv", "bin", "python");

    // Execute the Python 8-Agent Pipeline
    const command = `"${venvPython}" "${pythonScript}" --query "${query}" --risk ${riskTolerance}`;
    const { stdout } = await execPromise(command, { cwd: projectRoot });

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
