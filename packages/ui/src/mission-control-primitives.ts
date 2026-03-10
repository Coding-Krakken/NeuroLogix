export interface UiSelectOption {
  value: string;
  label: string;
}

export const MISSION_CONTROL_COMMAND_OPTIONS: readonly UiSelectOption[] = [
  { value: 'allocate_pick', label: 'allocate_pick' },
  { value: 'release_pick', label: 'release_pick' },
  { value: 'reroute_container', label: 'reroute_container' },
  { value: 'hold_container', label: 'hold_container' },
] as const;

export const MISSION_CONTROL_ACTOR_ROLE_OPTIONS: readonly UiSelectOption[] = [
  { value: 'operator', label: 'operator' },
  { value: 'supervisor', label: 'supervisor' },
  { value: 'admin', label: 'admin' },
] as const;

export const MISSION_CONTROL_APPROVAL_ROLE_OPTIONS: readonly UiSelectOption[] = [
  { value: '', label: 'none' },
  { value: 'supervisor', label: 'supervisor' },
  { value: 'admin', label: 'admin' },
] as const;

export const MISSION_CONTROL_SHELL_STYLES = `
body {
  margin: 0;
  font-family: Inter, Segoe UI, Arial, sans-serif;
  background: #020617;
  color: #e2e8f0;
}
.skip-link {
  position: absolute;
  left: -9999px;
  top: 0;
  background: #0f172a;
  color: #e2e8f0;
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 8px 12px;
  z-index: 10;
}
.skip-link:focus {
  left: 16px;
  top: 16px;
}
.layout {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  gap: 12px;
}
.title {
  margin: 0;
  font-size: 1.5rem;
}
.subtitle {
  margin: 4px 0 0;
  color: #94a3b8;
  font-size: 0.9rem;
}
.toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
}
.btn {
  border: 0;
  border-radius: 8px;
  padding: 10px 14px;
  cursor: pointer;
  font-weight: 600;
}
.btn:focus-visible,
.field input:focus-visible,
.field select:focus-visible,
.field input[type='checkbox']:focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: 2px;
}
.btn-primary {
  background: #2563eb;
  color: #eff6ff;
}
.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.chip {
  background: #1e293b;
  color: #cbd5e1;
  padding: 8px 10px;
  border-radius: 999px;
  font-size: 0.8rem;
}
.error {
  background: #7f1d1d;
  border: 1px solid #dc2626;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 16px;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 16px;
}
.panel {
  background: #0f172a;
  border: 1px solid #1e293b;
  border-radius: 10px;
  padding: 14px;
}
.panel-title {
  margin: 0 0 8px;
  font-size: 1rem;
}
pre {
  margin: 0;
  background: #020617;
  color: #cbd5e1;
  border-radius: 8px;
  border: 1px solid #1e293b;
  padding: 10px;
  overflow: auto;
  max-height: 260px;
}
.dispatch-form {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 10px;
}
.field {
  display: grid;
  gap: 6px;
}
.field label {
  font-size: 0.8rem;
  color: #94a3b8;
}
.field input,
.field select {
  border: 1px solid #334155;
  border-radius: 8px;
  background: #020617;
  color: #e2e8f0;
  padding: 8px;
}
.confirmation-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  color: #cbd5e1;
}
.confirmation-note {
  margin: 0;
  font-size: 0.8rem;
  color: #94a3b8;
}
.dispatch-actions {
  display: flex;
  align-items: end;
}
.policy-callout {
  border-radius: 8px;
  border: 1px solid #334155;
  background: #111827;
  color: #cbd5e1;
  padding: 10px;
  margin-bottom: 12px;
}
.policy-callout--allowed {
  border-color: #16a34a;
  background: #052e16;
  color: #bbf7d0;
}
.policy-callout--requires-approval {
  border-color: #ca8a04;
  background: #422006;
  color: #fde68a;
}
.policy-callout--denied {
  border-color: #dc2626;
  background: #7f1d1d;
  color: #fecaca;
}
.sr-only {
  border: 0;
  clip: rect(0, 0, 0, 0);
  height: 1px;
  margin: -1px;
  overflow: hidden;
  padding: 0;
  position: absolute;
  width: 1px;
}
`;

export interface MissionControlPolicyViewState {
  status: string;
  reason: string;
  requiredApprovalRole: string | null;
}

export const MISSION_CONTROL_INITIAL_POLICY_STATE: MissionControlPolicyViewState = {
  status: 'n/a',
  reason: 'No policy evaluation has run yet.',
  requiredApprovalRole: null,
};

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function toOptionMarkup(options: readonly UiSelectOption[]): string {
  return options
    .map(option => {
      const value = escapeHtml(option.value);
      const label = escapeHtml(option.label);
      return `<option value="${value}">${label}</option>`;
    })
    .join('');
}
