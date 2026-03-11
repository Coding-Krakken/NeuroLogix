package neurologix.authz

ai_identity_valid if {
  data.data.neurologix.ai_identities[_] == input.caller_identity
}

ai_agent_constraints_satisfied if {
  input.role != "ai_agent"
}

ai_agent_constraints_satisfied if {
  input.role == "ai_agent"
  input.from_zone == "ai"
  input.operation == "dispatch_inference"
  input.recipe_validated == true
  input.command_risk_level != "critical"
  ai_identity_valid
}

deny_reasons["ai_agent constraints violated"] if {
  input.role == "ai_agent"
  not ai_agent_constraints_satisfied
}

allow if {
  not safety_interlock_blocked
  zone_transition_allowed
  allowed_by_role
  command_risk_constraints_satisfied
  auditor_read_only_constraints_satisfied
  ai_agent_constraints_satisfied
}
