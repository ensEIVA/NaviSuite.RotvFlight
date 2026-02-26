/* ==========================================================================
   ROTV Flight — Shared Domain Type Definitions
   ========================================================================== */

// --------------------------------------------------------------------------
// Systems
// --------------------------------------------------------------------------

export interface SystemEntry {
  id: string;
  name: string;
  type: string;
  ip: string;
  firmware: string;
  signal: number; // dBm, e.g. -62
  /** Pre-flight check manifest advertised by the system on discovery */
  checks: PreFlightCheck[];
}

// --------------------------------------------------------------------------
// Projects & Operations
// --------------------------------------------------------------------------

export type OperationStatus = 'planned' | 'active' | 'completed' | 'archived';

export interface Operation {
  id: string;
  name: string;
  description: string;
  status: OperationStatus;
  createdAt: ISOTimestamp;
  /** Projects this operation belongs to */
  projectIds: string[];
}

export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: ISOTimestamp;
  /** Operations grouped under this project */
  operationIds: string[];
}

// --------------------------------------------------------------------------
// Common primitives
// --------------------------------------------------------------------------

/** ISO 8601 timestamp string */
export type ISOTimestamp = string;

/** Operational status used across the entire system */
export type SystemStatus = 'nominal' | 'warning' | 'critical' | 'offline' | 'unknown';

/** Colour-coded severity levels */
export type Severity = 'info' | 'ok' | 'warning' | 'critical';

// --------------------------------------------------------------------------
// User roles
// --------------------------------------------------------------------------

export type UserRole =
  | 'coxswain'
  | 'surveyor'
  | 'data_processor'
  | 'operations_manager'
  | 'client_representative';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  shiftStart?: ISOTimestamp;
}

// --------------------------------------------------------------------------
// Navigation / routing
// --------------------------------------------------------------------------

export interface NavItem {
  label: string;
  path: string;
  icon: string;           // unicode symbol or short identifier
  badge?: string | number;
  requiresRole?: UserRole[];
}

// --------------------------------------------------------------------------
// Telemetry
// --------------------------------------------------------------------------

export interface AttitudeData {
  roll: number;           // degrees, negative = port list
  pitch: number;          // degrees, positive = nose up
  heading: number;        // degrees true (0–360)
}

export interface PositionData {
  latitude: number;
  longitude: number;
  depth: number;          // metres below surface
  altitude: number;       // metres above seabed
}

export interface VelocityData {
  surge: number;          // m/s forward
  sway: number;           // m/s lateral
  heave: number;          // m/s vertical
  groundSpeed: number;    // knots
}

export interface PowerData {
  voltage: number;        // volts
  current: number;        // amps
  powerW: number;         // watts consumed
  batteryPct?: number;    // optional — for battery-backed systems
}

export interface TelemetrySnapshot {
  timestamp: ISOTimestamp;
  attitude: AttitudeData;
  position: PositionData;
  velocity: VelocityData;
  power: PowerData;
  towCableTension: number; // kN
  waterTemp: number;       // °C
  salinity: number;        // PSU
}

// --------------------------------------------------------------------------
// System Health
// --------------------------------------------------------------------------

export type SubsystemId =
  | 'imu'
  | 'dvl'
  | 'usbl'
  | 'altimeter'
  | 'camera_fwd'
  | 'camera_down'
  | 'sonar'
  | 'power_supply'
  | 'tow_winch'
  | 'comms_link'
  | 'pressure_vessel'
  | 'ethernet_switch';

export interface SubsystemHealth {
  id: SubsystemId;
  label: string;
  status: SystemStatus;
  lastUpdated: ISOTimestamp;
  message?: string;
  firmwareVersion?: string;
  latencyMs?: number;
}

export interface SystemHealthSnapshot {
  overallStatus: SystemStatus;
  subsystems: SubsystemHealth[];
  timestamp: ISOTimestamp;
}

// --------------------------------------------------------------------------
// Pre-flight checks
// --------------------------------------------------------------------------

