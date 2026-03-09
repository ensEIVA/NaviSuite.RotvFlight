import { createClient } from '@connectrpc/connect';
import { transport } from './transport';
import { SystemDiscoveryService } from '../gen/rotv/v1/system_discovery_pb';
import { PreflightService } from '../gen/rotv/v1/preflight_pb';
import { TelemetryService } from '../gen/rotv/v1/telemetry_pb';
import { CalibrationService } from '../gen/rotv/v1/calibration_pb';
import { DiagnosticsService } from '../gen/rotv/v1/diagnostics_pb';
import { LogService } from '../gen/rotv/v1/logs_pb';
import { DataQualityService } from '../gen/rotv/v1/data_quality_pb';
import { SettingsService } from '../gen/rotv/v1/settings_pb';
import { AutonomyService } from '../gen/autonomy/v1/autonomy_service_pb';

function requireTransport() {
  if (!transport) throw new Error('ConnectRPC transport not initialised (VITE_USE_GRPC=false)');
  return transport;
}

export const getSystemDiscoveryClient = () =>
  createClient(SystemDiscoveryService, requireTransport());

export const getPreflightClient = () =>
  createClient(PreflightService, requireTransport());

export const getTelemetryClient = () =>
  createClient(TelemetryService, requireTransport());

export const getCalibrationClient = () =>
  createClient(CalibrationService, requireTransport());

export const getDiagnosticsClient = () =>
  createClient(DiagnosticsService, requireTransport());

export const getLogClient = () =>
  createClient(LogService, requireTransport());

export const getDataQualityClient = () =>
  createClient(DataQualityService, requireTransport());

export const getSettingsClient = () =>
  createClient(SettingsService, requireTransport());

export const getAutonomyClient = () =>
  createClient(AutonomyService, requireTransport());
