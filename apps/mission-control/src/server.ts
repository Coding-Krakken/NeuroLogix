import type { ServerResponse } from 'node:http';
import Fastify, { FastifyInstance } from 'fastify';
import type { WmsWcsCommandType } from '@neurologix/schemas';
import {
  MISSION_CONTROL_ACTOR_ROLE_OPTIONS,
  MISSION_CONTROL_APPROVAL_ROLE_OPTIONS,
  MISSION_CONTROL_COMMAND_OPTIONS,
  MISSION_CONTROL_INITIAL_POLICY_STATE,
  MISSION_CONTROL_SHELL_STYLES,
} from '@neurologix/ui';
import {
  SiteRegistryService,
  SITE_REGISTRY_ERROR_CODES,
} from '@neurologix/site-registry';
import type { MissionControlActorRole } from './state/mission-control-state.js';
import { MissionControlState } from './state/mission-control-state.js';

export interface MissionControlServerOptions {
  state?: MissionControlState;
  tickIntervalMs?: number;
  startTicker?: boolean;
  logger?: boolean;
}

export interface MissionControlServerBundle {
  app: FastifyInstance;
  state: MissionControlState;
}

export interface MissionControlRealtimePayload {
  commandCenter: ReturnType<MissionControlState['getCommandCenterSnapshot']>;
  lineView: ReturnType<MissionControlState['getLineViewSnapshot']>;
  events: ReturnType<MissionControlState['getEvents']>;
}

function toSseFrame(eventName: string, payload: MissionControlRealtimePayload): string {
  return `event: ${eventName}\ndata: ${JSON.stringify(payload)}\n\n`;
}

const COMMAND_TYPES: readonly WmsWcsCommandType[] = [
  'allocate_pick',
  'release_pick',
  'reroute_container',
  'hold_container',
];

const ACTOR_ROLES: readonly MissionControlActorRole[] = ['operator', 'supervisor', 'admin'];

function isCommandType(value: unknown): value is WmsWcsCommandType {
  return typeof value === 'string' && COMMAND_TYPES.includes(value as WmsWcsCommandType);
}

function isActorRole(value: unknown): value is MissionControlActorRole {
  return typeof value === 'string' && ACTOR_ROLES.includes(value as MissionControlActorRole);
}

const SERIALIZED_COMMAND_OPTIONS = JSON.stringify(MISSION_CONTROL_COMMAND_OPTIONS);
const SERIALIZED_ACTOR_ROLE_OPTIONS = JSON.stringify(MISSION_CONTROL_ACTOR_ROLE_OPTIONS);
const SERIALIZED_APPROVAL_ROLE_OPTIONS = JSON.stringify(MISSION_CONTROL_APPROVAL_ROLE_OPTIONS);
const SERIALIZED_INITIAL_POLICY_STATE = JSON.stringify(MISSION_CONTROL_INITIAL_POLICY_STATE);

const INDEX_HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>NeuroLogix Mission Control</title>
    <style>
