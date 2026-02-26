
import type { SystemDef } from "../views/Systems/Systems";

// ---------------------------------------------------------------------------
// Image asset constants (Figma — valid ~7 days)
// ---------------------------------------------------------------------------

const IMG_SCANFISH = 'https://www.figma.com/api/mcp/asset/dab2b9d0-e054-44ef-9da0-8c09e0526520';
const IMG_VIPERFISH = 'https://www.figma.com/api/mcp/asset/15ddf60a-b705-4368-b9d2-5d7189eabf9d';
const IMG_WINCH     = 'https://www.figma.com/api/mcp/asset/3f376ace-05ae-4a12-99c5-c15508ba5c6e';

const SYSTEM_CATALOGUE: SystemDef[] = [
  {
    entry: {
      id: "scanfish",
      name: "ScanFish Rocio",
      type: "Towed Undulating Vehicle",
      ip: "192.168.1.10",
      firmware: "v4.12.3",
      signal: -58,
    },
    displayName: "ScanFish Rocio",
    image: IMG_SCANFISH,
    hasFirmwareUpdate: true,
    initiallyConnected: true,
  },
  {
    entry: {
      id: "viperfish",
      name: "ViperFish",
      type: "Deep-Tow Sensor Platform",
      ip: "192.168.1.24",
      firmware: "v2.8.1",
      signal: -71,
    },
    displayName: "ViperFish",
    image: IMG_VIPERFISH,
    hasFirmwareUpdate: false,
    initiallyConnected: false,
  },
  {
    entry: {
      id: "winch",
      name: "Winch",
      type: "Tow Winch Controller",
      ip: "192.168.1.50",
      firmware: "v1.6.0",
      signal: -44,
    },
    displayName: "Winch",
    image: IMG_WINCH,
    hasFirmwareUpdate: false,
    initiallyConnected: true,
  },
];

export default function mockGetSystemsService(): Promise<SystemDef[]> {
  
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(SYSTEM_CATALOGUE);
    }, 1000);
  });
}
