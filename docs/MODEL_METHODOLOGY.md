# Methodological Documentation & Analytics Specifications
**Uddannelsesindsigt — Analytical Framework & Model Architecture (v2026.2 Production Hardened)**

---

## 1. System Overview & Core Philosophy

Uddannelsesindsigt operates as a **deterministic, data-first recommendation and analytics platform**. 
The system does NOT rely on black-box LLM generation to calculate numerical score metrics. All scores, admission kvotienter, labor market projections, and AI exposure estimates originate directly from:

1. **Official Register Data**: Danmarks Statistik (DST) income registers (IND), graduate employment rates, and UFM Den Koordinerede Tilmelding (KOT) historical cutoff grades (2009–2026).
2. **Occupational Task Taxonomies**: International Labour Organization (ILO) DISCO-08 occupational classifications matched to U.S. Department of Labor O*NET 28.1 task databases (274 task statements across 867 SOC codes).
3. **Econometric Time-Series & Scenario Simulations**: Monte Carlo sampling over macro parameter distributions (2025–2035 projection horizon).

---

## 2. Canonical Data Architecture & Provenance

The system enforces a strict 6-stage data flow pipeline:

```text
Raw Register Data (UFM REST API / DST CSV)
        ↓
Data Ingestion & Integrity Validation (DuckDB ETL / SQLite)
        ↓
Canonical Feature Extraction (DISCO-08 Task Exposure & Income Progression)
        ↓
Multi-Factor Weighted Scoring Engine (0.0 to 1.0 Normalized Internal Scale)
        ↓
Staged Retrieval & Candidate Diversity Deduplication
        ↓
Structured UI Presentation & Citational Explanation
```

---

## 3. Authoritative Metric Definitions & Canonical AI Resilience Formula

The model preserves four distinct AI dimensions to prevent confusing task exposure with displacement risk or productivity augmentation:

| Metric | Internal Scale | Display Scale | Definition & Formula |
| :--- | :--- | :--- | :--- |
| **`automation_exposure`** | `0.00 – 1.00` | `0 – 100%` | Extent to which daily work activities interact with or overlap with AI tool capabilities ($1.1 \times \text{automation\_risk}$). High exposure indicates task evolution, NOT necessarily job loss. |
| **`automation_risk`** | `0.00 – 1.00` | `0 – 100%` | Estimated percentage of routine cognitive and manual job tasks susceptible to direct technical replacement by AI. |
| **`augmentation_potential`**| `0.00 – 1.00` | `0 – 100%` | Degree to which AI tools enhance human productivity, decision quality, and output volume without replacing human oversight. |
| **`ai_resilience`** *(Derived Index)* | `0.00 – 1.00` | `0 – 100%` | **Authoritative Derived Index Formula**: <br> $\text{ai\_resilience} = \max\left(0.1, \min\left(1.0, 1.0 - \text{automation\_risk} + 0.2 \cdot \text{augmentation\_potential}\right)\right)$ |
| **`labour_demand`** | `0.00 – 1.00` | `0 – 100%` | Graduate employment score derived from 1–2 year post-graduation employment rates and national vacancy ratios (Danmarks Statistik). |
| **`salary_growth`** | `0.00 – 1.00` | `0 – 100%` | 5-year post-graduation earnings trajectory relative to national graduate median income profiles. |

---

## 4. Staged Retrieval Strategy (Unbiased Recall)

To prevent methodological bias, candidate retrieval uses a strict 4-stage recall process without high-salary fallback bias:

1. **Stage 1 (Exact Match)**: Exact title/keyword match against candidate titles and DISCO-08 occupational descriptions.
2. **Stage 2 (Synonym Expansion)**: Expansion via curated Danish academic domain synonym mapping.
3. **Stage 3 (Broad Subject Token Match)**: Substring token matching against program titles and DISCO titles.
4. **Stage 4 (No Candidates Match)**: If no candidates match the user's query domain, the system explicitly returns `status: "no_relevant_candidates"`. **It NEVER falls back to returning unrelated high-salary or high-demand engineering programs.**

---

## 5. Data Validator Payload & Status Enforcement

The Data Validator Agent (`_data_validator_agent`) checks every candidate program for:
- Finite numerical bounds ($0.0 \le \text{metric} \le 1.0$).
- Program existence in the canonical `education_profile_scores` database table.

It produces an explicit validation payload:
```json
{
  "valid_programs": [...],
  "rejected_programs": [...],
  "rejection_reasons": {},
  "validation_status": "VALID | PARTIALLY_VALID | INVALID | NO_VALID_CANDIDATES"
}
```
If `valid_programs` is empty, the system returns `validation_status: "NO_VALID_CANDIDATES"` and never outputs unvalidated recommendations.

---

## 6. Citation Agent: Separated Source Authority & Claim Relevance

The Evidence Engine evaluates citations by separating source authority from claim relevance:

- **`source_authority`**:
  - `HIGH`: Official registers and statutory institutions (Danmarks Statistik, UFM, OECD, Kraka-Deloitte, AE-rådet).
  - `MEDIUM`: Recognized institutional research and university study boards.
  - `LOW`: Secondary publications.
  - `UNKNOWN`: Unverified metadata.
- **`claim_relevance`**: Token relevance score ($0.0 \le R \le 1.0$).
- **`supports_claim`**: Set to `true` **ONLY IF** `source_authority != "UNKNOWN"` AND `claim_relevance >= 0.70`.

---

## 7. Macro-Scenario Simulator & Model Uncertainty

The scenario engine (`engine/scenario_simulator.py`) projects future task automation ranges (2025 $\rightarrow$ 2030) across 3 macro scenarios:

1. **Konservativt Scenarie**: Slow AI adoption due to regulatory constraints and implementation costs ($\mu_{\text{rate}} = 1.5\%/\text{year}$).
2. **Basisscenarie**: Gradual integration following OECD and Kraka-Deloitte baseline adoption trajectories ($\mu_{\text{rate}} = 3.5\%/\text{year}$).
3. **Accelereret Scenarie**: Rapid breakthrough in autonomous cognitive AI capabilities ($\mu_{\text{rate}} = 7.0\%/\text{year}$).

### Uncertainty Representation
Rather than reporting artificial "confidence intervals" based on Monte Carlo sample size, the simulation samples **parameter distributions** (mean and variance across scenario assumptions) to extract empirical 5th to 95th percentile ranges ($\text{model\_uncertainty\_interval}$, e.g. `42.2% – 63.1%`).

---

## 8. Model Limitations & Scope Disclaimer

- **Model-Based Estimates**: Model scores represent aggregated statistical trajectories across study programs and occupational categories. They do not constitute individual career or salary guarantees.
- **Illustrative Scenarios**: Projections for 2030 are model-based scenario estimates under explicit macro parameters.
- **Guidance Context**: Platform outputs are intended to serve as one decision-support tool among several and should be complemented by professional academic counseling (*studievejledning*).
