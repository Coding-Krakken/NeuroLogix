# Observability Setup

> **Category:** Operations
> **File:** `operations/observability.prompt.md`

---

## Purpose

Design and implement the observability stack: structured logging, metrics collection, error tracking, and distributed tracing.

## When to Use

- Setting up monitoring for the first time
- Adding monitoring for new features
- After an incident (improving observability)
- Before production launch

## Inputs Required

- Application architecture
- SLO definitions
- Critical user journeys
- Infrastructure topology (<DEPLOYMENT_PLATFORM>, <PAYMENT_PROVIDER>)

## Outputs Required

1. **Logging Strategy**
   - Structured JSON format (Pino/Winston)
   - Log levels and when to use each
   - PII redaction rules
   - Correlation IDs for request tracing

2. **Metrics**
   - Business metrics (orders, revenue, conversion)
   - Technical metrics (latency, error rate, saturation)
   - Custom metric definitions

3. **Error Tracking**
   - Sentry configuration
   - Error grouping rules
   - PII scrubbing rules
   - Alert thresholds

4. **Dashboards**
   - Key metrics dashboard layout
   - SLO tracking dashboard
   - Business metrics dashboard

5. **Alerts**
   - Alert rules tied to SLOs
   - Escalation procedures
   - Runbook links per alert

## Quality Expectations

- Every alert has a runbook
- No PII in logs or error reports
- Correlation IDs enable request tracing
- SLOs are measurable

## Failure Cases

- Logging too much → Define log levels strictly
- PII in logs → Add redaction middleware
- Alert fatigue → Tune thresholds, remove noisy alerts

## Evidence Expectations

- Logging configuration
- Sentry setup verification
- Alert rule definitions
- Dashboard specifications

