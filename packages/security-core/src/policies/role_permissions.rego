package neurologix.authz

allowed_by_role if {
  role := input.role
  operation := input.operation
  role_permissions := data.data.neurologix.roles[role]
  role_permissions[_] == operation
}

deny_reasons[sprintf("role '%s' is not allowed to perform '%s'", [input.role, input.operation])] if {
  not allowed_by_role
}
