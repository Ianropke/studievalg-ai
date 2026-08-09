# Methodological Documentation & Analytics Specifications
**Uddannelsesindsigt — Analytical Framework & Model Architecture (v2026.1)**

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
Candidate Recommendation & Diversity Deduplication
        ↓
Structured UI Presentation & Citational Explanation
```

### Data Provenance Metadata Schema

Every metric computed by the platform carries explicit provenance metadata:

- **`metric`**: Identifies the metric (`automation_risk`, `labour_demand`, `salary_growth`, `augmentation_potential`).
- **`source`**: The authoritative dataset (e.g. *Danmarks Statistik Income Register (IND)*, *O*NET 28.1*).
- **`dataset_version`**: Version identifier (e.g. `2026.1 (Release July 2026)`).
- **`methodology`**: Specific analytical procedure (e.g. *Task-weighted econometric model*).
- **`confidence`**: Categorical evidence quality (`HIGH` for register data, `MEDIUM` for task taxonomy models, `LOW` for unmapped defaults).
- **`last_updated`**: ISO timestamp of data sync.

---

## 3. Metric Definitions & Scientific Interpretation

| Metric | Internal Scale | Display Scale | Definition & Interpretation |
| :--- | :--- | :--- | :--- |
| **`automation_risk`** | `0.00 – 1.00` | `0 – 100%` | Estimated percentage of routine cognitive and manual job tasks susceptible to technical automation by generative AI and autonomous agents over a 5–10 year horizon. |
| **`automation_exposure`** | `0.00 – 1.00` | `0 – 100%` | Extent to which daily work activities interact with or overlap with AI tool capabilities. High exposure does NOT imply job loss, but indicates task evolution. |
| **`augmentation_potential`**| `0.00 – 1.00` | `0 – 100%` | Degree to which AI tools enhance human productivity, decision quality, and output volume without replacing human oversight. |
| **`labour_demand`** | `0.00 – 1.00` | `0 – 100%` | Dimittend-employment score derived from 1–2 year post-graduation employment rates and national vacancy ratios from Danmarks Statistik. |
| **`salary_growth`** | `0.00 – 1.00` | `0 – 100%` | 5-year post-graduation earnings trajectory relative to national graduate median income profiles. |
| **`ai_resilience`** | `0.00 – 1.00` | `0 – 100%` | Computed as $100 - \text{automation\_risk}$. Measures overall job stability against direct AI substitution. |

---

## 4. Multi-Factor Recommendation Matching Model

The recommendation score ($\text{overall\_score} \in [0.0, 1.0]$) is computed using an explicit, deterministic weighted composite formula:

$$\text{overall\_score} = \bar{w}_{\text{ai}} \cdot \text{ai\_resilience} + \bar{w}_{\text{sal}} \cdot \text{salary\_growth} + \bar{w}_{\text{job}} \cdot \text{labour\_demand} + \bar{w}_{\text{loc}} \cdot \text{location\_fit}$$

where normalized weights $\bar{w}_i$ satisfy $\sum \bar{w}_i = 1.0$:

- $w_{\text{ai}} = 0.35$
- $w_{\text{sal}} = 0.25 \times \text{salary\_priority} \times 2.0$
- $w_{\text{job}} = 0.25$
- $w_{\text{loc}} = 0.15$ (if location preference is active, else $0.0$)

---

## 5. Macro-Scenario Simulator & Model Uncertainty

The scenario engine (`engine/scenario_simulator.py`) projects future task automation ranges (2025 $\rightarrow$ 2030) across 3 macro scenarios:

1. **Konservativt Scenarie**: Slow AI adoption due to regulatory constraints and implementation costs ($\mu_{\text{rate}} = 1.5\%/\text{year}$).
2. **Basisscenarie**: Gradual integration following OECD and Kraka-Deloitte baseline adoption trajectories ($\mu_{\text{rate}} = 3.5\%/\text{year}$).
3. **Accelereret Scenarie**: Rapid breakthrough in autonomous cognitive AI capabilities ($\mu_{\text{rate}} = 7.0\%/\text{year}$).

### Uncertainty Representation
Rather than reporting artificial "confidence intervals" based on Monte Carlo sample size, the simulation samples **parameter distributions** (mean and variance across scenario assumptions) to extract empirical 5th to 95th percentile ranges ($\text{model\_uncertainty\_interval}$, e.g. `42.2% – 63.1%`).

---

## 6. Model Limitations & Scope Disclaimer

- **No Individual Guarantees**: Model scores represent aggregated statistical trajectories across study programs and occupational categories. They do not constitute individual career or salary guarantees.
- **Model Uncertainty**: Long-term projections (2030+) are subject to macro-economic shifts, regulatory changes, and unforeseen technological developments.
- **Guidance Context**: Platform outputs are intended to serve as one decision-support tool among several and should be complemented by professional academic counseling (*studievejledning*).
