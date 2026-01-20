'use client';

import type { Standing } from '@/types';

interface OverlayStandingsProps {
  standings: Standing[];
  maxRows?: number;
  showHeader?: boolean;
}

/**
 * Minimal standings display for OBS/streaming overlays.
 * Features:
 * - Transparent background for browser source compositing
 * - Auto-scaling fonts for different overlay sizes
 * - Text shadows for readability on varied backgrounds
 * - No padding/margins on container
 */
export function OverlayStandings({
  standings,
  maxRows = 10,
  showHeader = true,
}: OverlayStandingsProps) {
  const displayStandings = standings.slice(0, maxRows);

  return (
    <div className="overlay-standings">
      <table className="w-full border-collapse">
        {showHeader && (
          <thead>
            <tr className="overlay-header-row">
              <th className="overlay-cell overlay-rank">#</th>
              <th className="overlay-cell overlay-name text-left">Player</th>
              <th className="overlay-cell overlay-op text-right">OP</th>
              <th className="overlay-cell overlay-wld text-center">W-L-D</th>
            </tr>
          </thead>
        )}
        <tbody>
          {displayStandings.map((standing, index) => (
            <tr
              key={standing.user_id}
              className={`overlay-row ${index % 2 === 0 ? 'overlay-row-even' : 'overlay-row-odd'}`}
            >
              <td className="overlay-cell overlay-rank font-bold">
                {standing.rank}
              </td>
              <td className="overlay-cell overlay-name text-left truncate">
                {standing.player_name}
              </td>
              <td className="overlay-cell overlay-op text-right font-semibold">
                {standing.total_op}
              </td>
              <td className="overlay-cell overlay-wld text-center">
                {standing.wins}-{standing.losses}-{standing.draws}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <style jsx>{`
        .overlay-standings {
          /* Transparent for OBS browser source */
          background: transparent;
          /* No margins/padding on container */
          margin: 0;
          padding: 0;
          /* Use system sans-serif for clean readability */
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
            'Helvetica Neue', Arial, sans-serif;
          /* Responsive base font size - scales with viewport */
          font-size: clamp(12px, 2vw, 18px);
        }

        .overlay-cell {
          padding: 0.3em 0.5em;
          /* Text shadow for readability on varied backgrounds */
          text-shadow:
            1px 1px 2px rgba(0, 0, 0, 0.8),
            -1px -1px 2px rgba(0, 0, 0, 0.8);
          /* Default white text - works on most stream backgrounds */
          color: #ffffff;
          white-space: nowrap;
        }

        .overlay-header-row {
          /* Slightly transparent dark header */
          background: rgba(0, 0, 0, 0.6);
        }

        .overlay-header-row .overlay-cell {
          font-weight: 600;
          text-transform: uppercase;
          font-size: 0.85em;
          letter-spacing: 0.05em;
          color: #e0e0e0;
        }

        .overlay-row-even {
          background: rgba(0, 0, 0, 0.4);
        }

        .overlay-row-odd {
          background: rgba(0, 0, 0, 0.25);
        }

        .overlay-rank {
          width: 2.5em;
          text-align: center;
        }

        .overlay-name {
          max-width: 12em;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .overlay-op {
          width: 3em;
          /* Highlight OP as primary score */
          color: #ffd700;
        }

        .overlay-wld {
          width: 5em;
          font-variant-numeric: tabular-nums;
        }
      `}</style>
    </div>
  );
}
