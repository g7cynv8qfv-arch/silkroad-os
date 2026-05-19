'use client';

import * as React from 'react';
import { useRouter } from '@/lib/i18n/navigation';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { deleteSupplier } from '../actions';

interface DeleteSupplierButtonProps {
  supplierId: string;
  supplierName: string;
}

export function DeleteSupplierButton({ supplierId, supplierName }: DeleteSupplierButtonProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  async function handleDelete() {
    setIsDeleting(true);
    try {
      const result = await deleteSupplier(supplierId);
      if (result.success) {
        toast.success(`${supplierName} supprimé`);
        router.push('/suppliers');
      } else {
        toast.error(result.error);
        setIsDeleting(false);
      }
    } catch {
      toast.error('Une erreur est survenue');
      setIsDeleting(false);
    }
  }

  return (
    <>
      <Button variant="danger" size="sm" onClick={() => setOpen(true)}>
        <Trash2 className="h-3.5 w-3.5" />
        Supprimer
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Supprimer le fournisseur</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer{' '}
              <span className="font-medium text-foreground">{supplierName}</span> ? Cette action est
              irréversible et supprimera toutes les données associées (contacts, produits,
              commandes…).
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button variant="ghost" disabled={isDeleting}>
                Annuler
              </Button>
            </DialogClose>
            <Button variant="danger" loading={isDeleting} onClick={handleDelete}>
              {isDeleting ? 'Suppression…' : 'Supprimer définitivement'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
