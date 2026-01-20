import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { achievementDefinitions } from '@/lib/achievements/definitions';

export const runtime = 'edge';

// Icon mapping - simple emoji representation
const iconMap: Record<string, string> = {
  trophy: '🏆',
  calendar: '📅',
  medal: '🏅',
  swords: '⚔️',
  crown: '👑',
  shield: '🛡️',
  flag: '🚩',
  sparkles: '✨',
  users: '👥',
  rocket: '🚀',
};

// Category colors
const categoryColors: Record<string, { bg: string; accent: string }> = {
  participation: { bg: '#1e3a8a', accent: '#3b82f6' }, // blue
  performance: { bg: '#7c2d12', accent: '#f97316' }, // orange
  faction: { bg: '#4c1d95', accent: '#a855f7' }, // purple
  community: { bg: '#065f46', accent: '#10b981' }, // green
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Parse ID (can be index or name)
    const { id } = await params;
    const achievementId = id;

    // Find achievement by index or name
    let achievement = achievementDefinitions[parseInt(achievementId)];
    if (!achievement) {
      const found = achievementDefinitions.find(a =>
        a.name.toLowerCase().replace(/\s+/g, '-') === achievementId.toLowerCase()
      );
      if (!found) {
        return new Response('Achievement not found', { status: 404 });
      }
      achievement = found;
    }

    const icon = iconMap[achievement.icon] || '🎯';
    const colors = categoryColors[achievement.category] || categoryColors.participation;

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: `linear-gradient(135deg, ${colors.bg} 0%, ${colors.accent} 100%)`,
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          {/* Background pattern */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              opacity: 0.1,
              background: 'radial-gradient(circle at 30% 40%, white 0%, transparent 40%), radial-gradient(circle at 70% 60%, white 0%, transparent 40%)',
            }}
          />

          {/* Content card */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              borderRadius: '32px',
              padding: '60px 80px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              maxWidth: '900px',
              margin: '0 60px',
            }}
          >
            {/* Icon */}
            <div
              style={{
                fontSize: '120px',
                marginBottom: '30px',
                filter: 'drop-shadow(0 10px 15px rgba(0, 0, 0, 0.2))',
              }}
            >
              {icon}
            </div>

            {/* Achievement name */}
            <div
              style={{
                fontSize: '64px',
                fontWeight: 'bold',
                color: '#1f2937',
                textAlign: 'center',
                marginBottom: '20px',
                lineHeight: 1.2,
              }}
            >
              {achievement.name}
            </div>

            {/* Description */}
            <div
              style={{
                fontSize: '32px',
                color: '#6b7280',
                textAlign: 'center',
                marginBottom: '30px',
                lineHeight: 1.4,
                maxWidth: '700px',
              }}
            >
              {achievement.description}
            </div>

            {/* Points badge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.accent,
                color: 'white',
                borderRadius: '999px',
                padding: '16px 40px',
                fontSize: '28px',
                fontWeight: 'bold',
              }}
            >
              {achievement.points} Points
            </div>

            {/* Category badge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                marginTop: '24px',
                color: '#9ca3af',
                fontSize: '20px',
                textTransform: 'uppercase',
                letterSpacing: '1.5px',
              }}
            >
              {achievement.category}
            </div>
          </div>

          {/* Branding */}
          <div
            style={{
              position: 'absolute',
              bottom: '40px',
              display: 'flex',
              alignItems: 'center',
              color: 'white',
              fontSize: '24px',
              fontWeight: 'bold',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
            }}
          >
            INFINITY TOURNAMENT
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error('Error generating achievement OG image:', error);
    return new Response('Failed to generate image', { status: 500 });
  }
}
