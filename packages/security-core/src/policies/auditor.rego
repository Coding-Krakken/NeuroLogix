package neurologix.authz

auditor_read_only_constraints_satisfied if {
  input.role != "auditor"
}

auditor_read_only_constraints_satisfied if {
  input.role == "auditor"
  startswith(input.operation, "read_")
  not input.http_method
}

auditor_read_only_constraints_satisfied if {
  input.role == "auditor"
  startswith(input.operation, "read_")
  input.http_method == "GET"
}

deny_reasons["auditor role is read-only"] if {
  input.role == "auditor"
  not auditor_read_only_constraints_satisfied
}