${MISSION_CONTROL_SHELL_STYLES}
    </style>
  </head>
  <body>
    <a href="#main-content" class="skip-link">Skip to main content</a>
    <div id="app"></div>
    <script type="module">
      import React, { useCallback, useEffect, useState } from 'https://esm.sh/react@18.3.1';
      import { createRoot } from 'https://esm.sh/react-dom@18.3.1/client';

      const e = React.createElement;
      const COMMAND_OPTIONS = ${SERIALIZED_COMMAND_OPTIONS};
      const ACTOR_ROLE_OPTIONS = ${SERIALIZED_ACTOR_ROLE_OPTIONS};
      const APPROVAL_ROLE_OPTIONS = ${SERIALIZED_APPROVAL_ROLE_OPTIONS};
      const INITIAL_POLICY_OUTCOME = ${SERIALIZED_INITIAL_POLICY_STATE};

      function toOptionElements(options) {
        return options.map(option =>
          e('option', { value: option.value, key: option.value || 'none' }, option.label)
        );
      }

      function getPolicyClassName(status) {
        if (status === 'allowed') {
          return 'policy-callout policy-callout--allowed';
        }
        if (status === 'requires-approval') {
          return 'policy-callout policy-callout--requires-approval';
        }
        return 'policy-callout policy-callout--denied';
      }

      function Panel(props) {
        const titleId = props.id + '-title';
        return e('section', { className: 'panel', 'aria-labelledby': titleId }, [
          e('h2', { className: 'panel-title', id: titleId, key: 'title' }, props.title),
          e('pre', { 'aria-label': props.title + ' data', tabIndex: 0, key: 'content' }, props.content),
        ]);
      }

      function App() {
        const [loading, setLoading] = useState(true);
        const [error, setError] = useState(null);
        const [connectionStatus, setConnectionStatus] = useState('connecting');
        const [snapshot, setSnapshot] = useState({
          commandCenter: null,
          lineView: null,
          events: [],
        });
        const [dispatchResult, setDispatchResult] = useState(null);
        const [dispatchForm, setDispatchForm] = useState({
          commandType: 'allocate_pick',
          actorRole: 'operator',
          approvedByRole: '',
          confirmationAccepted: false,
        });
        const [policyOutcome, setPolicyOutcome] = useState(INITIAL_POLICY_OUTCOME);
        const [policyPending, setPolicyPending] = useState(false);

        const loadSnapshot = useCallback(async function loadSnapshot() {
          try {
            const [commandCenterResponse, lineViewResponse, eventsResponse] = await Promise.all([
              fetch('/api/command-center'),
              fetch('/api/line-view?limit=12'),
              fetch('/api/events?limit=12'),
            ]);

            const [commandCenter, lineView, events] = await Promise.all([
              commandCenterResponse.json(),
              lineViewResponse.json(),
              eventsResponse.json(),
            ]);

            setSnapshot({ commandCenter: commandCenter, lineView: lineView, events: events });
            setConnectionStatus('connected');
            setError(null);
          } catch (refreshError) {
            const message = refreshError instanceof Error ? refreshError.message : 'Failed to refresh dashboard state.';
            setError(message);
            setConnectionStatus('reconnecting');
          } finally {
            setLoading(false);
          }
        }, []);

        const requestTick = useCallback(async function requestTick() {
          try {
            await fetch('/api/tick', { method: 'POST' });
          } catch (tickError) {
            const message = tickError instanceof Error ? tickError.message : 'Failed to request realtime tick.';
            setError(message);
          }
        }, []);

        const evaluateControlPolicy = useCallback(async function evaluateControlPolicy(formState, options) {
          const silent = Boolean(options && options.silent);
          const policyQuery = new URLSearchParams({
            commandType: formState.commandType,
            actorRole: formState.actorRole,
            confirmationAccepted: formState.confirmationAccepted ? 'true' : 'false',
          });

          if (formState.approvedByRole) {
            policyQuery.set('approvedByRole', formState.approvedByRole);
          }

          if (!silent) {
            setPolicyPending(true);
          }

          try {
            const response = await fetch('/api/control-policy?' + policyQuery.toString());
            const policy = await response.json();

            if (!response.ok) {
              const deniedPolicy = {
                status: 'denied',
                reason: policy.error || 'Policy evaluation failed.',
                requiredApprovalRole: null,
              };
              if (!silent) {
                setPolicyOutcome(deniedPolicy);
              }
              return deniedPolicy;
            }

            if (!silent) {
              setPolicyOutcome(policy);
            }
            return policy;
          } catch (policyError) {
            const message =
              policyError instanceof Error
                ? policyError.message
                : 'Failed to evaluate control policy.';

            if (!silent) {
              setPolicyOutcome({
                status: 'denied',
                reason: message,
                requiredApprovalRole: null,
              });
            }
            return null;
          } finally {
            if (!silent) {
              setPolicyPending(false);
            }
          }
        }, []);

        useEffect(() => {
          let isActive = true;

          async function refreshPolicyOutcome() {
            const policy = await evaluateControlPolicy(dispatchForm, { silent: false });
            if (!isActive || !policy) {
              return;
            }
            setError(null);
          }

          refreshPolicyOutcome();

          return function cleanupPolicyRefresh() {
            isActive = false;
          };
        }, [
          dispatchForm.commandType,
          dispatchForm.actorRole,
          dispatchForm.approvedByRole,
          dispatchForm.confirmationAccepted,
          evaluateControlPolicy,
        ]);

        function onControlFieldChange(event) {
          const source = event.currentTarget;
          const value = source.type === 'checkbox' ? source.checked : source.value;

          setDispatchForm(currentForm => ({
            ...currentForm,
            [source.name]: value,
          }));
        }

        useEffect(() => {
          const eventSource = new EventSource('/api/stream');

          function onOpen() {
            setConnectionStatus('connected');
          }

          function onSnapshot(event) {
            try {
              const payload = JSON.parse(event.data);
              setSnapshot(payload);
              setConnectionStatus('connected');
              setError(null);
              setLoading(false);
            } catch (parseError) {
              const message = parseError instanceof Error ? parseError.message : 'Failed to parse realtime payload.';
              setError(message);
            }
          }

          function onError() {
            setConnectionStatus('reconnecting');
            setError('Realtime stream disconnected. Reconnecting…');
          }

          eventSource.addEventListener('open', onOpen);
          eventSource.addEventListener('snapshot', onSnapshot);
          eventSource.addEventListener('error', onError);

          loadSnapshot();
          requestTick();

          return function cleanup() {
            eventSource.removeEventListener('open', onOpen);
            eventSource.removeEventListener('snapshot', onSnapshot);
            eventSource.removeEventListener('error', onError);
            eventSource.close();
          };
        }, [loadSnapshot, requestTick]);

        async function submitDispatch(event) {
          event.preventDefault();

          const formData = new FormData(event.currentTarget);
          const commandId = String(formData.get('commandId') || '').trim();
          const targetId = String(formData.get('targetId') || '').trim();
          const commandType = String(dispatchForm.commandType || '').trim();
          const actorRole = String(dispatchForm.actorRole || '').trim();
          const approvedByRole = String(dispatchForm.approvedByRole || '').trim();
          const confirmationAccepted = Boolean(dispatchForm.confirmationAccepted);

          if (!commandId || !commandType || !targetId || !actorRole) {
            setDispatchResult({ error: 'commandId, commandType, targetId, and actorRole are required.' });
            return;
          }

          let policy;
          try {
            policy = await evaluateControlPolicy(
              {
                commandType,
                actorRole,
                approvedByRole,
                confirmationAccepted,
              },
              { silent: true }
            );

            if (!policy) {
              setDispatchResult({
                error: 'Policy evaluation did not complete. Retry dispatch submission.',
              });
              return;
            }

            setPolicyOutcome(policy);
          } catch (policyError) {
            const message = policyError instanceof Error ? policyError.message : 'Failed to evaluate control policy.';
            setError(message);
            return;
          }

          if (policy.status !== 'allowed') {
            setDispatchResult({
              error: policy.reason,
              policy: policy,
            });
            return;
          }

          const payload = {
            command: {
              sourceSystem: 'wms',
              commandId: commandId,
              correlationId: commandId,
              commandType: commandType,
              facilityId: 'fac-1',
              targetId: targetId,
              payload: {
                source: 'mission-control-shell',
              },
              requestedAt: new Date().toISOString(),
            },
            control: {
              actorRole: actorRole,
              confirmationAccepted: confirmationAccepted,
              approvedByRole: approvedByRole || undefined,
            },
          };

          try {
            const response = await fetch('/api/dispatch', {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify(payload),
            });

            const result = await response.json();
            setDispatchResult(result);

            if (response.ok) {
              await requestTick();
            }
          } catch (dispatchError) {
            const message = dispatchError instanceof Error ? dispatchError.message : 'Failed to submit dispatch command.';
            setError(message);
          }
        }

        const commandCenterJson = snapshot.commandCenter
          ? JSON.stringify(snapshot.commandCenter, null, 2)
          : '{}';
        const lineViewJson = snapshot.lineView
          ? JSON.stringify(snapshot.lineView, null, 2)
          : '{}';
        const eventsJson = Array.isArray(snapshot.events)
          ? JSON.stringify(snapshot.events, null, 2)
          : '[]';
        const dispatchJson = dispatchResult
          ? JSON.stringify(dispatchResult, null, 2)
          : '{\\n  "status": "no-dispatch-submitted"\\n}';
        const policyJson = JSON.stringify(policyOutcome, null, 2);
        const updatedAt = snapshot.commandCenter && snapshot.commandCenter.updatedAt
          ? new Date(snapshot.commandCenter.updatedAt).toLocaleString()
          : 'n/a';
        const policyClassName = getPolicyClassName(policyOutcome.status);
        const canSubmitDispatch =
          !loading &&
          !policyPending &&
          policyOutcome.status === 'allowed' &&
          dispatchForm.confirmationAccepted;
        const submitLabel = policyPending ? 'Evaluating Policy…' : 'Submit Dispatch';

        return e('main', { className: 'layout', id: 'main-content', tabIndex: -1 }, [
          e('header', { className: 'header', key: 'header' }, [
            e('div', { key: 'heading' }, [
              e('h1', { className: 'title', key: 'title' }, 'NeuroLogix Mission Control'),
              e('p', { className: 'subtitle', key: 'subtitle' }, 'React operator shell on deterministic line and dispatch APIs'),
            ]),
            e('div', { className: 'toolbar', key: 'toolbar' }, [
              e('span', { className: 'chip', role: 'status', 'aria-live': 'polite', key: 'connection' }, 'Realtime: ' + connectionStatus),
              e('span', { className: 'chip', key: 'updatedAt' }, 'Updated: ' + updatedAt),
              e(
                'button',
                {
                  className: 'btn btn-primary',
                  onClick: requestTick,
                  disabled: loading,
                  key: 'refresh',
                },
                loading ? 'Loading…' : 'Refresh'
              ),
            ]),
          ]),
          e('p', { className: 'sr-only', role: 'status', 'aria-live': 'polite', key: 'live-status' }, 'Realtime status ' + connectionStatus + '. Last update ' + updatedAt + '.'),
          error
            ? e('section', { className: 'error', role: 'alert', 'aria-live': 'assertive', key: 'error' }, error)
            : null,
          e('div', { className: 'grid', key: 'grid' }, [
            e(Panel, { id: 'command-center', key: 'cc', title: 'Command Center', content: commandCenterJson }),
            e(Panel, { id: 'line-view', key: 'lv', title: 'Line View', content: lineViewJson }),
          ]),
          e('section', { className: 'panel', key: 'dispatch-form-panel' }, [
            e('h2', { className: 'panel-title', key: 'dispatch-title' }, 'Dispatch Command'),
            e(
              'section',
              {
                className: policyClassName,
                role: 'status',
                'aria-live': 'polite',
                key: 'policy-readiness',
              },
              [
                e('strong', { key: 'title' }, 'Control Readiness: ' + policyOutcome.status),
                e('p', { key: 'reason' }, policyPending ? 'Evaluating policy outcome…' : policyOutcome.reason),
              ]
            ),
            e('form', { className: 'dispatch-form', onSubmit: submitDispatch, key: 'dispatch-form' }, [
              e('div', { className: 'field', key: 'commandIdField' }, [
                e('label', { htmlFor: 'commandId', key: 'label' }, 'Command ID'),
                e('input', {
                  id: 'commandId',
                  name: 'commandId',
                  defaultValue: 'cmd-ui-' + Date.now(),
                  required: true,
                  key: 'input',
                }),
              ]),
              e('div', { className: 'field', key: 'commandTypeField' }, [
                e('label', { htmlFor: 'commandType', key: 'label' }, 'Command Type'),
                e('select', {
                  id: 'commandType',
                  name: 'commandType',
                  value: dispatchForm.commandType,
                  onChange: onControlFieldChange,
                  key: 'select',
                }, toOptionElements(COMMAND_OPTIONS)),
              ]),
              e('div', { className: 'field', key: 'targetIdField' }, [
                e('label', { htmlFor: 'targetId', key: 'label' }, 'Target ID'),
                e('input', {
                  id: 'targetId',
                  name: 'targetId',
                  defaultValue: 'line-a',
                  required: true,
                  key: 'input',
                }),
              ]),
              e('div', { className: 'field', key: 'actorRoleField' }, [
                e('label', { htmlFor: 'actorRole', key: 'label' }, 'Actor Role'),
                e('select', {
                  id: 'actorRole',
                  name: 'actorRole',
                  value: dispatchForm.actorRole,
                  onChange: onControlFieldChange,
                  key: 'select',
                }, toOptionElements(ACTOR_ROLE_OPTIONS)),
              ]),
              e('div', { className: 'field', key: 'approvedByRoleField' }, [
                e('label', { htmlFor: 'approvedByRole', key: 'label' }, 'Approved By (optional)'),
                e('select', {
                  id: 'approvedByRole',
                  name: 'approvedByRole',
                  value: dispatchForm.approvedByRole,
                  onChange: onControlFieldChange,
                  key: 'select',
                }, toOptionElements(APPROVAL_ROLE_OPTIONS)),
              ]),
              e('div', { className: 'field', key: 'confirmationField' }, [
                e('label', { htmlFor: 'confirmationAccepted', key: 'label' }, 'Confirmation'),
                e('label', { className: 'confirmation-label', htmlFor: 'confirmationAccepted', key: 'label-value' }, [
                  e('input', {
                    id: 'confirmationAccepted',
                    name: 'confirmationAccepted',
                    type: 'checkbox',
                    checked: dispatchForm.confirmationAccepted,
                    onChange: onControlFieldChange,
                    required: true,
                    key: 'input',
                  }),
                  e('span', { key: 'text' }, 'I confirm this dispatch action and role context.'),
                ]),
                e(
                  'p',
                  { className: 'confirmation-note', key: 'note' },
                  'Dispatch remains disabled until confirmation and policy approval are satisfied.'
                ),
              ]),
              e('div', { className: 'dispatch-actions', key: 'submit' }, [
                e(
                  'button',
                  {
                    className: 'btn btn-primary',
                    type: 'submit',
                    disabled: !canSubmitDispatch,
                    'aria-disabled': !canSubmitDispatch,
                    key: 'button',
                  },
                  submitLabel
                ),
              ]),
            ]),
          ]),
          e('div', { className: 'grid', key: 'result-grid' }, [
            e(Panel, { id: 'event-timeline', key: 'events', title: 'Event Timeline', content: eventsJson }),
            e(Panel, { id: 'policy-outcome', key: 'policy-outcome', title: 'Policy Outcome', content: policyJson }),
            e(Panel, { id: 'dispatch-result', key: 'dispatch-result', title: 'Dispatch Result', content: dispatchJson }),
          ]),
        ]);
      }

      createRoot(document.getElementById('app')).render(e(App));
    </script>
  </body>
