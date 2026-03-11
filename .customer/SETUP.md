# Customer Setup Guide

## Prerequisites

- Provisioned NeuroLogix environment and approved change window
- Customer administrator account with least-privilege assignment
- Approved network/browser access to Mission Control
- Confirmed escalation contacts for operations and security

## Onboarding Workflow

1. Confirm provided **site ID** and **tenant ID** with your implementation lead.
2. Sign in to Mission Control with administrator credentials.
3. Validate line topology and equipment mapping against your physical line layout.
4. Review safety policy defaults and confirm approved recipe catalog visibility.
5. Configure alert recipients and escalation channels.
6. Verify audit logging visibility in dashboards and export path access.

## Go-Live Acceptance Checks

- Execute one controlled non-production recipe run and verify expected state transitions.
- Confirm command path enforces approved recipes (no direct unsafe actuation path).
- Validate alerting pipeline by triggering a test alert and confirming acknowledgement flow.
- Confirm incident runbook links are available to shift leads.

## Day-1 Handoff Checklist

- Customer Admin and Operator roles assigned and validated
- Support and security contact pathways confirmed
- Baseline metrics view shared with operations team
- Evidence of successful dry-run captured for audit records