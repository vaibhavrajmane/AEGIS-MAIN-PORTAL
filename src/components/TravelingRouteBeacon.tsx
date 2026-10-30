import React, { useEffect, useState, useRef } from 'react';

interface TravelingRouteBeaconProps {
  pathD: string;
  pathId: string;
  durationSeconds?: number;
  label?: string;
  showHeadingArrow?: boolean;
}

/**
 * TravelingRouteBeacon
 *
 * Renders a glowing red traveling circle that smoothly traces the vessel's actual
 * route from initial departure coordinates to its live current position.
 *
 * Dual-Engine Architecture:
 * 1. Primary Engine: High-precision requestAnimationFrame with SVGPathElement.getPointAtLength(),
 *    ensuring 60fps silky smooth movement, zero drift, exact path centering, and heading alignment.
 * 2. Native SMIL Engine: Pure SVG <animateMotion> with normalized (cx=0, cy=0) and <mpath> link
 *    as a bulletproof fallback in all browser rendering engines without depending on external filters.
 */
export const TravelingRouteBeacon: React.FC<TravelingRouteBeaconProps> = ({
  pathD,
  pathId,
  durationSeconds = 5.5,
  label = 'LIVE',
  showHeadingArrow = true,
}) => {
  const hiddenPathRef = useRef<SVGPathElement>(null);
  const [coords, setCoords] = useState<{ x: number; y: number; angleDeg: number } | null>(null);

  useEffect(() => {
    let animId: number;
    let startTime: number | null = null;
    const durationMs = durationSeconds * 1000;

    const animate = (timestamp: number) => {
      if (startTime === null) startTime = timestamp;
      const elapsed = (timestamp - startTime) % durationMs;
      const progress = elapsed / durationMs;

      const pathNode = hiddenPathRef.current;
      if (pathNode) {
        try {
          const totalLen = pathNode.getTotalLength();
          if (totalLen > 0) {
            const currentDist = progress * totalLen;
            const pt = pathNode.getPointAtLength(currentDist);

            // Compute tangent angle for heading orientation
            const nextDist = Math.min(totalLen, currentDist + 2);
            const ptNext = pathNode.getPointAtLength(nextDist);
            const angleRad = Math.atan2(ptNext.y - pt.y, ptNext.x - pt.x);
            const angleDeg = (angleRad * 180) / Math.PI;

            setCoords({ x: pt.x, y: pt.y, angleDeg });
          }
        } catch {
          // If browser DOM calculation fails, fallback SMIL animateMotion handles rendering
        }
      }

      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [pathD, durationSeconds]);

  return (
    <>
      {/* Hidden reference path strictly used for exact mathematical arc-length sampling */}
      <path
        ref={hiddenPathRef}
        id={pathId}
        d={pathD}
        fill="none"
        stroke="none"
        pointerEvents="none"
      />

      {coords ? (
        // High-Precision JavaScript 60fps Transform Engine
        <g
          transform={`translate(${coords.x}, ${coords.y})`}
          className="pointer-events-none"
        >
          {/* Pulsing Radar Aura */}
          <circle
            cx={0}
            cy={0}
            r={18}
            fill="#ef4444"
            fillOpacity="0.22"
            stroke="#f87171"
            strokeWidth="1.5"
          >
            <animate attributeName="r" values="10;22;10" dur="1.8s" repeatCount="indefinite" />
            <animate attributeName="fillOpacity" values="0.35;0.05;0.35" dur="1.8s" repeatCount="indefinite" />
            <animate attributeName="strokeOpacity" values="0.8;0.1;0.8" dur="1.8s" repeatCount="indefinite" />
          </circle>

          {/* Secondary Glow Flare */}
          <circle
            cx={0}
            cy={0}
            r={11}
            fill="#ef4444"
            fillOpacity="0.55"
            stroke="#fca5a5"
            strokeWidth="1.2"
          />

          {/* Solid Vivid Red Beacon Body */}
          <circle
            cx={0}
            cy={0}
            r={6.5}
            fill="#dc2626"
            stroke="#ffffff"
            strokeWidth="2.5"
          />

          {/* Crisp Pure White Central Dot */}
          <circle cx={0} cy={0} r={2.5} fill="#ffffff" />

          {/* Directional Heading Pointer Arrow (aligned with path curvature) */}
          {showHeadingArrow && (
            <g transform={`rotate(${coords.angleDeg})`}>
              <polygon
                points="11,-3 16,0 11,3"
                fill="#ffffff"
                stroke="#dc2626"
                strokeWidth="1"
              />
            </g>
          )}

          {/* Mini Tactical Tracking Tag */}
          {label && (
            <g transform="translate(0, -14)">
              <rect
                x="-14"
                y="-9"
                width="28"
                height="12"
                rx="6"
                fill="#ef4444"
                stroke="#ffffff"
                strokeWidth="1"
                fillOpacity="0.95"
              />
              <text
                x="0"
                y="-1"
                fill="#ffffff"
                fontFamily="sans-serif"
                fontSize="7.5"
                fontWeight="900"
                textAnchor="middle"
                letterSpacing="0.5px"
              >
                {label}
              </text>
            </g>
          )}
        </g>
      ) : (
        // Pure SVG Native SMIL Fallback Engine (Immediate Static & Initial Rendering)
        <g className="pointer-events-none">
          <animateMotion
            dur={`${durationSeconds}s`}
            repeatCount="indefinite"
            path={pathD}
            rotate="auto"
          >
            <mpath href={`#${pathId}`} />
          </animateMotion>

          {/* Outer Pulsing Wave */}
          <circle
            cx={0}
            cy={0}
            r={18}
            fill="#ef4444"
            fillOpacity="0.25"
            stroke="#f87171"
            strokeWidth="1.5"
          >
            <animate attributeName="r" values="10;22;10" dur="1.8s" repeatCount="indefinite" />
            <animate attributeName="fillOpacity" values="0.35;0.05;0.35" dur="1.8s" repeatCount="indefinite" />
          </circle>

          {/* Middle Red Aura */}
          <circle
            cx={0}
            cy={0}
            r={11}
            fill="#ef4444"
            fillOpacity="0.55"
            stroke="#fca5a5"
            strokeWidth="1.2"
          />

          {/* High-visibility Core */}
          <circle
            cx={0}
            cy={0}
            r={6.5}
            fill="#dc2626"
            stroke="#ffffff"
            strokeWidth="2.5"
          />

          {/* Center White Core */}
          <circle cx={0} cy={0} r={2.5} fill="#ffffff" />
        </g>
      )}
    </>
  );
};
