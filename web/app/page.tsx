import { apiFetch } from '../lib/api';
import AssetRow from './AssetRow';

export default async function StoreOverview() {
  const assets = await apiFetch('/assets', { cache: 'no-store' });
  const workers = await apiFetch('/workers', { cache: 'no-store' });

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Store Overview</h1>
      <div className="flex gap-4 mb-4">
        <a href="/as-of" className="text-blue-600 hover:underline">Point-in-time Query</a>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse bg-white shadow-sm rounded-lg overflow-hidden">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 border-b font-semibold">Code</th>
              <th className="p-3 border-b font-semibold">Kind</th>
              <th className="p-3 border-b font-semibold">Status</th>
              <th className="p-3 border-b font-semibold">Holder</th>
              <th className="p-3 border-b font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {assets && assets.map((asset: any) => (
              <AssetRow key={asset._id} asset={asset} workers={workers} />
            ))}
            {(!assets || assets.length === 0) && (
              <tr>
                <td colSpan={5} className="p-4 text-center text-gray-500">No assets found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
