# Wardrobe

Manufacturer/retailer material declarations are OBSERVED with an exact product source. Image material or colour classification is INFERRED; never upgrade it based on confidence. Physical location must be observed or explicitly user supplied, with item identity and time. Outfit consumers must gate every item and require the requested physical location; do not assume items in different locations are available together. A location change creates a new claim. `examples/wardrobe.json` is a synthetic location observation, not an inventory of Ian's clothing. Accuracy requires representative real garments and independent labels.

Host acceptance: test the stated domain invariants at the actual consumer boundary. The general validator does not automatically implement all domain-specific rules.