</html>`;

export function buildMissionControlServer(
  options: MissionControlServerOptions = {}
): MissionControlServerBundle {
  const app = Fastify({ logger: options.logger ?? false });
  const state = options.state ?? new MissionControlState();
  const siteRegistry = new SiteRegistryService();
  const tickIntervalMs = options.tickIntervalMs ?? 1000;
  const startTicker = options.startTicker ?? true;
  const subscribers = new Set<ServerResponse>();

  const getRealtimePayload = (): MissionControlRealtimePayload => ({
    commandCenter: state.getCommandCenterSnapshot(),
    lineView: state.getLineViewSnapshot(12),
    events: state.getEvents(12),
  });

  const publishSnapshot = (): void => {
    const frame = toSseFrame('snapshot', getRealtimePayload());
    subscribers.forEach(subscriber => {
      subscriber.write(frame);
    });
  };

  let ticker: NodeJS.Timeout | undefined;
  let heartbeat: NodeJS.Timeout | undefined;
  if (startTicker) {
    ticker = setInterval(() => {
      state.tick();
      publishSnapshot();
    }, tickIntervalMs);
  }

  heartbeat = setInterval(() => {
    subscribers.forEach(subscriber => {
      subscriber.write(': heartbeat\n\n');
    });
  }, 15000);

  app.addHook('onClose', async () => {
    if (ticker) {
      clearInterval(ticker);
      ticker = undefined;
    }
    if (heartbeat) {
      clearInterval(heartbeat);
      heartbeat = undefined;
    }
    subscribers.forEach(subscriber => {
      subscriber.end();
    });
    subscribers.clear();
  });

  app.get('/health', async () => ({
    status: 'ok',
    service: 'mission-control',
  }));

  app.get('/', async (_, reply) => {
    reply.type('text/html');
    return INDEX_HTML;
  });

  app.get('/api/command-center', async () => state.getCommandCenterSnapshot());

  app.get('/api/line-view', async request => {
    const limitQuery = (request.query as { limit?: string }).limit;
    const limit = limitQuery ? Number.parseInt(limitQuery, 10) : 20;
    return state.getLineViewSnapshot(Number.isNaN(limit) ? 20 : limit);
  });

  app.get('/api/events', async request => {
    const limitQuery = (request.query as { limit?: string }).limit;
    const limit = limitQuery ? Number.parseInt(limitQuery, 10) : 50;
    return state.getEvents(Number.isNaN(limit) ? 50 : limit);
  });

  app.get('/api/control-policy', async (request, reply) => {
    const query = request.query as {
      commandType?: string;
      actorRole?: string;
      approvedByRole?: string;
      confirmationAccepted?: string;
    };

    if (!isCommandType(query.commandType)) {
      reply.status(400);
      return {
        error: 'commandType is required and must be a known dispatch command type.',
      };
    }

    if (!isActorRole(query.actorRole)) {
      reply.status(400);
      return {
        error: 'actorRole is required and must be operator, supervisor, or admin.',
      };
    }

    const approvedByRole = isActorRole(query.approvedByRole) ? query.approvedByRole : undefined;
    const confirmationAccepted = query.confirmationAccepted === 'true';

    return state.getDispatchPolicy({
      commandType: query.commandType,
      actorRole: query.actorRole,
      approvedByRole,
      confirmationAccepted,
    });
  });

  app.get('/api/stream', async (request, reply) => {
    const onceQuery = (request.query as { once?: string }).once;
    const streamHeaders = {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-cache, no-transform',
      connection: 'keep-alive',
      'x-accel-buffering': 'no',
    } as const;

    if (onceQuery === 'true') {
      reply.raw.writeHead(200, streamHeaders);
      reply.hijack();
      reply.raw.write(toSseFrame('snapshot', getRealtimePayload()));
      reply.raw.end();
      return;
    }

    reply.raw.writeHead(200, streamHeaders);
    reply.hijack();
    reply.raw.write(': connected\n\n');
    reply.raw.write(toSseFrame('snapshot', getRealtimePayload()));
    subscribers.add(reply.raw);

    reply.raw.on('close', () => {
      subscribers.delete(reply.raw);
    });
  });

  app.post('/api/tick', async () => {
    const frame = state.tick();
    publishSnapshot();
    return frame;
  });

  app.post('/api/dispatch', async (request, reply) => {
    try {
      const result = await state.dispatchCommand(request.body);
      publishSnapshot();
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Dispatch request failed';
      reply.status(400);
      return {
        error: message,
      };
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Federation API Routes (FEDERATION-API-001 / ISSUE-37, wired by ISSUE-74)
  // ─────────────────────────────────────────────────────────────────────────

  app.get('/api/sites', async (request, reply) => {
    try {
      const query = request.query as { status?: string; region?: string; tier?: string };
      const result = await siteRegistry.listSites({
        status: query.status as Parameters<SiteRegistryService['listSites']>[0] extends { status?: infer S } ? S : undefined,
        region: query.region,
        tier: query.tier as Parameters<SiteRegistryService['listSites']>[0] extends { tier?: infer T } ? T : undefined,
      });
      return {
        sites: result.sites,
        total: result.total,
        version: siteRegistry.getTopologyVersion(),
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to list sites';
      reply.status(500);
      return { code: 'INTERNAL_ERROR', message, traceId: request.id };
    }
  });

  app.post('/api/sites', async (request, reply) => {
    try {
      const site = await siteRegistry.createSite(request.body as Parameters<SiteRegistryService['createSite']>[0]);
      reply.status(201);
      return site;
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        const siteError = error as { code: string; message: string };
        if (siteError.code === SITE_REGISTRY_ERROR_CODES.DUPLICATE_SLUG) {
          reply.status(409);
          return { code: siteError.code, message: siteError.message, traceId: request.id };
        }
        if (siteError.code === SITE_REGISTRY_ERROR_CODES.VALIDATION_ERROR) {
          reply.status(400);
          return { code: siteError.code, message: siteError.message, traceId: request.id };
        }
      }
      const message = error instanceof Error ? error.message : 'Failed to register site';
      reply.status(500);
      return { code: 'INTERNAL_ERROR', message, traceId: request.id };
    }
  });

  app.get('/api/sites/:siteId', async (request, reply) => {
    try {
      const { siteId } = request.params as { siteId: string };
      const site = await siteRegistry.getSite(siteId);
      if (!site) {
        reply.status(404);
        return { code: 'SITE_NOT_FOUND', message: `Site '${siteId}' not found`, traceId: request.id };
      }
      return site;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get site';
      reply.status(500);
      return { code: 'INTERNAL_ERROR', message, traceId: request.id };
    }
  });

  app.patch('/api/sites/:siteId/status', async (request, reply) => {
    try {
      const { siteId } = request.params as { siteId: string };
      const updated = await siteRegistry.updateSiteStatus(
        siteId,
        request.body as Parameters<SiteRegistryService['updateSiteStatus']>[1],
      );
      return updated;
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        const siteError = error as { code: string; message: string };
        if (siteError.code === SITE_REGISTRY_ERROR_CODES.SITE_NOT_FOUND) {
          reply.status(404);
          return { code: siteError.code, message: siteError.message, traceId: request.id };
        }
        if (siteError.code === SITE_REGISTRY_ERROR_CODES.INVALID_TRANSITION) {
          reply.status(422);
          return { code: siteError.code, message: siteError.message, traceId: request.id };
        }
      }
      const message = error instanceof Error ? error.message : 'Failed to update site status';
      reply.status(500);
      return { code: 'INTERNAL_ERROR', message, traceId: request.id };
    }
  });

  app.get('/api/feature-flags', async (request, reply) => {
    try {
      const query = request.query as { siteId?: string };
      if (query.siteId) {
        const flags = await siteRegistry.resolveFeatureFlags(query.siteId);
        return { flags, resolvedFor: { siteId: query.siteId } };
      }
      const flags = await siteRegistry.listFeatureFlags();
      return { flags };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to list feature flags';
      reply.status(500);
      return { code: 'INTERNAL_ERROR', message, traceId: request.id };
    }
  });

  app.get('/api/federation', async (request, reply) => {
    try {
      const topology = await siteRegistry.getFederationTopology();
      return topology;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get federation topology';
      reply.status(500);
      return { code: 'INTERNAL_ERROR', message, traceId: request.id };
    }
  });

  // SITE-005: Replace operational configuration for a site
  app.put('/api/sites/:siteId/config', async (request, reply) => {
    try {
      const { siteId } = request.params as { siteId: string };
      const updated = await siteRegistry.updateSiteConfig(
        siteId,
        request.body as Parameters<SiteRegistryService['updateSiteConfig']>[1],
      );
      return updated;
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        const siteError = error as { code: string; message: string };
        if (siteError.code === SITE_REGISTRY_ERROR_CODES.SITE_NOT_FOUND) {
          reply.status(404);
          return { code: siteError.code, message: siteError.message, traceId: request.id };
        }
        if (siteError.code === SITE_REGISTRY_ERROR_CODES.VALIDATION_ERROR) {
          reply.status(400);
          return { code: siteError.code, message: siteError.message, traceId: request.id };
        }
      }
      const message = error instanceof Error ? error.message : 'Failed to update site config';
      reply.status(500);
      return { code: 'INTERNAL_ERROR', message, traceId: request.id };
    }
  });

  // FF-002: Create or update a feature flag definition
  app.put('/api/feature-flags/:key', async (request, reply) => {
    try {
      const flag = await siteRegistry.upsertFeatureFlag(
        request.body as Parameters<SiteRegistryService['upsertFeatureFlag']>[0],
      );
      return flag;
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        const siteError = error as { code: string; message: string };
        if (siteError.code === SITE_REGISTRY_ERROR_CODES.VALIDATION_ERROR) {
          reply.status(400);
          return { code: siteError.code, message: siteError.message, traceId: request.id };
        }
      }
      const message = error instanceof Error ? error.message : 'Failed to upsert feature flag';
      reply.status(500);
      return { code: 'INTERNAL_ERROR', message, traceId: request.id };
    }
  });

  // FF-003: Override feature flags at site level
  app.patch('/api/sites/:siteId/feature-flags', async (request, reply) => {
    try {
      const { siteId } = request.params as { siteId: string };
      const updated = await siteRegistry.setFeatureFlagOverrides(
        siteId,
        request.body as Parameters<SiteRegistryService['setFeatureFlagOverrides']>[1],
      );
      return { siteId: updated.id, featureFlags: updated.featureFlags ?? {} };
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        const siteError = error as { code: string; message: string };
        if (siteError.code === SITE_REGISTRY_ERROR_CODES.SITE_NOT_FOUND) {
          reply.status(404);
          return { code: siteError.code, message: siteError.message, traceId: request.id };
        }
        if (siteError.code === SITE_REGISTRY_ERROR_CODES.VALIDATION_ERROR) {
          reply.status(400);
          return { code: siteError.code, message: siteError.message, traceId: request.id };
        }
      }
      const message = error instanceof Error ? error.message : 'Failed to update feature flag overrides';
      reply.status(500);
      return { code: 'INTERNAL_ERROR', message, traceId: request.id };
    }
  });

  return { app, state };
}
