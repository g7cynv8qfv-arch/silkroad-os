'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { FileSpreadsheet, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { importRowSchema } from '../schemas';
import { importSuppliers } from '../actions';
import type { ImportRow, ImportRowResult } from '../types';

type ImportStep = 'upload' | 'preview' | 'done';

interface ParsedRow {
  rowNum: number;
  raw: Record<string, unknown>;
  parsed: ImportRow | null;
  errors: string[];
}

interface SupplierImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EXPECTED_COLUMNS = [
  'name',
  'country',
  'city',
  'websiteUrl',
  'mainCategory',
  'rating',
  'notes',
] as const;

function normalizeHeader(h: string): string {
  return h
    .toLowerCase()
    .replace(/[\s_-]/g, '')
    .replace('website', 'websiteurl')
    .replace('category', 'maincategory');
}

function mapHeaders(rawHeaders: string[]): Record<string, number> {
  const map: Record<string, number> = {};
  rawHeaders.forEach((h, i) => {
    const norm = normalizeHeader(h);
    for (const col of EXPECTED_COLUMNS) {
      if (norm === normalizeHeader(col)) {
        map[col] = i;
      }
    }
  });
  return map;
}

export function SupplierImportModal({ open, onOpenChange }: SupplierImportModalProps) {
  const t = useTranslations('suppliers.import');
  const [step, setStep] = React.useState<ImportStep>('upload');
  const [parsedRows, setParsedRows] = React.useState<ParsedRow[]>([]);
  const [importResults, setImportResults] = React.useState<ImportRowResult[]>([]);
  const [isImporting, setIsImporting] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const validRows = parsedRows.filter((r) => r.parsed !== null);
  const invalidRows = parsedRows.filter((r) => r.parsed === null);

  async function parseFile(file: File) {
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast.error(t('errors.invalidFormat'));
      return;
    }

    try {
      const XLSX = await import('xlsx');
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array' });
      const sheetName = wb.SheetNames[0];
      if (!sheetName) {
        toast.error(t('errors.noData'));
        return;
      }
      const ws = wb.Sheets[sheetName];
      if (!ws) {
        toast.error(t('errors.noData'));
        return;
      }
      const raw = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1 }) as unknown[][];

      const headers = (raw[0] as string[]).map(String);
      const headerMap = mapHeaders(headers);
      const dataRows = raw
        .slice(1)
        .filter((r) => (r as unknown[]).some((c) => c !== null && c !== ''));

      if (dataRows.length === 0) {
        toast.error(t('errors.noData'));
        return;
      }

      const rows: ParsedRow[] = dataRows.map((rawRow, i) => {
        const obj: Record<string, unknown> = {};
        for (const col of EXPECTED_COLUMNS) {
          const idx = headerMap[col];
          if (idx !== undefined) {
            obj[col] = (rawRow as unknown[])[idx];
          }
        }

        const result = importRowSchema.safeParse(obj);
        if (result.success) {
          return { rowNum: i + 2, raw: obj, parsed: result.data, errors: [] as string[] };
        }
        return {
          rowNum: i + 2,
          raw: obj,
          parsed: null as null,
          errors: result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
        };
      });

      setParsedRows(rows);
      setStep('preview');
    } catch {
      toast.error(t('errors.generic'));
    }
  }

  function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (file) parseFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }

  async function handleImport() {
    const rows = validRows
      .map((r) => r.parsed)
      .filter((r): r is NonNullable<typeof r> => r !== null);
    setIsImporting(true);
    try {
      const result = await importSuppliers(rows);
      if (result.success) {
        setImportResults(result.data.results);
        setStep('done');
        toast.success(t('success', { count: result.data.imported }));
      } else {
        toast.error(result.error);
      }
    } finally {
      setIsImporting(false);
    }
  }

  function handleClose() {
    setStep('upload');
    setParsedRows([]);
    setImportResults([]);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>

        {step === 'upload' && (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed py-12 transition-colors ${
              isDragging
                ? 'border-accent bg-accent/5'
                : 'border-border hover:border-accent/50 hover:bg-surface-1'
            }`}
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-surface-2">
              <FileSpreadsheet className="h-7 w-7 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">{t('step1.dropzone')}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t('step1.accepts')}</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Badge variant="success" className="gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {t('step3.validRows', { count: validRows.length })}
              </Badge>
              {invalidRows.length > 0 && (
                <Badge variant="danger" className="gap-1.5">
                  <XCircle className="h-3.5 w-3.5" />
                  {t('step3.invalidRows', { count: invalidRows.length })}
                </Badge>
              )}
            </div>

            <div className="max-h-64 overflow-y-auto rounded-lg border border-border">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-surface-1">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold text-muted-foreground">#</th>
                    <th className="px-3 py-2 text-left font-semibold text-muted-foreground">
                      Name
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-muted-foreground">
                      Country
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-muted-foreground">
                      Category
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-muted-foreground">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {parsedRows.map((row) => (
                    <tr key={row.rowNum} className={row.parsed ? '' : 'bg-danger/5'}>
                      <td className="px-3 py-2 font-mono text-muted-foreground">{row.rowNum}</td>
                      <td className="px-3 py-2 font-medium">{String(row.raw['name'] ?? '')}</td>
                      <td className="px-3 py-2">{String(row.raw['country'] ?? 'CN')}</td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {String(row.raw['mainCategory'] ?? '')}
                      </td>
                      <td className="px-3 py-2">
                        {row.parsed ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                        ) : (
                          <span className="flex items-center gap-1 text-danger">
                            <AlertCircle className="h-3.5 w-3.5" />
                            {row.errors[0]}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {step === 'done' && (
          <div className="flex flex-col items-center gap-3 py-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success/15">
              <CheckCircle2 className="h-7 w-7 text-success" />
            </div>
            <p className="text-base font-semibold text-foreground">
              {t('success', { count: importResults.filter((r) => r.success).length })}
            </p>
          </div>
        )}

        <DialogFooter>
          {step === 'upload' && (
            <Button variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
          )}
          {step === 'preview' && (
            <>
              <Button variant="ghost" onClick={() => setStep('upload')}>
                Back
              </Button>
              <Button
                onClick={handleImport}
                loading={isImporting}
                disabled={validRows.length === 0}
              >
                {isImporting
                  ? t('step3.importing')
                  : t('step3.import', { count: validRows.length })}
              </Button>
            </>
          )}
          {step === 'done' && <Button onClick={handleClose}>Done</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
