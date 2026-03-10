import { describe, expect, it } from 'vitest';
import {
  MISSION_CONTROL_ACTOR_ROLE_OPTIONS,
  MISSION_CONTROL_APPROVAL_ROLE_OPTIONS,
  MISSION_CONTROL_COMMAND_OPTIONS,
  MISSION_CONTROL_INITIAL_POLICY_STATE,
  MISSION_CONTROL_SHELL_STYLES,
  toOptionMarkup,
} from './mission-control-primitives.js';

describe('mission-control ui primitives', () => {
  it('exposes deterministic command and role options', () => {
    expect(MISSION_CONTROL_COMMAND_OPTIONS.map(option => option.value)).toEqual([
      'allocate_pick',
      'release_pick',
      'reroute_container',
      'hold_container',
    ]);
    expect(MISSION_CONTROL_ACTOR_ROLE_OPTIONS.map(option => option.value)).toEqual([
      'operator',
      'supervisor',
      'admin',
    ]);
    expect(MISSION_CONTROL_APPROVAL_ROLE_OPTIONS.map(option => option.value)).toEqual([
      '',
      'supervisor',
      'admin',
    ]);
  });

  it('renders escaped option markup for select controls', () => {
    const markup = toOptionMarkup([
      { value: 'safe', label: 'Safe' },
      { value: 'unsafe"<', label: "Unsafe '&<" },
    ]);

    expect(markup).toContain('<option value="safe">Safe</option>');
    expect(markup).toContain('&quot;&lt;');
    expect(markup).toContain('&#39;&amp;&lt;');
  });

  it('provides style and policy defaults for shell rendering', () => {
    expect(MISSION_CONTROL_SHELL_STYLES).toContain('.policy-callout--allowed');
    expect(MISSION_CONTROL_INITIAL_POLICY_STATE).toEqual({
      status: 'n/a',
      reason: 'No policy evaluation has run yet.',
      requiredApprovalRole: null,
    });
  });
});
