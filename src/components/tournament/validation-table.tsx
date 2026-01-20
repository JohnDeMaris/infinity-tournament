'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  parseInfinityArmyCode,
  validateInfinityList,
  type ParsedList,
  type ValidationResult,
} from '@infinity-tournament/shared/games';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ParsedListDisplay } from '@/components/army/parsed-list-display';
import { ChevronDown, ChevronRight, Loader2, Download } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import {
  exportValidationCSV,
  exportValidationText,
  downloadAsFile,
} from '@/lib/export/validation-report';

interface Registration {
  id: string;
  user_id: string;
  user_name: string;
  army_list_code: string | null;
  army_faction: string | null;
  list_validation_result: {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } | null;
}

interface ValidationTableProps {
  registrations: Registration[];
  pointLimit: number;
  tournamentId: string;
  tournamentName?: string;
}

type FilterStatus = 'all' | 'valid' | 'invalid' | 'not-submitted';

interface ParsedRegistration extends Registration {
  parsed: ParsedList | null;
  validation: ValidationResult | null;
}

export function ValidationTable({
  registrations,
  pointLimit,
  tournamentId,
  tournamentName = 'Tournament',
}: ValidationTableProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [isValidating, setIsValidating] = useState(false);

  // Parse and validate lists on client side for display
  const parsedRegistrations: ParsedRegistration[] = registrations.map((reg) => {
    if (!reg.army_list_code) {
      return { ...reg, parsed: null, validation: null };
    }

    try {
      const parsed = parseInfinityArmyCode(reg.army_list_code);
      const validation = validateInfinityList(parsed, { pointLimit });
      return { ...reg, parsed, validation };
    } catch (error) {
      return { ...reg, parsed: null, validation: null };
    }
  });

  // Filter registrations
  const filteredRegistrations = parsedRegistrations.filter((reg) => {
    if (filter === 'all') return true;
    if (filter === 'not-submitted') return !reg.army_list_code;
    if (filter === 'valid') return reg.validation?.valid === true;
    if (filter === 'invalid') return reg.army_list_code && reg.validation?.valid === false;
    return true;
  });

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const handleValidateAll = async () => {
    setIsValidating(true);
    try {
      const supabase = createClient();

      // Process each registration with an army list
      const updates = parsedRegistrations
        .filter(reg => reg.army_list_code)
        .map(reg => {
          const validationResult = reg.validation || {
            valid: false,
            errors: ['Failed to parse list'],
            warnings: [],
          };

          return {
            id: reg.id,
            list_validation_result: validationResult,
          };
        });

      // Update all registrations in batch
      for (const update of updates) {
        await supabase
          .from('registrations')
          .update({ list_validation_result: update.list_validation_result })
          .eq('id', update.id);
      }

      // Refresh the page to show updated data
      router.refresh();
    } catch (error) {
      console.error('Failed to validate lists:', error);
    } finally {
      setIsValidating(false);
    }
  };

  const getStatusBadge = (reg: ParsedRegistration) => {
    if (!reg.army_list_code) {
      return (
        <Badge variant="secondary" className="bg-gray-100 text-gray-700">
          Not Submitted
        </Badge>
      );
    }

    if (reg.validation?.valid) {
      return (
        <Badge variant="default" className="bg-green-600">
          Valid
        </Badge>
      );
    }

    return (
      <Badge variant="destructive">
        Invalid
      </Badge>
    );
  };

  const extractSWC = (units: unknown[] | undefined): number => {
    if (!units || units.length === 0) return 0;

    let totalSWC = 0;
    for (const unit of units) {
      const unitData = unit as Record<string, unknown>;
      const swc = unitData.swc;
      if (swc !== undefined && swc !== null) {
        totalSWC += Number(swc);
      }
    }
    return totalSWC;
  };

  // Count stats for display
  const stats = {
    total: registrations.length,
    submitted: registrations.filter(r => r.army_list_code).length,
    valid: parsedRegistrations.filter(r => r.validation?.valid).length,
    invalid: parsedRegistrations.filter(r => r.army_list_code && !r.validation?.valid).length,
  };

  // Export handlers
  const handleExportCSV = () => {
    const rows = parsedRegistrations.map((reg) => {
      const swc = reg.parsed?.units ? extractSWC(reg.parsed.units) : null;
      let status: 'valid' | 'invalid' | 'not_submitted';
      if (!reg.army_list_code) {
        status = 'not_submitted';
      } else if (reg.validation?.valid) {
        status = 'valid';
      } else {
        status = 'invalid';
      }

      return {
        playerName: reg.user_name,
        faction: reg.parsed?.faction || reg.army_faction || null,
        points: reg.parsed?.points ?? null,
        swc,
        status,
        errors: reg.validation?.errors || [],
      };
    });

    const csv = exportValidationCSV(tournamentName, rows);
    const filename = `${tournamentName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_validation_${new Date().toISOString().split('T')[0]}.csv`;
    downloadAsFile(csv, filename, 'text/csv');
  };

  const handleExportText = () => {
    const rows = parsedRegistrations.map((reg) => {
      const swc = reg.parsed?.units ? extractSWC(reg.parsed.units) : null;
      let status: 'valid' | 'invalid' | 'not_submitted';
      if (!reg.army_list_code) {
        status = 'not_submitted';
      } else if (reg.validation?.valid) {
        status = 'valid';
      } else {
        status = 'invalid';
      }

      return {
        playerName: reg.user_name,
        faction: reg.parsed?.faction || reg.army_faction || null,
        points: reg.parsed?.points ?? null,
        swc,
        status,
        errors: reg.validation?.errors || [],
      };
    });

    const text = exportValidationText(tournamentName, rows);
    const filename = `${tournamentName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_validation_${new Date().toISOString().split('T')[0]}.txt`;
    downloadAsFile(text, filename, 'text/plain');
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Filter:</span>
          <Select value={filter} onValueChange={(v) => setFilter(v as FilterStatus)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All ({stats.total})</SelectItem>
              <SelectItem value="valid">Valid ({stats.valid})</SelectItem>
              <SelectItem value="invalid">Invalid ({stats.invalid})</SelectItem>
              <SelectItem value="not-submitted">
                Not Submitted ({stats.total - stats.submitted})
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            disabled={registrations.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportText}
            disabled={registrations.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            Export Text
          </Button>
          <Button
            onClick={handleValidateAll}
            disabled={isValidating || stats.submitted === 0}
          >
            {isValidating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Validate All
          </Button>
        </div>
      </div>

      {/* Table */}
      {filteredRegistrations.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No registrations match the selected filter
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]"></TableHead>
                <TableHead>Player</TableHead>
                <TableHead>Faction</TableHead>
                <TableHead className="text-right">Points</TableHead>
                <TableHead className="text-right">SWC</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRegistrations.map((reg) => {
                const isExpanded = expandedRows.has(reg.id);
                const swc = reg.parsed?.units ? extractSWC(reg.parsed.units) : null;

                return (
                  <>
                    <TableRow key={reg.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell onClick={() => reg.army_list_code && toggleRow(reg.id)}>
                        {reg.army_list_code && (
                          <button className="p-1 hover:bg-muted rounded">
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </button>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{reg.user_name}</TableCell>
                      <TableCell>
                        {reg.parsed?.faction || reg.army_faction || (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {reg.parsed?.points !== undefined && reg.parsed?.points !== null ? (
                          <span
                            className={
                              reg.parsed.points > pointLimit
                                ? 'text-destructive font-bold'
                                : ''
                            }
                          >
                            {reg.parsed.points}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {swc !== null ? (
                          <span
                            className={
                              swc > Math.ceil(pointLimit / 50)
                                ? 'text-destructive font-bold'
                                : ''
                            }
                          >
                            {swc}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(reg)}</TableCell>
                    </TableRow>

                    {/* Expanded Row */}
                    {isExpanded && reg.parsed && reg.validation && (
                      <TableRow>
                        <TableCell colSpan={6} className="bg-muted/20 p-4">
                          <ParsedListDisplay
                            parsed={reg.parsed}
                            validation={reg.validation}
                            pointLimit={pointLimit}
                            showUnits={true}
                            compact={false}
                          />
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
