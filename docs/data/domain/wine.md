# Wine

Market price must be DERIVED from current comparable retail observations. Match wine, vintage, currency, bottle volume and availability. Advertised discount is never evidence of market price. Example rule: at least two independent retailer publishers, a 24-hour observation limit and positive prices; one observation is INDICATIVE_ONLY (present separately, never as a normal estimate), zero is INSUFFICIENT_DATA. Publisher independence requires adapter verification, not merely distinct strings. The runnable `examples/wine_pipeline.py` blocks fewer than two observations. Critic scores preserve critic/publication/wine/vintage; retailer/internal scores must never be relabelled critic points. Stock claims expire under an explicit project policy.

Host acceptance: test the stated domain invariants at the actual consumer boundary. The general validator does not automatically implement all domain-specific rules.
