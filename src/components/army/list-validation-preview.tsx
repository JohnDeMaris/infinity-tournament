'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  parseInfinityArmyCode,
  validateInfinityList,
  type ParsedList,
  type ValidationResult,
} from '@infinity-tournament/shared/games';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, AlertCircle, AlertTriangle } from 'lucide-react';

interface ListValidationPreviewProps {
  code: string;
  pointLimit: number;
}

export function ListValidationPreview({
  code,
  pointLimit,
}: ListValidationPreviewProps) {
  const [debouncedCode, setDebouncedCode] = useState(code);

  // Debounce the code changes (500ms after typing stops)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedCode(code), 500);
    return () => clearTimeout(timer);
  }, [code]);

  // Parse and validate
  const { parsed, validation } = useMemo(() => {
    if (!debouncedCode || debouncedCode.trim().length < 10) {
      return { parsed: null, validation: null };
    }

    try {
      const parsed = parseInfinityArmyCode(debouncedCode);
      const validation = validateInfinityList(parsed, { pointLimit });
      return { parsed, validation };
    } catch (error) {
      return { parsed: null, validation: null };
    }
  }, [debouncedCode, pointLimit]);

  // Calculate SWC limit (point limit / 50)
  const swcLimit = Math.floor(pointLimit / 50);

  // Get parsed SWC value (if available)
  const swcValue = parsed && typeof (parsed as any).swc === 'number'
    ? (parsed as any).swc
    : null;

  // Calculate progress percentages
  const pointsPercent = parsed?.points ? (parsed.points / pointLimit) * 100 : 0;
  const swcPercent = swcValue !== null ? (swcValue / swcLimit) * 100 : 0;

  // Determine status color classes
  const getPointsColor = () => {
    if (!parsed?.points) return '';
    if (parsed.points > pointLimit) return 'text-destructive';
    if (parsed.points === pointLimit) return 'text-green-600';
    return 'text-muted-foreground';
  };

  const getSwcColor = () => {
    if (swcValue === null) return '';
    if (swcValue > swcLimit) return 'text-destructive';
    return 'text-muted-foreground';
  };

  if (!code || code.trim().length < 10) {
    return (
      <Card className="border-dashed">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground text-center">
            Paste your army code to see validation preview
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!parsed && !validation) {
    return (
      <Card className="border-dashed">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground text-center">
            Validating...
          </p>
        </CardContent>
      </Card>
    );
  }

  const hasErrors = validation && validation.errors.length > 0;
  const hasWarnings = validation && validation.warnings.length > 0;
  const isValid = validation?.valid;

  return (
    <Card className={hasErrors ? 'border-destructive' : ''}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">List Validation</CardTitle>
          {isValid && (
            <Badge variant="default" className="bg-green-600">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Valid
            </Badge>
          )}
          {hasErrors && (
            <Badge variant="destructive">
              <AlertCircle className="h-3 w-3 mr-1" />
              Invalid
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Faction */}
        {parsed?.faction && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Faction:</span>
            <Badge variant="secondary">{parsed.faction}</Badge>
          </div>
        )}

        {/* Points */}
        {parsed?.points !== null && parsed?.points !== undefined && (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Points:</span>
              <span className={`text-sm font-medium ${getPointsColor()}`}>
                {parsed.points} / {pointLimit}
              </span>
            </div>
            <Progress
              value={Math.min(pointsPercent, 100)}
              className={parsed.points > pointLimit ? 'bg-destructive/20' : ''}
            />
          </div>
        )}

        {/* SWC */}
        {swcValue !== null && (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">SWC:</span>
              <span className={`text-sm font-medium ${getSwcColor()}`}>
                {swcValue} / {swcLimit}
              </span>
            </div>
            <Progress
              value={Math.min(swcPercent, 100)}
              className={swcValue > swcLimit ? 'bg-destructive/20' : ''}
            />
          </div>
        )}

        {/* Units Count */}
        {parsed?.units && Array.isArray(parsed.units) && parsed.units.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Units:</span>
            <Badge variant="outline">{parsed.units.length}</Badge>
          </div>
        )}

        {/* Errors */}
        {hasErrors && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {validation.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Warnings */}
        {hasWarnings && (
          <Alert className="border-amber-500 bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-100">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {validation.warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
