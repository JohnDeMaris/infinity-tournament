'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { ParsedList, ValidationResult } from '@infinity-tournament/shared/games';
import { ChevronDown, ChevronRight, AlertCircle, AlertTriangle, CheckCircle } from 'lucide-react';

interface ParsedListDisplayProps {
  parsed: ParsedList;
  validation: ValidationResult;
  pointLimit: number;
  showUnits?: boolean;
  compact?: boolean;
}

/**
 * Static display component for showing a fully parsed army list
 * Displays faction, points, SWC, validation status, units, errors and warnings
 * Different from ListValidationPreview (which shows real-time validation while typing)
 */
export function ParsedListDisplay({
  parsed,
  validation,
  pointLimit,
  showUnits = true,
  compact = false,
}: ParsedListDisplayProps) {
  const [unitsExpanded, setUnitsExpanded] = useState(!compact);

  const points = parsed.points ?? 0;
  const pointsPercentage = Math.min((points / pointLimit) * 100, 100);
  const pointsOverLimit = points > pointLimit;

  // Extract SWC if present in units (Infinity-specific)
  const swc = extractSWC(parsed.units);
  const swcLimit = Math.ceil(pointLimit / 50); // Standard Infinity rule: 1 SWC per 50 points
  const swcPercentage = swc !== null ? Math.min((swc / swcLimit) * 100, 100) : 0;
  const swcOverLimit = swc !== null && swc > swcLimit;

  if (compact) {
    return (
      <div className="space-y-2">
        {/* Compact Header */}
        <div className="flex items-center gap-2 flex-wrap">
          {parsed.faction && (
            <Badge variant="outline" className="font-medium">
              {parsed.faction}
            </Badge>
          )}
          <Badge variant={validation.valid ? 'default' : 'destructive'}>
            {validation.valid ? (
              <><CheckCircle className="w-3 h-3 mr-1" />Valid</>
            ) : (
              <><AlertCircle className="w-3 h-3 mr-1" />Invalid</>
            )}
          </Badge>
        </div>

        {/* Compact Points/SWC */}
        <div className="text-sm space-y-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Points:</span>
            <span className={pointsOverLimit ? 'text-destructive font-medium' : ''}>
              {points} / {pointLimit}
            </span>
          </div>
          {swc !== null && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">SWC:</span>
              <span className={swcOverLimit ? 'text-destructive font-medium' : ''}>
                {swc} / {swcLimit}
              </span>
            </div>
          )}
        </div>

        {/* Compact Errors/Warnings */}
        {validation.errors.length > 0 && (
          <div className="text-xs text-destructive">
            {validation.errors.length} error{validation.errors.length !== 1 ? 's' : ''}
          </div>
        )}
        {validation.warnings.length > 0 && (
          <div className="text-xs text-amber-600">
            {validation.warnings.length} warning{validation.warnings.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {parsed.faction && (
              <Badge variant="outline" className="font-medium text-base">
                {parsed.faction}
              </Badge>
            )}
          </CardTitle>
          <Badge
            variant={validation.valid ? 'default' : 'destructive'}
            className="text-sm"
          >
            {validation.valid ? (
              <><CheckCircle className="w-4 h-4 mr-1" />Valid</>
            ) : (
              <><AlertCircle className="w-4 h-4 mr-1" />Invalid</>
            )}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Points Summary with Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Points</span>
            <span className={pointsOverLimit ? 'text-destructive font-bold' : 'font-medium'}>
              {points} / {pointLimit}
            </span>
          </div>
          <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full transition-all ${
                pointsOverLimit ? 'bg-destructive' : 'bg-green-500'
              }`}
              style={{ width: `${pointsPercentage}%` }}
            />
          </div>
        </div>

        {/* SWC Summary with Progress Bar (if applicable) */}
        {swc !== null && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">SWC</span>
              <span className={swcOverLimit ? 'text-destructive font-bold' : 'font-medium'}>
                {swc} / {swcLimit}
              </span>
            </div>
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full transition-all ${
                  swcOverLimit ? 'bg-destructive' : 'bg-green-500'
                }`}
                style={{ width: `${swcPercentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Units List (Collapsible) */}
        {showUnits && parsed.units && parsed.units.length > 0 && (
          <div className="border rounded-lg">
            <button
              onClick={() => setUnitsExpanded(!unitsExpanded)}
              className="flex items-center justify-between w-full p-3 text-sm font-medium hover:bg-muted/50 transition-colors"
            >
              <span>Units ({parsed.units.length})</span>
              {unitsExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
            {unitsExpanded && (
              <div className="border-t">
                <div className="p-3 space-y-2 max-h-80 overflow-y-auto">
                  {parsed.units.map((unit, idx) => (
                    <UnitRow key={idx} unit={unit} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Errors */}
        {validation.errors.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="font-medium mb-2">Errors:</div>
              <ul className="list-disc list-inside space-y-1">
                {validation.errors.map((error, idx) => (
                  <li key={idx} className="text-sm">{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Warnings */}
        {validation.warnings.length > 0 && (
          <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-900 dark:text-amber-200">
              <div className="font-medium mb-2">Warnings:</div>
              <ul className="list-disc list-inside space-y-1">
                {validation.warnings.map((warning, idx) => (
                  <li key={idx} className="text-sm">{warning}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Display a single unit with name and cost
 */
function UnitRow({ unit }: { unit: unknown }) {
  // Handle different unit structures (game-specific)
  const unitData = unit as Record<string, unknown>;
  const name = (unitData.name ?? unitData.unit_name ?? 'Unknown Unit') as string;
  const cost = Number(unitData.points ?? unitData.cost ?? 0);
  const swc = unitData.swc !== undefined && unitData.swc !== null ? Number(unitData.swc) : null;

  return (
    <div className="flex justify-between items-center text-sm py-1 hover:bg-muted/30 px-2 rounded">
      <span className="truncate flex-1">{name}</span>
      <span className="text-muted-foreground ml-2 flex-shrink-0">
        {cost}pts
        {swc !== null && swc > 0 && (
          <span className="ml-2 text-xs">({swc} SWC)</span>
        )}
      </span>
    </div>
  );
}

/**
 * Extract total SWC from parsed units (Infinity-specific)
 */
function extractSWC(units: unknown[] | undefined): number | null {
  if (!units || units.length === 0) {
    return null;
  }

  let totalSWC = 0;
  let hasSWC = false;

  for (const unit of units) {
    const unitData = unit as Record<string, unknown>;
    const swc = unitData.swc;

    if (swc !== undefined && swc !== null) {
      hasSWC = true;
      totalSWC += Number(swc);
    }
  }

  return hasSWC ? totalSWC : null;
}
