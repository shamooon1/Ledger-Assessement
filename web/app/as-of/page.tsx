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
    Promise.all([
      apiFetch('/assets').catch(() => []),
      apiFetch('/workers').catch(() => []),
    ]).then(([assetsData, workersData]) => {
      setAssets(assetsData || []);
      setWorkers(workersData || []);
    });
  }, []);

  const toLocalIso = (date: Date) => {
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
  };

  const setPreset = (hoursOffset: number) => {
    const target = new Date();
    target.setHours(target.getHours() - hoursOffset);
    setInstant(toLocalIso(target));
  };

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
      setError(err.message || 'Query execution failed');
    } finally {
      setLoading(false);
    }
  };

  const workerMap = new Map<string, string>();
  workers.forEach((w) => workerMap.set(w._id, w.name));

  const assetMap = new Map<string, any>();
  assets.forEach((a) => assetMap.set(a._id, a));

  const getWorkerName = (holder: any) => {
    if (!holder || holder === 'unheld') return 'Unheld (In Store)';
    if (typeof holder === 'object' && holder.name) return holder.name;
    return workerMap.get(holder) || holder;
  };

  const getAssetDetails = (id: string) => {
    return assetMap.get(id) || { code: id, kind: 'Unknown' };
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back Link */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          ← Back to Store Overview
        </Link>
      </div>

      {/* Header */}
      <div className="border-b border-zinc-200 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
          Point-in-Time Reconstruction
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Answer: <span className="italic">"Who held what at 14:20 last Tuesday?"</span> Reconstruct
          the exact custody state of any asset at any historical instant from the ledger.
        </p>
      </div>

      {/* Query Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white border border-zinc-200 rounded-xl p-6 shadow-xs space-y-4"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Instant Input */}
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1.5">
              Historical Instant (UTC / Local)
            </label>
            <input
              type="datetime-local"
              value={instant}
              onChange={(e) => setInstant(e.target.value)}
              required
              className="w-full bg-white border border-zinc-300 rounded-lg p-2.5 text-sm text-zinc-900 focus:outline-none focus:border-zinc-900 shadow-xs"
            />

            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className="text-[11px] font-mono text-zinc-400 mr-1">Presets:</span>
              <button
                type="button"
                onClick={() => setPreset(0)}
                className="px-2 py-0.5 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-[11px] font-mono cursor-pointer"
              >
                Now
              </button>
              <button
                type="button"
                onClick={() => setPreset(1)}
                className="px-2 py-0.5 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-[11px] font-mono cursor-pointer"
              >
                1h ago
              </button>
              <button
                type="button"
                onClick={() => setPreset(24)}
                className="px-2 py-0.5 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-[11px] font-mono cursor-pointer"
              >
                24h ago
              </button>
              <button
                type="button"
                onClick={() => setPreset(24 * 7)}
                className="px-2 py-0.5 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-[11px] font-mono cursor-pointer"
              >
                7d ago
              </button>
              <button
                type="button"
                onClick={() => setPreset(24 * 15)}
                className="px-2 py-0.5 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-[11px] font-mono cursor-pointer"
              >
                15d ago
              </button>
              <button
                type="button"
                onClick={() => setPreset(24 * 28)}
                className="px-2 py-0.5 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-[11px] font-mono cursor-pointer"
              >
                28d ago
              </button>
            </div>
          </div>

          {/* Asset Select */}
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1.5">
              Target Asset Scope
            </label>
            <select
              value={assetId}
              onChange={(e) => setAssetId(e.target.value)}
              className="w-full bg-white border border-zinc-300 rounded-lg p-2.5 text-sm text-zinc-900 focus:outline-none focus:border-zinc-900 shadow-xs"
            >
              <option value="">All Assets (Full Store Scan)</option>
              {assets.map((a) => (
                <option key={a._id} value={a._id}>
                  {a.code} — {a.kind}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
            {error}
          </div>
        )}

        <div className="flex justify-end pt-2 border-t border-zinc-100">
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium rounded-lg transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Reconstructing Ledger State...' : 'Execute Reconstruction Query'}
          </button>
        </div>
      </form>

      {/* Results Section */}
      {results && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-zinc-900">
              Reconstructed Ledger State
            </h2>
            <span className="text-xs font-mono text-zinc-500">
              {results.length} record{results.length === 1 ? '' : 's'} identified
            </span>
          </div>

          <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50/75 text-zinc-500 font-mono text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-4 font-semibold">Asset Code</th>
                  <th className="py-3 px-4 font-semibold">Kind</th>
                  <th className="py-3 px-4 font-semibold">Status at Instant</th>
                  <th className="py-3 px-4 font-semibold">Holder at Instant</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {results.map((r, i) => {
                  const assetDetails = getAssetDetails(r.assetId);
                  const isHeld = r.holder && r.holder !== 'unheld';

                  return (
                    <tr key={i} className="hover:bg-zinc-50/75 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-zinc-900">
                        <Link
                          href={`/assets/${r.assetId}`}
                          className="hover:underline hover:text-blue-600"
                        >
                          {assetDetails.code}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-zinc-600">{assetDetails.kind}</td>
                      <td className="py-3 px-4">
                        {isHeld ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-900 border border-amber-200/60">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            Issued
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-900 border border-emerald-200/60">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            In Store
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-zinc-900 font-medium">
                        {getWorkerName(r.holder)}
                      </td>
                    </tr>
                  );
                })}

                {results.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-zinc-400 text-sm">
                      No assets found held at the requested instant.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
