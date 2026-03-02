import type { ServiceImpl } from '@connectrpc/connect';
import type { SettingsService } from '../../src/gen/rotv/v1/settings_pb.js';

export const settingsHandler: ServiceImpl<typeof SettingsService> = {
  async getSettings(_req) {
    return {
      display: {
        unitSystem: 'metric',
        coordinateFormat: 'decimal',
        depthReference: 'below_surface',
        timezone: 'UTC',
        refreshRateHz: 10,
      },
      alerts: {
        rollThresholdDeg: 15,
        pitchThresholdDeg: 10,
        minAltitudeM: 5,
        maxDepthM: 500,
        maxTensionKn: 50,
        enableAudioAlerts: true,
        enableVisualFlash: true,
      },
      instanceName: 'ROTV Flight',
      operatorName: '',
    };
  },

  async saveSettings(_req) {
    return { success: true };
  },
};
