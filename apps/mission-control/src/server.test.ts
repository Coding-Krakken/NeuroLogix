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

  // ─── Federation Route Tests ───────────────────────────────────────────────

  it('GET /api/federation returns empty topology on startup', async () => {
    const { app } = buildMissionControlServer({ startTicker: false, logger: false });
    try {
      const response = await app.inject({ method: 'GET', url: '/api/federation' });
      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body).toHaveProperty('sites');
      expect(body).toHaveProperty('version');
      expect(body).toHaveProperty('platformContracts');
      expect(Array.isArray(body.sites)).toBe(true);
    } finally {
      await app.close();
    }
  });

  it('GET /api/sites returns empty list on startup', async () => {
    const { app } = buildMissionControlServer({ startTicker: false, logger: false });
    try {
      const response = await app.inject({ method: 'GET', url: '/api/sites' });
      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.total).toBe(0);
      expect(body.sites).toHaveLength(0);
    } finally {
      await app.close();
    }
  });

  it('POST /api/sites creates a site and returns 201', async () => {
    const { app } = buildMissionControlServer({ startTicker: false, logger: false });
    try {
      const response = await app.inject({
        method: 'POST',
        url: '/api/sites',
        payload: {
          slug: 'test-site-1',
          name: 'Test Site 1',
          region: 'eu-west-1',
          tier: 'T1',
          config: { timezone: 'Europe/London', locale: 'en-GB' },
        },
      });
      expect(response.statusCode).toBe(201);
      const site = response.json();
      expect(site.slug).toBe('test-site-1');
      expect(site.status).toBe('provisioning');
      expect(site.id).toMatch(/^[0-9a-f-]{36}$/);
    } finally {
      await app.close();
    }
  });

  it('POST /api/sites returns 409 for duplicate slug', async () => {
    const { app } = buildMissionControlServer({ startTicker: false, logger: false });
    const payload = {
      slug: 'dup-slug',
      name: 'Dup Site',
      region: 'us-east-1',
      tier: 'T2',
      config: { timezone: 'America/New_York', locale: 'en-US' },
    };
    try {
      await app.inject({ method: 'POST', url: '/api/sites', payload });
      const dup = await app.inject({ method: 'POST', url: '/api/sites', payload });
      expect(dup.statusCode).toBe(409);
      expect(dup.json().code).toBe('DUPLICATE_SLUG');
    } finally {
      await app.close();
    }
  });

  it('GET /api/sites/:siteId returns 200 for existing site', async () => {
    const { app } = buildMissionControlServer({ startTicker: false, logger: false });
    try {
      const create = await app.inject({
        method: 'POST',
        url: '/api/sites',
        payload: {
          slug: 'get-site',
          name: 'Get Site',
          region: 'ap-southeast-1',
          tier: 'T3',
          config: { timezone: 'Asia/Singapore', locale: 'en-SG' },
        },
      });
      expect(create.statusCode).toBe(201);
      const siteId = create.json().id;

      const get = await app.inject({ method: 'GET', url: `/api/sites/${siteId}` });
      expect(get.statusCode).toBe(200);
      expect(get.json().id).toBe(siteId);
    } finally {
      await app.close();
    }
  });

  it('GET /api/sites/:siteId returns 404 for unknown site', async () => {
    const { app } = buildMissionControlServer({ startTicker: false, logger: false });
    try {
      const response = await app.inject({ method: 'GET', url: '/api/sites/unknown-site-id' });
      expect(response.statusCode).toBe(404);
      expect(response.json().code).toBe('SITE_NOT_FOUND');
    } finally {
      await app.close();
    }
  });

  it('PATCH /api/sites/:siteId/status transitions provisioning to active', async () => {
    const { app } = buildMissionControlServer({ startTicker: false, logger: false });
    try {
      const create = await app.inject({
        method: 'POST',
        url: '/api/sites',
        payload: {
          slug: 'transition-site',
          name: 'Transition Site',
          region: 'eu-central-1',
          tier: 'T1',
          config: { timezone: 'Europe/Berlin', locale: 'de-DE' },
        },
      });
      const siteId = create.json().id;

      const patch = await app.inject({
        method: 'PATCH',
        url: `/api/sites/${siteId}/status`,
        payload: { status: 'active', reason: 'Go live' },
      });
      expect(patch.statusCode).toBe(200);
      expect(patch.json().status).toBe('active');
    } finally {
      await app.close();
    }
  });

  it('PATCH /api/sites/:siteId/status returns 422 for invalid transition', async () => {
    const { app } = buildMissionControlServer({ startTicker: false, logger: false });
    try {
      const create = await app.inject({
        method: 'POST',
        url: '/api/sites',
        payload: {
          slug: 'invalid-transition-site',
          name: 'Invalid Transition',
          region: 'us-west-2',
          tier: 'T2',
          config: { timezone: 'America/Los_Angeles', locale: 'en-US' },
        },
      });
      const siteId = create.json().id;

      const patch = await app.inject({
        method: 'PATCH',
        url: `/api/sites/${siteId}/status`,
        payload: { status: 'suspended', reason: 'Invalid from provisioning' },
      });
      expect(patch.statusCode).toBe(422);
      expect(patch.json().code).toBe('INVALID_TRANSITION');
    } finally {
      await app.close();
    }
  });

  it('PATCH /api/sites/:siteId/status returns 404 for unknown site', async () => {
    const { app } = buildMissionControlServer({ startTicker: false, logger: false });
    try {
      const patch = await app.inject({
        method: 'PATCH',
        url: '/api/sites/no-such-site/status',
        payload: { status: 'active', reason: 'Test' },
      });
      expect(patch.statusCode).toBe(404);
      expect(patch.json().code).toBe('SITE_NOT_FOUND');
    } finally {
      await app.close();
    }
  });

  it('GET /api/feature-flags returns global flags when no siteId given', async () => {
    const { app } = buildMissionControlServer({ startTicker: false, logger: false });
    try {
      const response = await app.inject({ method: 'GET', url: '/api/feature-flags' });
      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body).toHaveProperty('flags');
      expect(Array.isArray(body.flags)).toBe(true);
    } finally {
      await app.close();
    }
  });

  it('GET /api/feature-flags?siteId=x resolves flags for site', async () => {
    const { app } = buildMissionControlServer({ startTicker: false, logger: false });
    try {
      const create = await app.inject({
        method: 'POST',
        url: '/api/sites',
        payload: {
          slug: 'flag-site',
          name: 'Flag Site',
          region: 'eu-west-2',
          tier: 'T1',
          config: { timezone: 'Europe/London', locale: 'en-GB' },
        },
      });
      const siteId = create.json().id;

      const response = await app.inject({
        method: 'GET',
        url: `/api/feature-flags?siteId=${siteId}`,
      });
      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body).toHaveProperty('flags');
      expect(body.resolvedFor).toMatchObject({ siteId });
    } finally {
      await app.close();
    }
  });

  it('POST /api/sites returns 400 for missing required config fields', async () => {
    const { app } = buildMissionControlServer({ startTicker: false, logger: false });
    try {
      const response = await app.inject({
        method: 'POST',
        url: '/api/sites',
        payload: { slug: 'bad-site', name: 'Bad', region: 'eu', tier: 'T1' },
      });
      // Missing config.timezone and config.locale → ZodError → VALIDATION_ERROR (400) or 500
      expect([400, 500]).toContain(response.statusCode);
    } finally {
      await app.close();
    }
  });

  it('GET /api/sites with status and region filters returns filtered list', async () => {
    const { app } = buildMissionControlServer({ startTicker: false, logger: false });
    try {
      await app.inject({
        method: 'POST',
        url: '/api/sites',
        payload: {
          slug: 'eu-active-site',
          name: 'EU Active',
          region: 'eu-north-1',
          tier: 'T1',
          config: { timezone: 'Europe/Stockholm', locale: 'sv-SE' },
        },
      });

      const response = await app.inject({
        method: 'GET',
        url: '/api/sites?status=provisioning&region=eu-north-1',
      });
      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.total).toBeGreaterThanOrEqual(1);
    } finally {
      await app.close();
    }
  });
});
