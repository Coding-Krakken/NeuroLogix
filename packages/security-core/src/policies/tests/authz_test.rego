package neurologix.authz

base_input := {
  "role": "operator",
  "operation": "execute_recipe",
  "from_zone": "ui",
  "to_zone": "core",
  "safety_interlock_active": false,
  "recipe_validated": true,
  "command_risk_level": "low",
  "caller_identity": "operator.user"
}

test_safety_interlock_blocks_non_acknowledge_alarm if {
  not allow
    with input as base_input
    with input.safety_interlock_active as true
    with input.operation as "execute_recipe"
}

test_safety_interlock_allows_acknowledge_alarm if {
  allow
    with input as base_input
    with input.safety_interlock_active as true
    with input.operation as "acknowledge_alarm"
}

test_zone_boundary_denies_ai_to_edge if {
  not allow
    with input as base_input
    with input.role as "admin"
    with input.operation as "update_site_config"
    with input.from_zone as "ai"
    with input.to_zone as "edge"
}

test_zone_boundary_denies_ui_to_edge if {
  not allow
    with input as base_input
    with input.role as "admin"
    with input.operation as "update_site_config"
    with input.from_zone as "ui"
    with input.to_zone as "edge"
}

test_zone_boundary_allows_ui_to_core if {
  allow
    with input as base_input
    with input.role as "admin"
    with input.operation as "update_site_config"
    with input.from_zone as "ui"
    with input.to_zone as "core"
}

test_role_permissions_allow_operator_execute_recipe if {
  allow with input as base_input
}

test_role_permissions_deny_operator_manage_users if {
  not allow
    with input as base_input
    with input.operation as "manage_users"
}

test_ai_agent_allow_valid_dispatch if {
  allow
    with input as base_input
    with input.role as "ai_agent"
    with input.operation as "dispatch_inference"
    with input.from_zone as "ai"
    with input.to_zone as "core"
    with input.caller_identity as "ai-agent.neurologix-ai.svc.cluster.local"
    with input.recipe_validated as true
    with input.command_risk_level as "high"
}

test_ai_agent_deny_critical_risk if {
  not allow
    with input as base_input
    with input.role as "ai_agent"
    with input.operation as "dispatch_inference"
    with input.from_zone as "ai"
    with input.to_zone as "core"
    with input.caller_identity as "ai-agent.neurologix-ai.svc.cluster.local"
    with input.recipe_validated as true
    with input.command_risk_level as "critical"
}

test_ai_agent_deny_unvalidated_recipe if {
  not allow
    with input as base_input
    with input.role as "ai_agent"
    with input.operation as "dispatch_inference"
    with input.from_zone as "ai"
    with input.to_zone as "core"
    with input.caller_identity as "ai-agent.neurologix-ai.svc.cluster.local"
    with input.recipe_validated as false
    with input.command_risk_level as "high"
}

test_ai_agent_deny_non_ai_zone if {
  not allow
    with input as base_input
    with input.role as "ai_agent"
    with input.operation as "dispatch_inference"
    with input.from_zone as "ui"
    with input.to_zone as "core"
    with input.caller_identity as "ai-agent.neurologix-ai.svc.cluster.local"
    with input.recipe_validated as true
    with input.command_risk_level as "high"
}

test_ai_agent_deny_invalid_identity if {
  not allow
    with input as base_input
    with input.role as "ai_agent"
    with input.operation as "dispatch_inference"
    with input.from_zone as "ai"
    with input.to_zone as "core"
    with input.caller_identity as "untrusted-agent.neurologix-ai.svc.cluster.local"
    with input.recipe_validated as true
    with input.command_risk_level as "high"
}
