import { getCurrentOrg } from '@/lib/auth';

export default async function DashboardPage() {
  const { orgId, role } = await getCurrentOrg();

  return (
    <main className="py-6">
      <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Org: <code className="font-mono">{orgId}</code> · Role:{' '}
        <code className="font-mono">{role}</code>
      </p>
    </main>
  );
}
