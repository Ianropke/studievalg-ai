import { NextResponse } from "next/server";
import { execFile } from "child_process";
import path from "path";
import fs from "fs";
import util from "util";
import { z } from "zod";

export const runtime = "nodejs";

const execFilePromise = util.promisify(execFile);
const REMOTE_ENGINE_TIMEOUT_MS = 9000;

const PipelineInputSchema = z.object({
  query: z.string().min(1, "Søgefeltet må ikke være tomt").max(300, "Søgeterm kan ikke overstige 300 tegn"),
  riskTolerance: z.number().min(0, "riskTolerance skal være mellem 0.0 og 1.0").max(1, "riskTolerance skal være mellem 0.0 og 1.0").optional().default(0.3),
  salaryPriority: z.number().min(0, "salaryPriority skal være mellem 0.0 og 1.0").max(1, "salaryPriority skal være mellem 0.0 og 1.0").optional().default(0.5),
  location: z.string().max(100).optional().default("")
});

const PipelineResponseSchema = z.object({
  status: z.string(),
  query: z.string(),
  validation_status: z.string().optional(),
  recommended_programs: z.array(z.object({
    kot_nr: z.string(),
    udbud_titel: z.string(),
    match_score: z.number(),
    automation_risk: z.number(),
    augmentation_potential: z.number(),
    labour_demand: z.number(),
    salary_growth: z.number(),
    ai_resilience: z.number(),
    score_components: z.record(z.string(), z.number()),
    top_positive_factors: z.array(z.string()),
    main_risks: z.array(z.string())
  })).optional().default([]),
  evidence_citations: z.array(z.any()).optional().default([])
});

function validatePipelineResponse(payload: unknown): unknown | null {
  const result = PipelineResponseSchema.safeParse(payload);
  if (!result.success) {
    console.error("[API Route Error] Analytics response failed schema validation:", result.error.format());
    return null;
  }
  return payload;
}

async function callRemoteEngine(input: z.infer<typeof PipelineInputSchema>): Promise<unknown | null> {
  const engineUrl = process.env.ANALYTICS_ENGINE_URL?.trim();
  if (!engineUrl) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REMOTE_ENGINE_TIMEOUT_MS);

  try {
    const response = await fetch(engineUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.ANALYTICS_ENGINE_TOKEN
          ? { Authorization: "Bearer " + process.env.ANALYTICS_ENGINE_TOKEN }
          : {})
      },
      body: JSON.stringify(input),
      signal: controller.signal,
      cache: "no-store"
    });

    const responseText = await response.text();
    let payload: unknown;
    try {
      payload = JSON.parse(responseText);
    } catch {
      console.error("[API Route Error] Remote analytics engine returned invalid JSON.");
      return null;
    }

    if (!response.ok) {
      console.error("[API Route Error] Remote analytics engine returned HTTP", response.status);
      return null;
    }

    return validatePipelineResponse(payload);
  } catch (error) {
    console.error("[API Route Error] Remote analytics engine request failed:", error);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function runLocalEngine(input: z.infer<typeof PipelineInputSchema>): Promise<unknown | null> {
  const projectRoot = path.resolve(process.cwd(), "..");
  const pythonScript = path.join(projectRoot, "agents", "multi_agent_engine.py");
  const venvPython = path.join(projectRoot, "venv", "bin", "python");

  if (!fs.existsSync(venvPython) || !fs.existsSync(pythonScript)) return null;

  const { stdout } = await execFilePromise(venvPython, [
    pythonScript,
    "--query", input.query,
    "--risk", String(input.riskTolerance),
    "--salaryPrio", String(input.salaryPriority),
    "--location", input.location || ""
  ], {
    cwd: projectRoot,
    timeout: 10000
  });

  let parsedPayload: unknown;
  try {
    parsedPayload = JSON.parse(stdout.trim());
  } catch (parseErr) {
    console.error("[API Route Error] Python stdout was not valid JSON:", parseErr);
    return null;
  }

  return validatePipelineResponse(parsedPayload);
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.json().catch(() => null);

    if (!rawBody) {
      return NextResponse.json({ error: "Ugyldig JSON-request i body" }, { status: 400 });
    }

    const parseResult = PipelineInputSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json({
        error: "Ugyldige input-parametre",
        details: parseResult.error.format()
      }, { status: 400 });
    }

    const input = parseResult.data;

    // Production path: configure ANALYTICS_ENGINE_URL to a hosted Python service.
    // Local development path: use the repository venv when it is available.
    const remotePayload = await callRemoteEngine(input);
    if (remotePayload) {
      return NextResponse.json(remotePayload);
    }

    const localPayload = await runLocalEngine(input);
    if (localPayload) {
      return NextResponse.json(localPayload);
    }

    return NextResponse.json({
      status: "unavailable",
      error_code: "ANALYTICS_ENGINE_UNAVAILABLE",
      message: "Studievalgsanalysen er midlertidigt utilgængelig. Venligst benyt den klient-side baserede søge- og filter-motor på forsiden."
    }, { status: 503 });
  } catch (err: unknown) {
    console.error("[API Route Exception]", err);
    return NextResponse.json({
      status: "unavailable",
      error_code: "ANALYTICS_ENGINE_UNAVAILABLE",
      message: "Studievalgsanalysen er midlertidigt utilgængelig."
    }, { status: 503 });
  }
}
