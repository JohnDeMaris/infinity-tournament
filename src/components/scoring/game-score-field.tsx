'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ScoreField } from '@infinity-tournament/shared/games';

interface GameScoreFieldProps {
  field: ScoreField;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  tournamentPointLimit?: number;
}

/**
 * Dynamic score field component that renders based on game system config
 */
export function GameScoreField({
  field,
  value,
  onChange,
  disabled = false,
  tournamentPointLimit,
}: GameScoreFieldProps) {
  // Calculate max value
  const maxValue =
    field.maxFromTournament === 'pointLimit' && tournamentPointLimit
      ? tournamentPointLimit
      : field.max;

  // Build label with range info
  const rangeLabel = maxValue !== undefined
    ? `(${field.min}-${maxValue})`
    : field.min > 0
      ? `(${field.min}+)`
      : '';

  return (
    <div className="space-y-2">
      <Label htmlFor={field.name}>
        {field.shortLabel || field.label} {rangeLabel}
      </Label>
      <Input
        id={field.name}
        type="number"
        min={field.min}
        max={maxValue}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="text-center text-lg"
        placeholder={field.description}
      />
    </div>
  );
}

/**
 * Validate a score value against field config
 */
export function validateScoreField(
  field: ScoreField,
  value: string,
  tournamentPointLimit?: number
): string | null {
  const numValue = parseInt(value);

  if (field.required && (value === '' || isNaN(numValue))) {
    return `${field.label} is required`;
  }

  if (value !== '' && !isNaN(numValue)) {
    if (numValue < field.min) {
      return `${field.label} must be at least ${field.min}`;
    }

    const maxValue =
      field.maxFromTournament === 'pointLimit' && tournamentPointLimit
        ? tournamentPointLimit
        : field.max;

    if (maxValue !== undefined && numValue > maxValue) {
      return `${field.label} must be at most ${maxValue}`;
    }
  }

  return null;
}
