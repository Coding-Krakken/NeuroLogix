package neurologix.authz

zone_transition_allowed if {
  input.from_zone == "ai"
  input.to_zone == "core"
  input.operation == "dispatch_inference"
}

zone_transition_allowed if {
  input.from_zone == "ui"
  input.to_zone == "core"
}

zone_transition_allowed if {
  input.from_zone == "edge"
  input.to_zone == "core"
}

zone_transition_allowed if {
  input.from_zone == "core"
  input.to_zone == "edge"
}

deny_reasons["zone boundary violation"] if {
  not zone_transition_allowed
}
