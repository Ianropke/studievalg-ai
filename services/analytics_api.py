"""Small HTTP wrapper for the analytics engine.

Deploy this service separately from the Next.js frontend. Configure the frontend
with ANALYTICS_ENGINE_URL=https://<service-host>/analyze.
"""

import json
import os
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from agents.multi_agent_engine import MultiAgentEngine  # noqa: E402

MAX_BODY_BYTES = 32 * 1024
API_TOKEN = os.environ.get("ANALYTICS_API_TOKEN", "").strip()
CORS_ORIGIN = os.environ.get("CORS_ORIGIN", "*")
ENGINE = MultiAgentEngine()


def json_response(handler: BaseHTTPRequestHandler, payload: dict[str, Any], status: int) -> None:
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json; charset=utf-8")
    handler.send_header("Content-Length", str(len(body)))
    handler.send_header("Access-Control-Allow-Origin", CORS_ORIGIN)
    handler.send_header("Cache-Control", "no-store")
    handler.end_headers()
    handler.wfile.write(body)


class AnalyticsHandler(BaseHTTPRequestHandler):
    server_version = "StudievalgAnalytics/1.0"

    def log_message(self, format: str, *args: Any) -> None:
        sys.stderr.write("[analytics-api] " + (format % args) + "\n")

    def do_OPTIONS(self) -> None:
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", CORS_ORIGIN)
        self.send_header("Access-Control-Allow-Headers", "Authorization, Content-Type")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.end_headers()

    def do_GET(self) -> None:
        if self.path == "/health":
            json_response(self, {"status": "ok", "service": "analytics-engine"}, 200)
            return
        json_response(self, {"status": "not_found"}, 404)

    def do_POST(self) -> None:
        if self.path != "/analyze":
            json_response(self, {"status": "not_found"}, 404)
            return

        if API_TOKEN and self.headers.get("Authorization") != "Bearer " + API_TOKEN:
            json_response(self, {"status": "unauthorized"}, 401)
            return

        try:
            content_length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            content_length = 0

        if content_length <= 0 or content_length > MAX_BODY_BYTES:
            json_response(self, {"status": "invalid_request", "message": "Request body size is invalid."}, 400)
            return

        try:
            payload = json.loads(self.rfile.read(content_length).decode("utf-8"))
            query = payload.get("query")
            risk_tolerance = payload.get("riskTolerance", 0.3)
            salary_priority = payload.get("salaryPriority", 0.5)
            location = payload.get("location", "")
            if (
                not isinstance(query, str)
                or not 1 <= len(query.strip()) <= 300
                or not isinstance(risk_tolerance, (int, float))
                or not 0 <= risk_tolerance <= 1
                or not isinstance(salary_priority, (int, float))
                or not 0 <= salary_priority <= 1
                or not isinstance(location, str)
                or len(location) > 100
            ):
                raise ValueError("Invalid analytics input.")
        except (ValueError, TypeError, json.JSONDecodeError, UnicodeDecodeError):
            json_response(self, {"status": "invalid_request", "message": "Ugyldige analyseparametre."}, 400)
            return

        try:
            result = ENGINE.run_pipeline(query.strip(), {
                "risk_tolerance": float(risk_tolerance),
                "salary_priority": float(salary_priority),
                "location": location.strip(),
            })
            json_response(self, result, 200)
        except Exception:
            # Do not expose database paths or stack traces to callers.
            sys.stderr.write("[analytics-api] engine request failed\n")
            json_response(self, {
                "status": "unavailable",
                "error_code": "ANALYTICS_ENGINE_ERROR",
                "message": "Studievalgsanalysen er midlertidigt utilgængelig.",
            }, 503)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8000"))
    server = ThreadingHTTPServer(("0.0.0.0", port), AnalyticsHandler)
    print("Analytics API listening on port", port, flush=True)
    server.serve_forever()
