/**
 * ConnectRPC development server
 *
 * Run with:  npm run server:dev
 *
 * Serves all gRPC/Connect services on http://localhost:4001
 * and static assets at /assets/* (system images, etc.)
 */

import * as http from 'node:http';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { connectNodeAdapter } from '@connectrpc/connect-node';
import { cors as connectCors } from '@connectrpc/connect';
import type { ConnectRouter } from '@connectrpc/connect';
import corsMiddleware from 'cors';

import { SystemDiscoveryService } from '../src/gen/rotv/v1/system_discovery_pb.js';
import { PreflightService }        from '../src/gen/rotv/v1/preflight_pb.js';
import { TelemetryService }        from '../src/gen/rotv/v1/telemetry_pb.js';
import { CalibrationService }      from '../src/gen/rotv/v1/calibration_pb.js';
import { DiagnosticsService }      from '../src/gen/rotv/v1/diagnostics_pb.js';
import { LogService }              from '../src/gen/rotv/v1/logs_pb.js';
import { DataQualityService }      from '../src/gen/rotv/v1/data_quality_pb.js';
import { SettingsService }         from '../src/gen/rotv/v1/settings_pb.js';

import { systemDiscoveryHandler } from './handlers/systemDiscovery.js';
import { preflightHandler }       from './handlers/preflight.js';
import { telemetryHandler }       from './handlers/telemetry.js';
import { calibrationHandler }     from './handlers/calibration.js';
import { diagnosticsHandler }     from './handlers/diagnostics.js';
import { logHandler }             from './handlers/logs.js';
import { dataQualityHandler }     from './handlers/dataQuality.js';
import { settingsHandler }        from './handlers/settings.js';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const PORT = 4001;
const ALLOWED_ORIGIN = 'http://localhost:5174';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ASSETS_DIR = path.resolve(__dirname, '../src/assets');

const MIME: Record<string, string> = {
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg':  'image/svg+xml',
  '.webp': 'image/webp',
};

// ---------------------------------------------------------------------------
// Connect router
// ---------------------------------------------------------------------------

function routes(router: ConnectRouter) {
  router.service(SystemDiscoveryService, systemDiscoveryHandler);
  router.service(PreflightService,       preflightHandler);
  router.service(TelemetryService,       telemetryHandler);
  router.service(CalibrationService,     calibrationHandler);
  router.service(DiagnosticsService,     diagnosticsHandler);
  router.service(LogService,             logHandler);
  router.service(DataQualityService,     dataQualityHandler);
  router.service(SettingsService,        settingsHandler);
}

const connectHandler = connectNodeAdapter({ routes });

// CORS middleware configured with Connect-protocol header lists
const applyCors = corsMiddleware({
  origin: ALLOWED_ORIGIN,
  methods: [...connectCors.allowedMethods],
  allowedHeaders: [...connectCors.allowedHeaders],
  exposedHeaders: [...connectCors.exposedHeaders],
  credentials: true,
});

// ---------------------------------------------------------------------------
// HTTP server — CORS + static /assets/* + Connect RPC
// ---------------------------------------------------------------------------

const server = http.createServer((req, res) => {
  applyCors(req, res, () => {
    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const url = req.url ?? '/';

    // Serve static assets
    if (url.startsWith('/assets/')) {
      const filePath = path.join(ASSETS_DIR, url.slice('/assets/'.length));
      const ext = path.extname(filePath).toLowerCase();
      const mime = MIME[ext] ?? 'application/octet-stream';

      fs.readFile(filePath, (err, data) => {
        if (err) {
          res.writeHead(404);
          res.end('Not found');
          return;
        }
        res.writeHead(200, { 'Content-Type': mime });
        res.end(data);
      });
      return;
    }

    // All other requests → ConnectRPC
    connectHandler(req, res);
  });
});

server.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`[server] Port ${PORT} is already in use.`);
    console.error(`[server] If publisher.js is running, stop it first (Ctrl+C in that terminal).`);
    console.error(`[server] Or kill the process: netstat -ano | findstr :${PORT}`);
    process.exit(1);
  }
  throw err;
});

server.listen(PORT, () => {
  console.log(`[server] ConnectRPC server listening on http://localhost:${PORT}`);
  console.log(`[server] Static assets served from ${ASSETS_DIR}`);
});
