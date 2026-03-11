package neurologix.authz

default allow := false

safety_interlock_blocked if {
  input.safety_interlock_active == true
  input.operation != "acknowledge_alarm"
}

deny_reasons["safety interlock active: only acknowledge_alarm permitted"] if {
  safety_interlock_blocked
}