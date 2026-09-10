import { apiFetch } from '@/lib/api';

export default async function Page() {
  const assets = await apiFetch('/assets', { next: { revalidate: 0 } }).catch(() => []);

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">Store Overview</h1>
      <p>Total Assets: {assets.length}</p>
    </main>
  );
}
