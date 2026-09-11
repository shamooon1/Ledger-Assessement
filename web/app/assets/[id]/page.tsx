import { apiFetch } from '../../../lib/api';
import AssetDetailView from './AssetDetailView';
import Link from 'next/link';

export default async function AssetHistory({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Fetch asset list to locate this specific asset, plus history, reservations, workers
  const [allAssets, history, reservations, workers] = await Promise.all([
    apiFetch('/assets', { cache: 'no-store' }).catch(() => []),
    apiFetch(`/assets/${id}/history`, { cache: 'no-store' }).catch(() => []),
    apiFetch(`/reservations?assetId=${id}`, { cache: 'no-store' }).catch(() => []),
    apiFetch('/workers', { cache: 'no-store' }).catch(() => []),
  ]);

  const asset = (allAssets || []).find((a: any) => a._id === id);

  if (!asset) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-zinc-900">Asset Not Found</h2>
        <p className="text-sm text-zinc-500">
          The requested asset with ID {id} could not be located in the ledger.
        </p>
        <Link
          href="/"
          className="inline-block px-4 py-2 bg-zinc-900 text-white text-xs font-medium rounded-lg"
        >
          Return to Store Overview
        </Link>
      </div>
    );
  }

  return (
    <AssetDetailView
      asset={asset}
      history={history || []}
      reservations={reservations || []}
      workers={workers || []}
    />
  );
}
