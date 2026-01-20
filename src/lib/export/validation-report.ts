interface ValidationReportRow {
  playerName: string;
  faction: string | null;
  points: number | null;
  swc: number | null;
  status: 'valid' | 'invalid' | 'not_submitted';
  errors: string[];
}

/**
 * Export validation report as CSV
 */
export function exportValidationCSV(
  tournamentName: string,
  rows: ValidationReportRow[]
): string {
  // CSV headers
  const headers = ['Player', 'Faction', 'Points', 'SWC', 'Status', 'Errors'];

  // Convert rows to CSV format
  const csvRows = rows.map((row) => {
    const fields = [
      row.playerName,
      row.faction || '-',
      row.points !== null ? row.points.toString() : '-',
      row.swc !== null ? row.swc.toString() : '-',
      row.status.replace('_', ' '),
      row.errors.length > 0 ? row.errors.join('; ') : 'None',
    ];

    // Escape fields that contain commas or quotes
    return fields.map((field) => {
      if (field.includes(',') || field.includes('"') || field.includes('\n')) {
        return `"${field.replace(/"/g, '""')}"`;
      }
      return field;
    }).join(',');
  });

  // Combine headers and rows
  return [headers.join(','), ...csvRows].join('\n');
}

/**
 * Export validation report as plain text summary
 * Good for Discord/email
 */
export function exportValidationText(
  tournamentName: string,
  rows: ValidationReportRow[]
): string {
  const lines: string[] = [];

  // Title
  lines.push(`Army List Validation Report: ${tournamentName}`);
  lines.push('='.repeat(60));
  lines.push('');

  // Summary stats
  const totalPlayers = rows.length;
  const validLists = rows.filter((r) => r.status === 'valid').length;
  const invalidLists = rows.filter((r) => r.status === 'invalid').length;
  const notSubmitted = rows.filter((r) => r.status === 'not_submitted').length;

  lines.push('Summary:');
  lines.push(`  Total Players: ${totalPlayers}`);
  lines.push(`  Valid Lists: ${validLists}`);
  lines.push(`  Invalid Lists: ${invalidLists}`);
  lines.push(`  Not Submitted: ${notSubmitted}`);
  lines.push('');

  // Invalid lists
  if (invalidLists > 0) {
    lines.push('Invalid Lists:');
    lines.push('-'.repeat(60));
    rows
      .filter((r) => r.status === 'invalid')
      .forEach((row) => {
        lines.push(`  ${row.playerName}`);
        lines.push(`    Faction: ${row.faction || '-'}`);
        lines.push(`    Points: ${row.points !== null ? row.points : '-'}`);
        lines.push(`    SWC: ${row.swc !== null ? row.swc : '-'}`);
        if (row.errors.length > 0) {
          lines.push(`    Errors:`);
          row.errors.forEach((err) => {
            lines.push(`      - ${err}`);
          });
        }
        lines.push('');
      });
  }

  // Not submitted
  if (notSubmitted > 0) {
    lines.push('Not Submitted:');
    lines.push('-'.repeat(60));
    rows
      .filter((r) => r.status === 'not_submitted')
      .forEach((row) => {
        lines.push(`  - ${row.playerName}`);
      });
    lines.push('');
  }

  // Valid lists
  if (validLists > 0) {
    lines.push('Valid Lists:');
    lines.push('-'.repeat(60));
    rows
      .filter((r) => r.status === 'valid')
      .forEach((row) => {
        lines.push(`  ${row.playerName} - ${row.faction || '-'} (${row.points} pts, ${row.swc} SWC)`);
      });
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Trigger browser download of content
 */
export function downloadAsFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
