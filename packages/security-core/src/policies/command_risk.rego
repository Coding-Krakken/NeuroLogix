package neurologix.authz

command_risk_policy_applies if {
  data.data.neurologix.command_risk_levels[input.operation]
}

command_risk_level_matches_policy if {
  expected_level := data.data.neurologix.command_risk_levels[input.operation]
  input.command_risk_level == expected_level
}

risk_requirements_satisfied if {
  input.command_risk_level == "low"
  input.role == "operator"
  input.confirmation_accepted == true
}

risk_requirements_satisfied if {
  input.command_risk_level == "medium"
  input.role == "operator"
  input.confirmation_accepted == true
}

risk_requirements_satisfied if {
  input.command_risk_level == "medium"
  input.role == "supervisor"
}

risk_requirements_satisfied if {
  input.command_risk_level == "high"
  input.role == "supervisor"
  input.confirmation_accepted == true
  input.approvedByRole == "supervisor"
}

risk_requirements_satisfied if {
  input.command_risk_level == "critical"
  input.role == "admin"
  input.confirmation_accepted == true
  input.approvedByRole == "admin"
  input.recipe_validated == true
}

command_risk_constraints_satisfied if {
  not command_risk_policy_applies
}

command_risk_constraints_satisfied if {
  command_risk_policy_applies
  command_risk_level_matches_policy
  risk_requirements_satisfied
}

deny_reasons[sprintf("command risk level mismatch for operation '%s'", [input.operation])] if {
  command_risk_policy_applies
  not command_risk_level_matches_policy
}

deny_reasons[sprintf("command risk constraints violated for level '%s'", [input.command_risk_level])] if {
  command_risk_policy_applies
  command_risk_level_matches_policy
  not risk_requirements_satisfied
}