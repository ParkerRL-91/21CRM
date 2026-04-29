---
title: CSV export on renewal dashboard
id: TASK-128
project: PRJ-006
status: ready
priority: P1
tier: 2
effort: 1 day
created: 2026-04-29
updated: 2026-04-29
dependencies: []
tags: [cpq, csv, export, renewal-dashboard, reporting, confidence-builder]
---

# TASK-128 — CSV Export on Renewal Dashboard

## Context

The renewal dashboard shows valuable data — renewal dates, risk scores, contract values — but Dana Chen cannot get the data out. She said: "I need to paste this into my Monday forecast deck. There's no CSV export, no 'copy table' button, nothing."

The `CpqHealthDashboard` component shows metrics cards and a pipeline breakdown chart. The renewal dashboard (referenced in the review) shows a table of renewals with risk scores. Neither has any export functionality.

## User Stories

**As Dana (VP RevOps)**, I want to export the renewal table as a CSV file, so that I can paste the data into my Monday forecast deck for the leadership team.

**As Raj (Deal Desk Specialist)**, I want to export filtered renewal data (e.g., only "Critical" risk accounts), so that I can create targeted outreach lists.

**As Jordan (CRM Admin)**, I want a "Copy to Clipboard" option for quick table data transfer to spreadsheets and Slack.

## Outcomes

- "Export CSV" button visible on the renewal dashboard
- Clicking it downloads a .csv file containing the currently displayed/filtered table data
- The CSV includes all visible columns: account name, renewal date, contract value, risk score, risk level, days until renewal
- A "Copy Table" button copies the table data to clipboard in tab-separated format
- Export respects any active filters (if filtered to "Critical" risk, only critical rows export)
- CSV file has a descriptive filename: `renewals-{date}-{filter}.csv`

## Success Metrics

- [ ] "Export CSV" button visible on renewal dashboard
- [ ] Button downloads a .csv file on click
- [ ] CSV contains headers matching table columns
- [ ] CSV contains all currently visible/filtered rows
- [ ] CSV filename includes date and filter info
- [ ] "Copy Table" button copies data to clipboard
- [ ] Export respects active risk filter
- [ ] CSV opens correctly in Excel/Google Sheets
- [ ] Numbers are not quoted (so they parse as numbers in spreadsheets)
- [ ] Unit tests pass for CSV generation and download

## Implementation Plan

### Step 1: Create a CSV utility function

Create `packages/twenty-front/src/modules/cpq/utils/cpq-csv-export.ts`:

```typescript
type CsvColumn<TRow> = {
  header: string;
  accessor: (row: TRow) => string | number;
};

export const generateCsv = <TRow>(
  rows: TRow[],
  columns: CsvColumn<TRow>[],
): string => {
  const header = columns.map(c => c.header).join(',');
  const dataRows = rows.map(row =>
    columns.map(col => {
      const val = col.accessor(row);
      // Quote strings that contain commas
      if (typeof val === 'string' && val.includes(',')) {
        return `"${val}"`;
      }
      return String(val);
    }).join(',')
  );
  return [header, ...dataRows].join('\n');
};

export const downloadCsv = (csvContent: string, filename: string): void => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

export const copyTableToClipboard = <TRow>(
  rows: TRow[],
  columns: CsvColumn<TRow>[],
): Promise<void> => {
  const header = columns.map(c => c.header).join('\t');
  const dataRows = rows.map(row =>
    columns.map(col => String(col.accessor(row))).join('\t')
  );
  const text = [header, ...dataRows].join('\n');
  return navigator.clipboard.writeText(text);
};
```

### Step 2: Create the CpqExportBar component

Create `packages/twenty-front/src/modules/cpq/components/CpqExportBar.tsx`:

A small toolbar with "Export CSV" and "Copy Table" buttons. Reusable across CPQ tables.

```typescript
type CpqExportBarProps = {
  onExportCsv: () => void;
  onCopyTable: () => void;
  rowCount: number;
  filterLabel?: string;
};
```

Renders:
- Row count badge: "47 renewals" or "12 critical renewals"
- "Export CSV" button with download icon
- "Copy Table" button with clipboard icon
- Success feedback after copy ("Copied!") using a brief inline state change

### Step 3: Integrate into renewal dashboard

The renewal dashboard table needs the export bar. If the renewal dashboard doesn't exist as a standalone component yet (it may be part of `CpqHealthDashboard` or a separate page), create or modify the appropriate file.

Look for the renewal table component and add:
- Import `CpqExportBar`, `generateCsv`, `downloadCsv`, `copyTableToClipboard`
- Add `<CpqExportBar>` above the renewals table
- Define column mappings for CSV:
  ```typescript
  const RENEWAL_CSV_COLUMNS = [
    { header: 'Account', accessor: (r) => r.accountName },
    { header: 'Renewal Date', accessor: (r) => r.renewalDate },
    { header: 'Contract Value', accessor: (r) => r.contractValue },
    { header: 'Risk Score', accessor: (r) => r.riskScore },
    { header: 'Risk Level', accessor: (r) => r.riskLevel },
    { header: 'Days Until Renewal', accessor: (r) => r.daysUntilRenewal },
  ];
  ```
- Handle export click: `downloadCsv(generateCsv(filteredRows, columns), filename)`
- Generate filename: `renewals-${new Date().toISOString().split('T')[0]}-${activeFilter || 'all'}.csv`

### Step 4: Add export to CpqHealthDashboard metrics

Also add a "Copy Metrics" button to `CpqHealthDashboard.tsx` that copies the metric values as a formatted table — useful for pasting into Slack or reports.

## Files to Change

- **Create**: `packages/twenty-front/src/modules/cpq/utils/cpq-csv-export.ts`
- **Create**: `packages/twenty-front/src/modules/cpq/components/CpqExportBar.tsx`
- **Modify**: The renewal dashboard component (identify the correct file — likely a page or component rendering the renewal table)
- **Modify**: `packages/twenty-front/src/modules/cpq/components/CpqHealthDashboard.tsx` — add copy metrics button
- **Modify**: `packages/twenty-front/src/modules/cpq/index.ts` — add exports

## Tests to Write

### Unit tests: `packages/twenty-front/src/modules/cpq/utils/__tests__/cpq-csv-export.test.ts`

- `should generate CSV with headers`
- `should generate CSV with data rows`
- `should quote strings containing commas`
- `should handle empty rows array`
- `should handle numeric values without quotes`
- `should generate tab-separated text for clipboard`

### Unit tests: `packages/twenty-front/src/modules/cpq/components/__tests__/CpqExportBar.test.tsx`

- `should render row count`
- `should call onExportCsv when export button clicked`
- `should call onCopyTable when copy button clicked`
- `should show filter label when provided`
- `should show "Copied!" feedback after copy`

## Status Log

_(empty — to be filled during execution)_

## Takeaways

_(empty — to be filled after completion)_
