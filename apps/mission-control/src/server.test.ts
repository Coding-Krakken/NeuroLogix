import { describe, expect, it } from 'vitest';
import { buildMissionControlServer } from './server.js';

describe('mission-control server', () => {
  it('serves a React shell for the root route', async () => {
    const { app } = buildMissionControlServer({
      startTicker: false,
      logger: false,
    });

    try {
      const response = await app.inject({
        method: 'GET',
        url: '/',
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toContain('text/html');
      expect(response.body).toContain('<div id="app"></div>');
      expect(response.body).toContain("from 'https://esm.sh/react@18.3.1'");
      expect(response.body).toContain('Skip to main content');
      expect(response.body).toContain("id: 'main-content'");
      expect(response.body).toContain("role: 'alert'");
      expect(response.body).toContain("'aria-live': 'polite'");
      expect(response.body).toContain('.btn:focus-visible');
      expect(response.body).toContain('Actor Role');
      expect(response.body).toContain('Control Readiness');
      expect(response.body).toContain('policy-callout--requires-approval');
      expect(response.body).toContain('Policy Outcome');
      expect(response.body).toContain('I confirm this dispatch action and role context.');
      expect(response.body).toContain('confirmationAccepted');
    } finally {
      await app.close();
    }
  });

  it('returns health state', async () => {
    const { app } = buildMissionControlServer({
      startTicker: false,
      logger: false,
    });

    try {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({
        status: 'ok',
        service: 'mission-control',
      });
    } finally {
      await app.close();
    }
  });

  it('provides command-center and line-view snapshots', async () => {
    const { app } = buildMissionControlServer({
      startTicker: false,
      logger: false,
    });

    try {
      const commandCenterResponse = await app.inject({
        method: 'GET',
        url: '/api/command-center',
      });
      const lineViewResponse = await app.inject({
        method: 'GET',
        url: '/api/line-view?limit=5',
      });

      expect(commandCenterResponse.statusCode).toBe(200);
      expect(lineViewResponse.statusCode).toBe(200);

      const commandCenter = commandCenterResponse.json();
      const lineView = lineViewResponse.json();

      expect(commandCenter).toHaveProperty('lineId', 'line-a');
      expect(commandCenter).toHaveProperty('scenarioId', 'demo-line-canonical-v1');
      expect(lineView.recentFrames).toHaveLength(5);
      expect(lineView.latestFrame).toHaveProperty('lineId', 'line-a');
    } finally {
      await app.close();
    }
  });

  it('serves one-shot SSE realtime payloads', async () => {
    const { app } = buildMissionControlServer({
      startTicker: false,
      logger: false,
    });

    try {
      const response = await app.inject({
        method: 'GET',
        url: '/api/stream?once=true',
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toContain('text/event-stream');
      expect(response.body).toContain('event: snapshot');
      expect(response.body).toContain('data: ');
      expect(response.body).toContain('"commandCenter"');
      expect(response.body).toContain('"lineView"');
      expect(response.body).toContain('"events"');
    } finally {
      await app.close();
    }
  });

  it('handles dispatch idempotency for duplicate commands', async () => {
    const { app } = buildMissionControlServer({
      startTicker: false,
      logger: false,
    });

    const command = {
      sourceSystem: 'wms',
      commandId: 'cmd-1001',
      correlationId: 'corr-1001',
      commandType: 'allocate_pick',
      facilityId: 'fac-1',
      targetId: 'line-a',
      payload: {
        sku: 'SKU-1',
      },
      requestedAt: '2026-03-10T16:00:00.000Z',
    };

    try {
      const firstDispatchResponse = await app.inject({
        method: 'POST',
        url: '/api/dispatch',
        payload: command,
      });
      const duplicateDispatchResponse = await app.inject({
        method: 'POST',
        url: '/api/dispatch',
        payload: command,
      });
      const commandCenterResponse = await app.inject({
        method: 'GET',
        url: '/api/command-center',
      });

      expect(firstDispatchResponse.statusCode).toBe(200);
      expect(duplicateDispatchResponse.statusCode).toBe(200);

      const first = firstDispatchResponse.json();
      const duplicate = duplicateDispatchResponse.json();

      expect(first.status).toBe('dispatched');
      expect(duplicate.status).toBe('duplicate');

      const commandCenter = commandCenterResponse.json();
      expect(commandCenter.dispatch).toMatchObject({
        dispatched: 1,
        duplicate: 1,
      });
    } finally {
      await app.close();
    }
  });

  it('returns deterministic control-policy decisions', async () => {
    const { app } = buildMissionControlServer({
      startTicker: false,
      logger: false,
    });

    try {
      const allowResponse = await app.inject({
        method: 'GET',
        url: '/api/control-policy?commandType=allocate_pick&actorRole=operator&confirmationAccepted=true',
      });
      const needsApprovalResponse = await app.inject({
        method: 'GET',
        url: '/api/control-policy?commandType=reroute_container&actorRole=operator&confirmationAccepted=true',
      });

      expect(allowResponse.statusCode).toBe(200);
      expect(needsApprovalResponse.statusCode).toBe(200);

      expect(allowResponse.json()).toMatchObject({
        status: 'allowed',
        requiredApprovalRole: null,
      });
      expect(needsApprovalResponse.json()).toMatchObject({
        status: 'requires-approval',
        requiredApprovalRole: 'supervisor',
      });
    } finally {
      await app.close();
    }
  });

  it('blocks controlled dispatch when confirmation is missing', async () => {
    const { app } = buildMissionControlServer({
      startTicker: false,
      logger: false,
    });

    try {
      const response = await app.inject({
        method: 'POST',
        url: '/api/dispatch',
        payload: {
          command: {
            sourceSystem: 'wms',
            commandId: 'cmd-2001',
            correlationId: 'corr-2001',
            commandType: 'allocate_pick',
            facilityId: 'fac-1',
            targetId: 'line-a',
            payload: {
              sku: 'SKU-2',
            },
            requestedAt: '2026-03-10T17:00:00.000Z',
          },
          control: {
            actorRole: 'operator',
            confirmationAccepted: false,
          },
        },
      });

      expect(response.statusCode).toBe(400);
      expect(response.json()).toMatchObject({
        error: 'Dispatch confirmation is required before command submission.',
      });
    } finally {
      await app.close();
    }
  });

  it('allows controlled dispatch with required secondary approval', async () => {
    const { app } = buildMissionControlServer({
      startTicker: false,
      logger: false,
    });

    try {
      const response = await app.inject({
        method: 'POST',
        url: '/api/dispatch',
        payload: {
          command: {
            sourceSystem: 'wms',
            commandId: 'cmd-3001',
            correlationId: 'corr-3001',
            commandType: 'reroute_container',
            facilityId: 'fac-1',
            targetId: 'line-a',
            payload: {
              destination: 'line-b',
            },
            requestedAt: '2026-03-10T17:10:00.000Z',
          },
          control: {
            actorRole: 'operator',
            approvedByRole: 'supervisor',
            confirmationAccepted: true,
          },
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toMatchObject({
        status: 'dispatched',
      });
    } finally {
      await app.close();
    }
  });
});
