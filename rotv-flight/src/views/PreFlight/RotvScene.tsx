import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { CheckSceneNode, CheckStatus } from '../../types';
import { resolveSceneNode } from './rotvNodeRegistry';

// ---------------------------------------------------------------------------
// ROTV 3D mesh (moved from PreFlight.tsx)
// ---------------------------------------------------------------------------

function RotvMesh() {
  return (
    <group>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[2.4, 0.5, 0.5]} />
        <meshStandardMaterial color="#1e90d4" metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[0.6, 0.35, 0]}>
        <boxGeometry args={[0.6, 0.25, 0.05]} />
        <meshStandardMaterial color="#3aa3e0" metalness={0.4} roughness={0.4} />
      </mesh>
      <mesh position={[0, -0.05, 0.55]}>
        <boxGeometry args={[1.1, 0.06, 0.5]} />
        <meshStandardMaterial color="#2a3f5f" metalness={0.5} roughness={0.3} />
      </mesh>
      <mesh position={[0, -0.05, -0.55]}>
        <boxGeometry args={[1.1, 0.06, 0.5]} />
        <meshStandardMaterial color="#2a3f5f" metalness={0.5} roughness={0.3} />
      </mesh>
      <mesh position={[-1.35, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <coneGeometry args={[0.25, 0.4, 8]} />
        <meshStandardMaterial color="#1a2236" metalness={0.7} roughness={0.2} />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------------------
// Status visual config
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<
  CheckStatus,
  { color: string; emissive: string; emissiveIntensity: number }
> = {
  pending:  { color: '#888888', emissive: '#000000', emissiveIntensity: 0   },
  running:  { color: '#1e90d4', emissive: '#1e90d4', emissiveIntensity: 0.4 },
  passed:   { color: '#2d9c5a', emissive: '#2d9c5a', emissiveIntensity: 0.2 },
  failed:   { color: '#dd4444', emissive: '#dd4444', emissiveIntensity: 0.3 },
  warning:  { color: '#e87c2e', emissive: '#e87c2e', emissiveIntensity: 0.2 },
  skipped:  { color: '#666666', emissive: '#000000', emissiveIntensity: 0   },
};

const HOVERED_CONFIG = { color: '#ffffff', emissive: '#ffffff', emissiveIntensity: 0.6 };

// ---------------------------------------------------------------------------
// PositionNode
// ---------------------------------------------------------------------------

interface PositionNodeProps {
  checkId: string;
  node: CheckSceneNode;
  status: CheckStatus;
  label: string;
  isHovered: boolean;
  onHover: (id: string | null) => void;
}

function PositionNode({ checkId, node, status, label, isHovered, onHover }: PositionNodeProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  const cfg = isHovered ? HOVERED_CONFIG : STATUS_CONFIG[status];
  const radius = node.radius ?? 0.07;

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    if (isHovered) {
      meshRef.current.scale.setScalar(1.3);
    } else if (status === 'running') {
      const pulse = 1.0 + 0.2 * Math.sin(clock.getElapsedTime() * 4);
      meshRef.current.scale.setScalar(pulse);
    } else {
      meshRef.current.scale.setScalar(1.0);
    }
  });

  return (
    <group position={node.position}>
      {/* Main marker sphere */}
      <mesh
        ref={meshRef}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
          onHover(checkId);
        }}
        onPointerOut={() => {
          document.body.style.cursor = '';
          onHover(null);
        }}
      >
        <sphereGeometry args={[radius, 16, 16]} />
        <meshStandardMaterial
          color={cfg.color}
          emissive={cfg.emissive}
          emissiveIntensity={cfg.emissiveIntensity}
        />
      </mesh>

      {/* Outer wireframe ring — running only */}
      {status === 'running' && (
        <mesh ref={ringRef}>
          <sphereGeometry args={[radius * 1.4, 12, 12]} />
          <meshStandardMaterial
            color="#1e90d4"
            wireframe
            transparent
            opacity={0.3}
          />
        </mesh>
      )}

      {/* Tooltip on hover */}
      {isHovered && (
        <Html center distanceFactor={6}>
          <div
            style={{
              background: 'rgba(10, 20, 35, 0.92)',
              border: '1px solid rgba(30, 144, 212, 0.6)',
              borderRadius: 4,
              padding: '4px 8px',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <span style={{ color: '#e8edf5', fontSize: 11, fontWeight: 600 }}>
              {label}
            </span>
            <span
              style={{
                color: STATUS_CONFIG[status]?.color ?? '#888',
                fontSize: 10,
                textTransform: 'capitalize',
              }}
            >
              {status}
            </span>
          </div>
        </Html>
      )}
    </group>
  );
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface SceneCheck {
  id: string;
  label: string;
  category: string;
  status: CheckStatus;
  sceneNode?: CheckSceneNode;
}

interface RotvSceneProps {
  checks: SceneCheck[];
  hoveredCheckId: string | null;
  onNodeHover: (checkId: string | null) => void;
}

export function RotvScene({ checks, hoveredCheckId, onNodeHover }: RotvSceneProps) {
  return (
    <group>
      <RotvMesh />
      {checks.map((check) => {
        const node = resolveSceneNode(check);
        if (!node) return null;
        return (
          <PositionNode
            key={check.id}
            checkId={check.id}
            node={node}
            status={check.status}
            label={node.label ?? check.label}
            isHovered={hoveredCheckId === check.id}
            onHover={onNodeHover}
          />
        );
      })}
    </group>
  );
}
