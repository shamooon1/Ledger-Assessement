'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiFetch } from '../../lib/api';

export default function AsOfPage() {
  const [assets, setAssets] = useState<any[]>([]);
  const [workers, setWorkers] = useState<any[]>([]);
  const [instant, setInstant] = useState('');
  const [assetId, setAssetId] = useState('');
  const [results, setResults] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Fetch initial assets and workers for the dropdown and display mapping
    Promise.all([
      apiFetch('/assets'),
      apiFetch('/workers')
    ]).then(([assetsData, workersData]) => {
      setAssets(assetsData || []);
      setWorkers(workersData || []);
    }).catch(err => {
      console.error("Failed to load initial data", err);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResults(null);
    try {
      const query = new URLSearchParams();
      if (instant) query.append('instant', new Date(instant).toISOString());
      if (assetId) query.append('assetId', assetId);

      const res = await apiFetch(`/store/as-of?${query.toString()}`);
      setResults(res || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getWorkerName = (id: string) => {
    if (id === 'unheld') return 'Unheld';
    const worker = workers.find(w => w._id === id);
    return worker ? worker.name : id;
  };

  const getAssetCode = (id: string) => {
    const asset = assets.find(a => a._id === id);
    return asset ? asset.code : id;
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <Link href="/" className="text-blue-600 hover:underline">&larr; Back to Store</Link>
      </div>

      <h1 className="text-3xl font-bold mb-6">Point-in-Time Query</h1>

      <form onSubmit={handleSubmit} className="bg-white p-6 border rounded-lg shadow-sm mb-8 flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Instant</label>
            <input 
              type="datetime-local" 
              value={instant} 
              onChange={e => setInstant(e.target.value)} 
              required 
              className="w-full border border-gray-300 rounded p-2" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Asset</label>
            <select 
              value={assetId} 
              onChange={e => setAssetId(e.target.value)} 
              className="w-full border border-gray-300 rounded p-2"
            >
              <option value="">All Assets</option>
              {assets.map(a => <option key={a._id} value={a._id}>{a.code} ({a.kind})</option>)}
            </select>
          </div>
        </div>
        <div>
          <button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded transition-colors disabled:opacity-50">
            {loading ? 'Querying...' : 'Run Query'}
          </button>
        </div>
        {error && <div className="text-red-500 bg-red-50 p-3 rounded">{error}</div>}
      </form>

      {results && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Results</h2>
          {results.length === 0 ? (
            <p className="text-gray-500 italic">No assets held at this time.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse bg-white shadow-sm rounded-lg overflow-hidden">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-3 border-b font-semibold">Asset</th>
                    <th className="p-3 border-b font-semibold">Holder at Instant</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((res: any, i: number) => (
                    <tr key={i} className="border-b hover:bg-gray-50">
                      <td className="p-3">{getAssetCode(res.assetId)}</td>
                      <td className="p-3 font-medium">{getWorkerName(res.holder)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
