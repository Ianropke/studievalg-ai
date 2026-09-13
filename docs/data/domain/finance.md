# Finance

Separate asking price, transaction price, model valuation and forecast. Preserve currency, nominal/real basis, unit, observation period, frequency, geography, asset and as-of date. Currency/inflation conversion is DERIVED using identified rates/index inputs and a versioned calculation; missing rates block output. Partial observed history is not lifetime history. A recent retrieval does not refresh quarterly observations. Model risk labels remain INFERRED and must disclose validation limits. `examples/finance.json` is a synthetic asking price, not a valuation or financial recommendation.

Host acceptance: test the stated domain invariants at the actual consumer boundary. The general validator does not automatically implement all domain-specific rules.
