import type { SystemSettings } from '../types';
import { transport } from './transport';
import { getSettingsClient } from './clients';

const DEFAULT_SETTINGS: SystemSettings = {
  instanceName:  'ROTV-01',
  operatorName:  'J. Mackenzie',
  display: {
    unitSystem:        'metric',
    coordinateFormat:  'decimal',
    depthReference:    'below_surface',
    timezone:          'UTC',
    refreshRateHz:     10,
  },
  alerts: {
    rollThresholdDeg:  15,
    pitchThresholdDeg: 20,
    minAltitudeM:      2,
    maxDepthM:         200,
    maxTensionKn:      6,
    enableAudioAlerts: true,
    enableVisualFlash: true,
  },
};

function protoToSettings(proto: {
  display?: {
    unitSystem?: string; coordinateFormat?: string; depthReference?: string;
    timezone?: string; refreshRateHz?: number;
  };
  alerts?: {
    rollThresholdDeg?: number; pitchThresholdDeg?: number; minAltitudeM?: number;
    maxDepthM?: number; maxTensionKn?: number; enableAudioAlerts?: boolean;
    enableVisualFlash?: boolean;
  };
  instanceName?: string;
  operatorName?: string;
}): SystemSettings {
  return {
    display: {
      unitSystem: (proto.display?.unitSystem ?? 'metric') as SystemSettings['display']['unitSystem'],
      coordinateFormat: (proto.display?.coordinateFormat ?? 'decimal') as SystemSettings['display']['coordinateFormat'],
      depthReference: (proto.display?.depthReference ?? 'below_surface') as SystemSettings['display']['depthReference'],
      timezone: proto.display?.timezone ?? 'UTC',
      refreshRateHz: proto.display?.refreshRateHz ?? 10,
    },
    alerts: {
      rollThresholdDeg: proto.alerts?.rollThresholdDeg ?? 15,
      pitchThresholdDeg: proto.alerts?.pitchThresholdDeg ?? 10,
      minAltitudeM: proto.alerts?.minAltitudeM ?? 5,
      maxDepthM: proto.alerts?.maxDepthM ?? 500,
      maxTensionKn: proto.alerts?.maxTensionKn ?? 50,
      enableAudioAlerts: proto.alerts?.enableAudioAlerts ?? true,
      enableVisualFlash: proto.alerts?.enableVisualFlash ?? true,
    },
    instanceName: proto.instanceName ?? 'ROTV Flight',
    operatorName: proto.operatorName ?? '',
  };
}

export async function getSettings(): Promise<SystemSettings> {
  if (!transport) return DEFAULT_SETTINGS;

  const proto = await getSettingsClient().getSettings({});
  return protoToSettings(proto);
}

export async function saveSettings(settings: SystemSettings): Promise<boolean> {
  if (!transport) return true;

  const response = await getSettingsClient().saveSettings({
    display: {
      unitSystem: settings.display.unitSystem,
      coordinateFormat: settings.display.coordinateFormat,
      depthReference: settings.display.depthReference,
      timezone: settings.display.timezone,
      refreshRateHz: settings.display.refreshRateHz,
    },
    alerts: {
      rollThresholdDeg: settings.alerts.rollThresholdDeg,
      pitchThresholdDeg: settings.alerts.pitchThresholdDeg,
      minAltitudeM: settings.alerts.minAltitudeM,
      maxDepthM: settings.alerts.maxDepthM,
      maxTensionKn: settings.alerts.maxTensionKn,
      enableAudioAlerts: settings.alerts.enableAudioAlerts,
      enableVisualFlash: settings.alerts.enableVisualFlash,
    },
    instanceName: settings.instanceName,
    operatorName: settings.operatorName,
  });
  return response.success;
}
