import { NextResponse } from "next/server";
import { execFile } from "child_process";
import path from "path";
import fs from "fs";
import util from "util";
import { z } from "zod";

const execFilePromise = util.promisify(execFile);

// Strict Zod input validation schema
const PipelineInputSchema = z.object({
  query: z.string().min(1, "Søgefeltet må ikke være tomt").max(300, "Søgeterm kan ikke overstige 300 tegn"),
  riskTolerance: z.number().min(0, "riskTolerance skal være mellem 0.0 og 1.0").max(1, "riskTolerance skal være mellem 0.0 og 1.0").optional().default(0.3),
  salaryPriority: z.number().min(0, "salaryPriority skal være mellem 0.0 og 1.0").max(1, "salaryPriority skal være mellem 0.0 og 1.0").optional().default(0.5),
  location: z.string().max(100).optional().default("")
});

export async function POST(request: Request) {
  try {
    const rawBody = await request.json().catch(() => null);

    if (!rawBody) {
      return NextResponse.json({ error: "Ugyldig JSON-request i body" }, { status: 400 });
    }

    // Validate payload against Zod schema
    const parseResult = PipelineInputSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json({
        error: "Ugyldige input-parametre",
        details: parseResult.error.format()
      }, { status: 400 });
    }

    const { query, riskTolerance, salaryPriority, location } = parseResult.data;

    const projectRoot = path.resolve(process.cwd(), "..");
    const pythonScript = path.join(projectRoot, "agents", "multi_agent_engine.py");
    const venvPython = path.join(projectRoot, "venv", "bin", "python");

    // Check if Python venv binary exists
    if (fs.existsSync(venvPython) && fs.existsSync(pythonScript)) {
      const { stdout } = await execFilePromise(venvPython, [
        pythonScript,
        "--query", query,
        "--risk", String(riskTolerance),
        "--salaryPrio", String(salaryPriority),
        "--location", location || ""
      ], {
        cwd: projectRoot,
        timeout: 10000 // 10 second safety execution limit
      });

      const jsonMatch = stdout.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const payload = JSON.parse(jsonMatch[0]);
        return NextResponse.json(payload);
      }
    }

    // If Python engine is unavailable or unconfigured, return HTTP 503 safe failure response
    return NextResponse.json({
      status: "unavailable",
      error_code: "ANALYTICS_ENGINE_UNAVAILABLE",
      message: "Studievalgsanalysen er midlertidigt utilgængelig. Venligst benyt den klient-side baserede søge- og filter-motor på forsiden."
    }, { status: 503 });

  } catch (err: unknown) {
    // Log exception details server-side safely without exposing internal paths or stack traces to client
    console.error("[API Route Error] MultiAgentEngine execution failed:", err);
    return NextResponse.json({
      status: "unavailable",
      error_code: "ANALYTICS_ENGINE_UNAVAILABLE",
      message: "Studievalgsanalysen er midlertidigt utilgængelig."
    }, { status: 503 });
  }
}
