import { notFound } from 'next/navigation';
import { PackageOpen, Building2, LayoutDashboard, Bell, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { FormField } from '@/components/ui/form-field';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { ThemeToggle } from '@/components/shell/theme-toggle';
import { DesignInteractives } from './design-interactives';

export default function DesignPage() {
  if (process.env['NODE_ENV'] !== 'development') notFound();
  return (
    <div className="min-h-screen bg-background font-sans">
      {/* Sticky header */}
      <header className="sticky top-0 z-40 border-b border-border bg-surface-1/80 backdrop-blur-sm">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-semibold text-foreground">SilkRoute OS</span>
            <Badge variant="secondary">Design System</Badge>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="container space-y-16 py-12">
        {/* ── Page Header ──────────────────────────────────────────────── */}
        <section>
          <SectionLabel>PageHeader</SectionLabel>
          <PageHeader
            title="Supplier Management"
            description="Manage your supplier relationships, track performance and assess risk."
            breadcrumbs={[{ label: 'Dashboard', href: '#' }, { label: 'Suppliers' }]}
            actions={
              <>
                <Button variant="outline" size="sm">
                  Export
                </Button>
                <Button size="sm">Add Supplier</Button>
              </>
            }
          />
        </section>

        {/* ── Stat Cards ───────────────────────────────────────────────── */}
        <section>
          <SectionLabel>StatCard</SectionLabel>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total Suppliers" value="142" delta={12} deltaLabel="vs last month" />
            <StatCard label="Active Orders" value="38" delta={-4} deltaLabel="vs last month" />
            <StatCard label="Revenue (USD)" value="$284,520" delta={0} deltaLabel="vs last month" />
            <StatCard label="Avg Lead Time" value="21d" delta={8} deltaLabel="vs last month" />
          </div>
        </section>

        {/* ── Buttons ──────────────────────────────────────────────────── */}
        <section>
          <SectionLabel>Button</SectionLabel>
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="danger">Danger</Button>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="sm">Small</Button>
              <Button size="md">Medium</Button>
              <Button size="lg">Large</Button>
              <Button size="icon" aria-label="Notifications">
                <Bell className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button loading>Loading…</Button>
              <Button disabled>Disabled</Button>
            </div>
          </div>
        </section>

        {/* ── Badges ───────────────────────────────────────────────────── */}
        <section>
          <SectionLabel>Badge</SectionLabel>
          <div className="flex flex-wrap items-center gap-2">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="success">Active</Badge>
            <Badge variant="warning">Pending</Badge>
            <Badge variant="danger">Overdue</Badge>
            <Badge variant="info">Info</Badge>
          </div>
        </section>

        {/* ── Avatar ───────────────────────────────────────────────────── */}
        <section>
          <SectionLabel>Avatar</SectionLabel>
          <div className="flex items-center gap-4">
            <Avatar size="sm">
              <AvatarImage src="https://github.com/shadcn.png" alt="User" />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
            <Avatar size="md">
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
            <Avatar size="lg">
              <AvatarFallback>AB</AvatarFallback>
            </Avatar>
          </div>
        </section>

        {/* ── Form ─────────────────────────────────────────────────────── */}
        <section>
          <SectionLabel>Form Fields</SectionLabel>
          <Card className="max-w-lg">
            <CardHeader>
              <CardTitle>Add Supplier</CardTitle>
              <CardDescription>Enter the supplier details below.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField label="Company Name" htmlFor="name" required>
                <Input id="name" placeholder="Shenzhen Tech Co., Ltd." />
              </FormField>
              <FormField
                label="Website"
                htmlFor="website"
                description="Optional — include https://"
              >
                <Input id="website" type="url" placeholder="https://example.com" />
              </FormField>
              <FormField
                label="Notes"
                htmlFor="notes"
                error="Notes are required before submission."
              >
                <Textarea id="notes" placeholder="Quality certifications, lead times…" />
              </FormField>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="verified"
                  className="h-4 w-4 rounded border-border accent-accent"
                />
                <Label htmlFor="verified">Mark as verified supplier</Label>
              </div>
            </CardContent>
            <CardFooter className="justify-end gap-2">
              <Button variant="outline">Cancel</Button>
              <Button>Save Supplier</Button>
            </CardFooter>
          </Card>
        </section>

        {/* ── Card ─────────────────────────────────────────────────────── */}
        <section>
          <SectionLabel>Card</SectionLabel>
          <div className="grid gap-4 sm:grid-cols-3">
            {['Supplier CRM', 'Orders & Logistics', 'AI Intelligence'].map((title, i) => (
              <Card key={title}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {i === 0 ? (
                      <Building2 className="h-5 w-5 text-accent" />
                    ) : i === 1 ? (
                      <PackageOpen className="h-5 w-5 text-accent" />
                    ) : (
                      <LayoutDashboard className="h-5 w-5 text-accent" />
                    )}
                    {title}
                  </CardTitle>
                  <CardDescription>Manage and track {title.toLowerCase()}.</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Lorem ipsum dolor sit amet consectetur adipisicing elit.
                  </p>
                </CardContent>
                <CardFooter>
                  <Button variant="ghost" size="sm" className="gap-1">
                    View all <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </section>

        {/* ── Skeleton ─────────────────────────────────────────────────── */}
        <section>
          <SectionLabel>Skeleton</SectionLabel>
          <div className="max-w-sm space-y-3">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </section>

        {/* ── Empty State ──────────────────────────────────────────────── */}
        <section>
          <SectionLabel>EmptyState</SectionLabel>
          <EmptyState
            icon={PackageOpen}
            title="No orders yet"
            description="Create your first purchase order to start tracking shipments and costs."
            action={<Button>Create Order</Button>}
          />
        </section>

        {/* ── Interactive components (client) ──────────────────────────── */}
        <DesignInteractives />
      </main>
    </div>
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
