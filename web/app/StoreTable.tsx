'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiFetch, generateIdempotencyKey } from '../lib/api';

export default function StoreTable({
  initialAssets,
  workers,
}: {
  initialAssets: any[];
  workers: any[];
}) {
  const router = useRouter();

  // Search and filter states
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'in_store' | 'issued' | 'out_of_service'>('all');
  const [kindFilter, setKindFilter] = useState<string>('all');

  // Modal states
  const [issueModalAsset, setIssueModalAsset] = useState<any | null>(null);
  const [returnModalAsset, setReturnModalAsset] = useState<any | null>(null);

  // Form states
  const [workerId, setWorkerId] = useState('');
  const [occurredAt, setOccurredAt] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper for current local ISO string for datetime-local
  const getNowLocal = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - offset).toISOString().slice(0, 16);
  };

  // Kinds list
  const kinds = useMemo(() => {
    const set = new Set<string>();
    initialAssets.forEach((a) => a.kind && set.add(a.kind));
    return Array.from(set).sort();
  }, [initialAssets]);

  // Metrics
  const metrics = useMemo(() => {
    let inStore = 0;
    let issued = 0;
    let outOfService = 0;

    initialAssets.forEach((a) => {
      if (a.serviceStatus === 'out_of_service') {
        outOfService++;
      } else if (a.heldBy) {
        issued++;
      } else {
        inStore++;
      }
    });

    return {
      total: initialAssets.length,
      inStore,
      issued,
      outOfService,
    };
  }, [initialAssets]);

  // Filtered assets
  const filteredAssets = useMemo(() => {
    return initialAssets.filter((a) => {
      // Search filter
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesCode = a.code?.toLowerCase().includes(q);
        const matchesKind = a.kind?.toLowerCase().includes(q);
        const matchesHolder = a.heldBy?.name?.toLowerCase().includes(q);
        if (!matchesCode && !matchesKind && !matchesHolder) return false;
      }

      // Status filter
      if (statusFilter === 'in_store') {
        if (a.heldBy || a.serviceStatus === 'out_of_service') return false;
      } else if (statusFilter === 'issued') {
        if (!a.heldBy || a.serviceStatus === 'out_of_service') return false;
      } else if (statusFilter === 'out_of_service') {
        if (a.serviceStatus !== 'out_of_service') return false;
      }

      // Kind filter
      if (kindFilter !== 'all' && a.kind !== kindFilter) {
        return false;
      }

      return true;
    });
  }, [initialAssets, search, statusFilter, kindFilter]);

  // Open Issue Dialog
  const openIssueModal = (asset: any) => {
    setIssueModalAsset(asset);
    setWorkerId('');
    setOccurredAt(getNowLocal());
    setError('');
  };

  // Open Return Dialog
  const openReturnModal = (asset: any) => {
    setReturnModalAsset(asset);
    setOccurredAt(getNowLocal());
    setError('');
  };

  // Selected worker details for certification check warning
  const selectedWorker = useMemo(() => {
    return workers.find((w) => w._id === workerId);
  }, [workers, workerId]);

  const certStatus = useMemo(() => {
    if (!issueModalAsset || !issueModalAsset.requiresCertification || !selectedWorker) {
      return null;
    }
    const required = issueModalAsset.requiresCertification;
    const cert = selectedWorker.certifications?.find(
      (c: any) => c.kind.toLowerCase() === required.toLowerCase()
    );

    if (!cert) {
      return { valid: false, message: `Missing required '${required}' certification` };
    }
    const exp = new Date(cert.expiresAt);
    if (exp < new Date()) {
      return {
        valid: false,
        message: `'${required}' certification expired on ${exp.toLocaleDateString()}`,
      };
    }
    return {
      valid: true,
      message: `Certified: ${required} (Valid until ${exp.toLocaleDateString()})`,
    };
  }, [issueModalAsset, selectedWorker]);

  // Handle Issue Submit
  const handleIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueModalAsset) return;
    setError('');
    setIsSubmitting(true);

    try {
      await apiFetch(`/assets/${issueModalAsset._id}/issue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workerId,
          occurredAt: new Date(occurredAt).toISOString(),
          idempotencyKey: generateIdempotencyKey(),
        }),
      });
      setIssueModalAsset(null);
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to issue asset');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Return Submit
  const handleReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnModalAsset) return;
    setError('');
    setIsSubmitting(true);

    try {
      await apiFetch(`/assets/${returnModalAsset._id}/return`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workerId: returnModalAsset.heldBy?._id || returnModalAsset.heldBy,
          occurredAt: new Date(occurredAt).toISOString(),
          idempotencyKey: generateIdempotencyKey(),
        }),
      });
      setReturnModalAsset(null);
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to return asset');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Store Overview</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            Real-time physical asset status and checkout operations.
          </p>
        </div>

        {/* Status Metrics Bar */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <div className="px-3 py-1.5 rounded bg-white border border-zinc-200 shadow-xs flex items-center gap-2">
            <span className="text-zinc-500">TOTAL</span>
            <span className="font-semibold text-zinc-900">{metrics.total}</span>
          </div>
          <div className="px-3 py-1.5 rounded bg-white border border-zinc-200 shadow-xs flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="text-zinc-500">IN STORE</span>
            <span className="font-semibold text-zinc-900">{metrics.inStore}</span>
          </div>
          <div className="px-3 py-1.5 rounded bg-white border border-zinc-200 shadow-xs flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span className="text-zinc-500">ISSUED</span>
            <span className="font-semibold text-zinc-900">{metrics.issued}</span>
          </div>
          <div className="px-3 py-1.5 rounded bg-white border border-zinc-200 shadow-xs flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-zinc-400"></span>
            <span className="text-zinc-500">OOS</span>
            <span className="font-semibold text-zinc-900">{metrics.outOfService}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search by code (e.g. HARN-001), kind, or holder..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-zinc-300 rounded-lg pl-3.5 pr-8 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all shadow-xs"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-zinc-700"
            >
              ✕
            </button>
          )}
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <div className="inline-flex rounded-lg border border-zinc-200 bg-white p-0.5 text-xs font-medium shadow-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                statusFilter === 'all'
                  ? 'bg-zinc-900 text-white shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              All ({metrics.total})
            </button>
            <button
              onClick={() => setStatusFilter('in_store')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                statusFilter === 'in_store'
                  ? 'bg-zinc-900 text-white shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              In Store ({metrics.inStore})
            </button>
            <button
              onClick={() => setStatusFilter('issued')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                statusFilter === 'issued'
                  ? 'bg-zinc-900 text-white shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Issued ({metrics.issued})
            </button>
            <button
              onClick={() => setStatusFilter('out_of_service')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                statusFilter === 'out_of_service'
                  ? 'bg-zinc-900 text-white shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Out of Service ({metrics.outOfService})
            </button>
          </div>

          {/* Kind Filter */}
          <select
            value={kindFilter}
            onChange={(e) => setKindFilter(e.target.value)}
            className="bg-white border border-zinc-200 rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-700 focus:outline-none focus:border-zinc-900 shadow-xs cursor-pointer"
          >
            <option value="all">All Kinds</option>
            {kinds.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Assets Table */}
      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50/75 text-zinc-500 font-mono text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4 font-semibold">Asset Code</th>
                <th className="py-3 px-4 font-semibold">Kind</th>
                <th className="py-3 px-4 font-semibold">Required Cert</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Current Holder</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredAssets.map((asset) => {
                const isHeld = !!asset.heldBy;
                const isOOS = asset.serviceStatus === 'out_of_service';

                return (
                  <tr
                    key={asset._id}
                    className="hover:bg-zinc-50/80 transition-colors group"
                  >
                    {/* Code */}
                    <td className="py-3.5 px-4 font-mono font-semibold text-zinc-900">
                      <Link
                        href={`/assets/${asset._id}`}
                        className="text-zinc-900 hover:text-blue-600 hover:underline flex items-center gap-1.5"
                      >
                        {asset.code}
                        <span className="text-zinc-400 group-hover:text-zinc-600 transition-colors text-xs font-sans">
                          →
                        </span>
                      </Link>
                    </td>

                    {/* Kind */}
                    <td className="py-3.5 px-4 text-zinc-700">{asset.kind}</td>

                    {/* Required Cert */}
                    <td className="py-3.5 px-4 text-zinc-600 text-xs">
                      {asset.requiresCertification ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 border border-zinc-200">
                          {asset.requiresCertification}
                        </span>
                      ) : (
                        <span className="text-zinc-400 font-mono">—</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      {isOOS ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-100 text-zinc-600 border border-zinc-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-zinc-400"></span>
                          Out of Service
                        </span>
                      ) : isHeld ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-900 border border-amber-200/60">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                          Issued
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-900 border border-emerald-200/60">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          In Store
                        </span>
                      )}
                    </td>

                    {/* Holder */}
                    <td className="py-3.5 px-4 text-zinc-800">
                      {isHeld ? (
                        <span className="font-medium">
                          {asset.heldBy?.name || 'Assigned Worker'}
                        </span>
                      ) : (
                        <span className="text-zinc-400 font-mono">—</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {!isHeld && !isOOS && (
                          <button
                            onClick={() => openIssueModal(asset)}
                            className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-md text-xs font-medium transition-colors shadow-2xs cursor-pointer"
                          >
                            Issue
                          </button>
                        )}

                        {isHeld && (
                          <button
                            onClick={() => openReturnModal(asset)}
                            className="px-3 py-1.5 bg-white hover:bg-zinc-100 text-zinc-900 border border-zinc-300 rounded-md text-xs font-medium transition-colors shadow-2xs cursor-pointer"
                          >
                            Return
                          </button>
                        )}

                        <Link
                          href={`/assets/${asset._id}`}
                          className="px-2.5 py-1.5 text-xs text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded transition-colors"
                        >
                          History
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredAssets.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-400">
                    <p className="text-sm">No assets match your search or filter criteria.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ISSUE MODAL */}
      {issueModalAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-xs">
          <div className="bg-white border border-zinc-200 rounded-xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3 mb-4">
              <div>
                <h3 className="font-bold text-base text-zinc-900">Issue Equipment</h3>
                <p className="text-xs font-mono text-zinc-500 mt-0.5">
                  {issueModalAsset.code} · {issueModalAsset.kind}
                </p>
              </div>
              <button
                onClick={() => setIssueModalAsset(null)}
                className="text-zinc-400 hover:text-zinc-600 text-sm p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleIssue} className="space-y-4 text-sm">
              {/* Worker select */}
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                  Select Receiving Worker
                </label>
                <select
                  value={workerId}
                  onChange={(e) => setWorkerId(e.target.value)}
                  required
                  className="w-full bg-white border border-zinc-300 rounded-lg p-2.5 text-sm text-zinc-900 focus:outline-none focus:border-zinc-900 shadow-xs"
                >
                  <option value="">Choose worker from list...</option>
                  {workers.map((w) => (
                    <option key={w._id} value={w._id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Certification Advisory */}
              {issueModalAsset.requiresCertification && selectedWorker && (
                <div
                  className={`p-2.5 rounded-lg border text-xs ${
                    certStatus?.valid
                      ? 'bg-emerald-50/70 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}
                >
                  <div className="font-semibold mb-0.5">
                    Required: {issueModalAsset.requiresCertification}
                  </div>
                  <div>{certStatus?.message}</div>
                </div>
              )}

              {/* Occurred At */}
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                  Handover Instant (Occurred At)
                </label>
                <input
                  type="datetime-local"
                  value={occurredAt}
                  onChange={(e) => setOccurredAt(e.target.value)}
                  required
                  className="w-full bg-white border border-zinc-300 rounded-lg p-2 text-sm text-zinc-900 focus:outline-none focus:border-zinc-900 shadow-xs"
                />
                <p className="text-[11px] text-zinc-400 mt-1">
                  Defaults to current moment. Backdated entries are supported for late logging.
                </p>
              </div>

              {/* Error Box */}
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setIssueModalAsset(null)}
                  className="px-4 py-2 text-xs font-medium text-zinc-600 hover:text-zinc-900 rounded-md hover:bg-zinc-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-medium text-white bg-zinc-900 hover:bg-zinc-800 rounded-md transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Recording Issue...' : 'Confirm Issue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RETURN MODAL */}
      {returnModalAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-xs">
          <div className="bg-white border border-zinc-200 rounded-xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3 mb-4">
              <div>
                <h3 className="font-bold text-base text-zinc-900">Return to Store</h3>
                <p className="text-xs font-mono text-zinc-500 mt-0.5">
                  {returnModalAsset.code} · {returnModalAsset.kind}
                </p>
              </div>
              <button
                onClick={() => setReturnModalAsset(null)}
                className="text-zinc-400 hover:text-zinc-600 text-sm p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleReturn} className="space-y-4 text-sm">
              <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-200 text-xs">
                <span className="text-zinc-500">Current Registered Holder:</span>
                <div className="font-semibold text-zinc-900 text-sm mt-0.5">
                  {returnModalAsset.heldBy?.name || 'Current Holder'}
                </div>
              </div>

              {/* Occurred At */}
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                  Return Instant (Occurred At)
                </label>
                <input
                  type="datetime-local"
                  value={occurredAt}
                  onChange={(e) => setOccurredAt(e.target.value)}
                  required
                  className="w-full bg-white border border-zinc-300 rounded-lg p-2 text-sm text-zinc-900 focus:outline-none focus:border-zinc-900 shadow-xs"
                />
                <p className="text-[11px] text-zinc-400 mt-1">
                  Adjust if this return is being logged late after physical handover.
                </p>
              </div>

              {/* Error Box */}
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setReturnModalAsset(null)}
                  className="px-4 py-2 text-xs font-medium text-zinc-600 hover:text-zinc-900 rounded-md hover:bg-zinc-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-medium text-white bg-zinc-900 hover:bg-zinc-800 rounded-md transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Recording Return...' : 'Confirm Return'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
