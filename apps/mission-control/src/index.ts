import { buildMissionControlServer } from './server.js';

async function startServer(): Promise<void> {
  const port = Number.parseInt(process.env.PORT ?? '3000', 10);
  const host = process.env.HOST ?? '0.0.0.0';

  const { app } = buildMissionControlServer({
    logger: true,
    startTicker: true,
    tickIntervalMs: 1000,
  });

  await app.listen({ port, host });
}

startServer().catch(error => {
  process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}\n`);
  process.exit(1);
});
