'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import {
  FileText,
  ImageIcon,
  BookOpen,
  FileQuestion,
  Upload,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import type { SupplierAttachment } from '@prisma/client';

type AttachmentWithUploader = SupplierAttachment & {
  uploadedBy: { firstName: string | null; lastName: string | null } | null;
};

interface TabDocumentsProps {
  initialAttachments: AttachmentWithUploader[];
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  CATALOG: BookOpen,
  CERTIFICATE: FileText,
  PHOTO: ImageIcon,
  OTHER: FileQuestion,
};

const TYPE_COLORS: Record<string, string> = {
  CATALOG: 'text-info',
  CERTIFICATE: 'text-success',
  PHOTO: 'text-accent',
  OTHER: 'text-muted-foreground',
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function TabDocuments({ initialAttachments }: TabDocumentsProps) {
  const t = useTranslations('suppliers.detail.documents');
  const [attachments] = React.useState(initialAttachments);
  const [isDragging, setIsDragging] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    toast.info('File upload requires UploadThing integration — coming soon.');
  }

  function handleFileChange() {
    toast.info('File upload requires UploadThing integration — coming soon.');
  }

  function handleDelete(_id: string) {
    toast.info('Delete requires UploadThing integration — coming soon.');
  }

  if (attachments.length === 0) {
    return (
      <div className="space-y-4">
        <DropZone
          isDragging={isDragging}
          setIsDragging={setIsDragging}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          label={t('dropHere')}
        />
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileChange}
          multiple
        />
        <EmptyState
          icon={FileQuestion}
          title={t('empty.title')}
          description={t('empty.description')}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()}>
          <Upload className="h-3.5 w-3.5" />
          {t('upload')}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileChange}
          multiple
        />
      </div>

      <DropZone
        isDragging={isDragging}
        setIsDragging={setIsDragging}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        label={t('dropHere')}
        compact
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {attachments.map((att) => {
          const Icon = TYPE_ICONS[att.type] ?? FileQuestion;
          const color = TYPE_COLORS[att.type] ?? 'text-muted-foreground';

          return (
            <div
              key={att.id}
              className="group flex items-start gap-3 rounded-lg border border-border bg-surface-1 p-3 transition-colors hover:border-accent/40"
            >
              <div className={`mt-0.5 shrink-0 ${color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{att.filename}</p>
                <div className="mt-0.5 flex items-center gap-1.5">
                  <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                    {att.type}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatBytes(att.sizeBytes)}
                  </span>
                </div>
                {att.uploadedBy && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {att.uploadedBy.firstName} {att.uploadedBy.lastName}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <a
                  href={att.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded p-1 text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground"
                  aria-label="Open document"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
                <button
                  onClick={() => handleDelete(att.id)}
                  className="rounded p-1 text-muted-foreground transition-colors hover:bg-danger/10 hover:text-danger"
                  aria-label="Delete document"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DropZone({
  isDragging,
  setIsDragging,
  onDrop,
  onClick,
  label,
  compact = false,
}: {
  isDragging: boolean;
  setIsDragging: (v: boolean) => void;
  onDrop: (e: React.DragEvent) => void;
  onClick: () => void;
  label: string;
  compact?: boolean;
}) {
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={onDrop}
      onClick={onClick}
      className={`flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed transition-colors ${
        compact ? 'py-4' : 'py-10'
      } ${isDragging ? 'border-accent bg-accent/5' : 'border-border hover:border-accent/50 hover:bg-surface-1'}`}
    >
      <Upload className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
  );
}
