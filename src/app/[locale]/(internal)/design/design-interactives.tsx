'use client';

import * as React from 'react';
import {
  Settings,
  LogOut,
  User,
  HelpCircle,
  LayoutDashboard,
  Building2,
  FileText,
} from 'lucide-react';
import { toast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuShortcut,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableSkeleton,
  type SortDirection,
} from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  CommandPalette,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  useCommandPalette,
} from '@/components/ui/command-palette';
import { Badge } from '@/components/ui/badge';

const SUPPLIERS = [
  { name: 'Shenzhen Tech Co.', country: 'CN', status: 'active', orders: 12, risk: 3.2 },
  { name: 'Guangzhou Mfg Ltd', country: 'CN', status: 'active', orders: 7, risk: 5.8 },
  { name: 'Shanghai Parts Inc.', country: 'CN', status: 'pending', orders: 0, risk: null },
  { name: 'Dongguan Precision', country: 'CN', status: 'active', orders: 24, risk: 2.1 },
];

export function DesignInteractives() {
  const [sortKey, setSortKey] = React.useState<string | null>(null);
  const [sortDir, setSortDir] = React.useState<SortDirection>(null);
  const [tableLoading, setTableLoading] = React.useState(false);
  const { open: cmdOpen, setOpen: setCmdOpen } = useCommandPalette();

  function handleSort(key: string) {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir('asc');
    } else if (sortDir === 'asc') {
      setSortDir('desc');
    } else {
      setSortKey(null);
      setSortDir(null);
    }
  }

  const sorted = [...SUPPLIERS].sort((a, b) => {
    if (!sortKey || !sortDir) return 0;
    const av = a[sortKey as keyof typeof a] ?? '';
    const bv = b[sortKey as keyof typeof b] ?? '';
    const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
    return sortDir === 'asc' ? cmp : -cmp;
  });

  return (
    <>
      {/* ── Tabs ──────────────────────────────────────────────────────── */}
      <section>
        <SectionLabel>Tabs</SectionLabel>
        <Tabs defaultValue="suppliers">
          <TabsList>
            <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
          </TabsList>
          <TabsContent value="suppliers" className="pt-4 text-sm text-muted-foreground">
            Manage your supplier relationships here.
          </TabsContent>
          <TabsContent value="orders" className="pt-4 text-sm text-muted-foreground">
            Track all purchase orders and shipments.
          </TabsContent>
          <TabsContent value="invoices" className="pt-4 text-sm text-muted-foreground">
            Invoices and payment tracking.
          </TabsContent>
        </Tabs>
      </section>

      {/* ── Table ─────────────────────────────────────────────────────── */}
      <section>
        <SectionLabel>Table (sortable + skeleton)</SectionLabel>
        <div className="mb-3 flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setTableLoading(true);
              setTimeout(() => setTableLoading(false), 1500);
            }}
          >
            Simulate loading
          </Button>
        </div>
        {tableLoading ? (
          <TableSkeleton rows={4} cols={5} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  sortable
                  sortDirection={sortKey === 'name' ? sortDir : null}
                  onSort={() => handleSort('name')}
                >
                  Supplier
                </TableHead>
                <TableHead>Country</TableHead>
                <TableHead
                  sortable
                  sortDirection={sortKey === 'orders' ? sortDir : null}
                  onSort={() => handleSort('orders')}
                >
                  Orders
                </TableHead>
                <TableHead
                  sortable
                  sortDirection={sortKey === 'risk' ? sortDir : null}
                  onSort={() => handleSort('risk')}
                >
                  Risk
                </TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((row) => (
                <TableRow key={row.name}>
                  <TableCell className="font-medium">{row.name}</TableCell>
                  <TableCell className="font-mono text-xs">{row.country}</TableCell>
                  <TableCell data-mono>{row.orders}</TableCell>
                  <TableCell>
                    {row.risk !== null ? (
                      <span data-mono className={row.risk < 4 ? 'text-success' : 'text-warning'}>
                        {row.risk.toFixed(1)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={row.status === 'active' ? 'success' : 'warning'}>
                      {row.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>

      {/* ── Overlays ──────────────────────────────────────────────────── */}
      <section>
        <SectionLabel>Dialog · Sheet · Popover · DropdownMenu · Tooltip</SectionLabel>
        <TooltipProvider>
          <div className="flex flex-wrap items-center gap-3">
            {/* Dialog */}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">Open Dialog</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirm Action</DialogTitle>
                  <DialogDescription>
                    This action cannot be undone. The supplier record will be permanently deleted.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline">Cancel</Button>
                  <Button variant="danger">Delete</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Sheet */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline">Open Sheet</Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Supplier Details</SheetTitle>
                  <SheetDescription>View and edit supplier information.</SheetDescription>
                </SheetHeader>
              </SheetContent>
            </Sheet>

            {/* Popover */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">Open Popover</Button>
              </PopoverTrigger>
              <PopoverContent className="w-64">
                <p className="text-sm font-semibold">Quick Actions</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Select an action for this supplier.
                </p>
              </PopoverContent>
            </Popover>

            {/* Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Settings className="h-4 w-4" /> Options
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="h-4 w-4" /> Profile
                  <DropdownMenuShortcut>⌘P</DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="h-4 w-4" /> Settings
                  <DropdownMenuShortcut>⌘,</DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-danger focus:bg-danger/10 focus:text-danger">
                  <LogOut className="h-4 w-4" /> Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Tooltip */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Help">
                  <HelpCircle className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Keyboard shortcut: ⌘K to open command palette</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </section>

      {/* ── Toast ─────────────────────────────────────────────────────── */}
      <section>
        <SectionLabel>Toast</SectionLabel>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" onClick={() => toast('Supplier saved successfully.')}>
            Default
          </Button>
          <Button variant="outline" onClick={() => toast.success('Supplier verified.')}>
            Success
          </Button>
          <Button variant="outline" onClick={() => toast.warning('Lead time increased by 5 days.')}>
            Warning
          </Button>
          <Button variant="outline" onClick={() => toast.error('Failed to sync with ERP.')}>
            Error
          </Button>
          <Button variant="outline" onClick={() => toast.info('3 new RFQ responses received.')}>
            Info
          </Button>
        </div>
      </section>

      {/* ── Command Palette ───────────────────────────────────────────── */}
      <section>
        <SectionLabel>CommandPalette (⌘K)</SectionLabel>
        <Button variant="outline" onClick={() => setCmdOpen(true)}>
          Open Command Palette
          <kbd className="ml-2 rounded border border-border bg-surface-2 px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
            ⌘K
          </kbd>
        </Button>
        <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} placeholder="Search commands…">
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Navigation">
              <CommandItem onSelect={() => setCmdOpen(false)}>
                <LayoutDashboard className="h-4 w-4" /> Dashboard
                <CommandShortcut>⌘D</CommandShortcut>
              </CommandItem>
              <CommandItem onSelect={() => setCmdOpen(false)}>
                <Building2 className="h-4 w-4" /> Suppliers
              </CommandItem>
              <CommandItem onSelect={() => setCmdOpen(false)}>
                <FileText className="h-4 w-4" /> Invoices
              </CommandItem>
            </CommandGroup>
            <CommandGroup heading="Actions">
              <CommandItem
                onSelect={() => {
                  setCmdOpen(false);
                  toast.success('New supplier form opened.');
                }}
              >
                Add Supplier
              </CommandItem>
              <CommandItem
                onSelect={() => {
                  setCmdOpen(false);
                  toast.success('New order form opened.');
                }}
              >
                Create Order
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </CommandPalette>
      </section>
    </>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-6 flex items-center gap-3">
      <p className="font-mono text-xs font-semibold uppercase tracking-widest text-accent">
        {children}
      </p>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}