export type CheckStatus = 'pending' | 'running' | 'passed' | 'failed' | 'skipped' | 'warning';

export interface PreFlightCheck {
  id: string;
  category: 'mechanical' | 'electrical' | 'software' | 'comms' | 'safety' | 'environmental';
  label: string;
  description: string;
  status: CheckStatus;
  automated: boolean;
  operator?: string;
  completedAt?: ISOTimestamp;
  notes?: string;
}

export interface PreFlightSession {
  id: string;
  startedAt: ISOTimestamp;
  completedAt?: ISOTimestamp;
  operator: string;
  checks: PreFlightCheck[];
  overallStatus: CheckStatus;
}

// --------------------------------------------------------------------------
// Flight / mission
// --------------------------------------------------------------------------

export type FlightPhase =
  | 'standby'
  | 'pre_flight'
  | 'launch'
  | 'transit'
  | 'on_station'
  | 'survey'
  | 'recovery'
  | 'post_flight';

export interface MissionLine {
  id: string;
  label: string;
  plannedLength: number;    // metres
  surveyedLength: number;   // metres
  status: 'pending' | 'active' | 'complete' | 'aborted';
}

export interface MissionPlan {
  id: string;
  name: string;
  vessel: string;
  area: string;
  createdAt: ISOTimestamp;
  lines: MissionLine[];
}

// --------------------------------------------------------------------------
// Alarms and notifications
// --------------------------------------------------------------------------

export interface Alarm {
  id: string;
  severity: Severity;
  source: string;
  message: string;
  raisedAt: ISOTimestamp;
  acknowledgedAt?: ISOTimestamp;
  acknowledgedBy?: string;
  active: boolean;
}

// --------------------------------------------------------------------------
// Calibration
// --------------------------------------------------------------------------

export type CalibrationStatus = 'not_run' | 'in_progress' | 'passed' | 'failed' | 'stale';

export interface CalibrationResult {
  id: string;
  subsystem: SubsystemId;
  label: string;
  status: CalibrationStatus;
  lastRun?: ISOTimestamp;
  operator?: string;
  residualError?: number;
  notes?: string;
}

// --------------------------------------------------------------------------
// Data Quality
// --------------------------------------------------------------------------

export interface DataQualityMetric {
  id: string;
  label: string;
  value: number;
  unit: string;
  threshold: number;
  status: SystemStatus;
  trend: 'improving' | 'stable' | 'degrading';
}

export interface DataQualityReport {
  lineId: string;
  lineLabel: string;
  generatedAt: ISOTimestamp;
  metrics: DataQualityMetric[];
  overallGrade: 'A' | 'B' | 'C' | 'D' | 'F';
}

// --------------------------------------------------------------------------
// Diagnostics and logs
// --------------------------------------------------------------------------

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical';

export interface LogEntry {
  id: string;
  timestamp: ISOTimestamp;
  level: LogLevel;
  source: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface DiagnosticEvent {
  id: string;
  timestamp: ISOTimestamp;
  subsystem: SubsystemId;
  type: 'fault' | 'recovery' | 'threshold_breach' | 'restart' | 'config_change';
  description: string;
  severity: Severity;
  resolved: boolean;
}

// --------------------------------------------------------------------------
// Settings
// --------------------------------------------------------------------------

export interface DisplaySettings {
  unitSystem: 'metric' | 'imperial';
  coordinateFormat: 'decimal' | 'dms' | 'ddm';
  depthReference: 'below_surface' | 'below_keel';
  timezone: string;
  refreshRateHz: number;
}

export interface AlertSettings {
  rollThresholdDeg: number;
  pitchThresholdDeg: number;
  minAltitudeM: number;
  maxDepthM: number;
  maxTensionKn: number;
  enableAudioAlerts: boolean;
  enableVisualFlash: boolean;
}

export interface SystemSettings {
  display: DisplaySettings;
  alerts: AlertSettings;
  instanceName: string;
  operatorName: string;
}
