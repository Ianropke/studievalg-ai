"""Fail-closed claim validation. Registries and policies must be application-owned."""
from copy import deepcopy
from datetime import datetime, timezone
import json
import math
from pathlib import Path
import rfc3339_validator  # Required: jsonschema otherwise silently skips date-time checks.
from jsonschema import Draft202012Validator, FormatChecker

SCHEMA = json.loads((Path(__file__).resolve().parents[1] / "schemas/claim.schema.json").read_text())
Draft202012Validator.check_schema(SCHEMA)
VALIDATOR = Draft202012Validator(SCHEMA, format_checker=FormatChecker())

class IntegrityError(ValueError):
    def __init__(self, code, detail):
        self.code = code
        super().__init__(f"{code}: {detail}")

def fail(code, detail):
    raise IntegrityError(code, detail)

def timestamp(value):
    try:
        parsed = datetime.fromisoformat(value.upper().replace("Z", "+00:00"))
    except (ValueError, AttributeError):
        fail('INVALID_TIME', 'invalid timestamp')
    if parsed.tzinfo is None:
        fail('INVALID_TIME', 'timezone required')
    return parsed

def same_json(left, right):
    """Type-strict JSON equality; Python otherwise equates true with 1."""
    return json.dumps(left, sort_keys=True, allow_nan=False) == json.dumps(right, sort_keys=True, allow_nan=False)

def references(claim):
    result = list(claim['conflict_claim_ids'])
    for name, key in [('transformation', 'input_claim_ids'), ('verification', 'evidence_claim_ids')]:
        if claim[name]:
            result.extend(claim[name][key])
    return set(result)

def validate_graph(claims, *, transforms=None, verifiers=None, now=None):
    """Validate the full closed graph; callbacks receive copies, never run supplied code."""
    transforms, verifiers = transforms or {}, verifiers or {}
    now = now or datetime.now(timezone.utc)
    if now.tzinfo is None:
        fail('INVALID_POLICY', 'now must have timezone')
    if not isinstance(claims, list) or not claims:
        fail('INSUFFICIENT_DATA', 'nonempty claims list required')
    graph = {}
    for c in claims:
        try:
            json.dumps(c, allow_nan=False)
        except (ValueError, TypeError):
            fail('INVALID_SCHEMA', 'non-JSON or nonfinite value')
        errors = sorted(VALIDATOR.iter_errors(c), key=lambda e: str(e.path))
        if errors:
            fail('INVALID_SCHEMA', errors[0].message)
        if c['claim_id'] in graph:
            fail('DUPLICATE_ID', c['claim_id'])
        graph[c['claim_id']] = deepcopy(c)
    visited, active = set(), set()
    def visit(cid):
        if cid not in graph:
            fail('MISSING_LINEAGE', cid)
        if cid in active:
            fail('CYCLIC_LINEAGE', cid)
        if cid in visited:
            return
        active.add(cid)
        c = graph[cid]
        for rid in references(c):
            visit(rid)
        for key in ['observed_at','retrieved_at']:
            if c[key] and timestamp(c[key]) > now:
                fail('INVALID_TIME', cid)
        if c['observed_at'] and c['retrieved_at'] and timestamp(c['observed_at']) > timestamp(c['retrieved_at']):
            fail('INVALID_TIME', cid)
        if c['source'] and c['source']['evidence_type'] != c['evidence_type']:
            fail('EVIDENCE_MISMATCH', cid)
        if c['evidence_type'] == 'REAL_WORLD' and any(graph[r]['evidence_type'] != 'REAL_WORLD' for r in references(c)):
            fail('EVIDENCE_LAUNDERING', cid)
        status = c['status']
        if status not in ['UNKNOWN','CONFLICT'] and c['value'] is None:
            fail('INSUFFICIENT_DATA', cid)
        if status != 'INFERRED' and c['confidence'] is not None:
            fail('INVALID_STATUS', 'confidence belongs to inference')
        if status not in ['DERIVED','INFERRED'] and c['transformation'] is not None:
            fail('INVALID_STATUS', 'transformation requires DERIVED or INFERRED')
        if status != 'VERIFIED' and c['verification'] is not None:
            fail('INVALID_STATUS', 'verification requires VERIFIED')
        if status != 'CONFLICT' and c['conflict_claim_ids']:
            fail('INVALID_STATUS', 'conflict references require CONFLICT')
        if status in ['DERIVED','INFERRED']:
            t = c['transformation']
            inputs = [graph[r] for r in t['input_claim_ids']]
            if status == 'DERIVED':
                if not inputs:
                    fail('MISSING_LINEAGE', cid)
                if any(i['status'] in ['UNKNOWN','CONFLICT'] for i in inputs):
                    fail('INSUFFICIENT_DATA', cid)
                fn = transforms.get((t['method'],t['version']))
                if fn is None:
                    fail('NOT_VALIDATED', 'unregistered transformation')
                try:
                    result = fn(deepcopy(inputs), deepcopy(c))
                    matches = json.dumps(result, sort_keys=True, allow_nan=False) == json.dumps(c['value'], sort_keys=True, allow_nan=False)
                except Exception as exc:
                    fail('NOT_VALIDATED', type(exc).__name__)
                if not matches:
                    fail('NON_REPRODUCIBLE', cid)
            elif not inputs and c['source'] is None:
                fail('MISSING_LINEAGE', cid)
        if status == 'VERIFIED':
            v = c['verification']
            if timestamp(v['checked_at']) > now or not v['evidence_claim_ids']:
                fail('NOT_VALIDATED', cid)
            evidence = [graph[r] for r in v['evidence_claim_ids']]
            if any(x['status'] in ['UNKNOWN','CONFLICT','INFERRED'] for x in evidence):
                fail('NOT_VALIDATED', cid)
            fn = verifiers.get((v['rule'],v['version']))
            try:
                valid = fn is not None and fn(deepcopy(c),deepcopy(evidence)) is True
            except Exception:
                valid = False
            if not valid:
                fail('NOT_VALIDATED', cid)
        if status == 'CONFLICT':
            evidence = [graph[r] for r in c['conflict_claim_ids']]
            if len(evidence) < 2 or any(x['field'] != c['field'] or not same_json(x['context'], c['context']) for x in evidence):
                fail('INVALID_CONFLICT', cid)
            if any(x['status'] in ['UNKNOWN','CONFLICT'] for x in evidence) or len({json.dumps(x['value'],sort_keys=True) for x in evidence}) < 2:
                fail('INVALID_CONFLICT', cid)
        active.remove(cid)
        visited.add(cid)
    for cid in graph:
        visit(cid)
    return graph

