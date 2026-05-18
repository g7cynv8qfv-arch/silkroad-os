'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SupplierImportModal } from './supplier-import-modal';

export function SupplierImportTrigger() {
  const t = useTranslations('suppliers.list');
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Upload className="h-4 w-4" />
        {t('importFromExcel')}
      </Button>
      <SupplierImportModal open={open} onOpenChange={setOpen} />
    </>
  );
}