def consume(claims, claim_id, policy, *, transforms=None, verifiers=None, now=None):
    """Return a claim envelope plus full lineage, or a typed degraded state, never a fallback value.

    policy is trusted code/config, never request/LLM input. Status/evidence gates apply
    transitively. Output field/context match is exact; transformation callbacks enforce
    input semantics. Freshness uses observations, not retrieval or calculation time.
    """
    now = now or datetime.now(timezone.utc)
    required = {'field','context','accepted_statuses','accepted_evidence_types','max_age_seconds'}
    if not isinstance(policy, dict) or set(policy) != required:
        fail('INVALID_POLICY', 'explicit complete consumer policy required')
    statuses = policy['accepted_statuses']; types = policy['accepted_evidence_types']; age = policy['max_age_seconds']
    if not isinstance(statuses,list) or not statuses or not all(isinstance(x,str) for x in statuses) or not set(statuses) <= {'OBSERVED','VERIFIED','DERIVED','INFERRED'} or not isinstance(types,list) or not types or not all(isinstance(x,str) for x in types) or not set(types) <= {'REAL_WORLD','SYNTHETIC','MOCK','TEST'}:
        fail('INVALID_POLICY', 'invalid status/evidence allowlist')
    if age is not None and (type(age) not in [int,float] or not math.isfinite(age) or age < 0):
        fail('INVALID_POLICY', 'invalid max_age_seconds')
    graph = validate_graph(claims, transforms=transforms, verifiers=verifiers, now=now)
    if claim_id not in graph:
        fail('INSUFFICIENT_DATA', claim_id)
    c = graph[claim_id]
    if c['field'] != policy['field'] or not same_json(c['context'], policy['context']):
        fail('SEMANTIC_MISMATCH', claim_id)
    lineage = set()
    def gate(cid):
        if cid in lineage:
            return
        lineage.add(cid)
        item = graph[cid]
        if item['status'] == 'CONFLICT':
            fail('SOURCE_CONFLICT', cid)
        if item['status'] == 'UNKNOWN':
            fail('INSUFFICIENT_DATA', cid)
        if item['status'] not in statuses or item['evidence_type'] not in types:
            fail('NOT_VALIDATED', cid)
        # Every source observation must retain its observation time; derived timestamps cannot refresh it.
        if age is not None and (item['source'] or not references(item)):
            if item['observed_at'] is None:
                fail('STALE_DATA', cid)
            if (now-timestamp(item['observed_at'])).total_seconds() > age:
                fail('STALE_DATA', cid)
        for rid in references(item):
            gate(rid)
    gate(claim_id)
    return {'state':'OK', 'claim':deepcopy(c), 'lineage':[deepcopy(graph[x]) for x in sorted(lineage)]}

def present(claims, claim_id, policy, **kwargs):
    try:
        return consume(claims, claim_id, policy, **kwargs)
    except IntegrityError as exc:
        return {'state':exc.code, 'claim':None, 'lineage':[], 'reason':str(exc)}
