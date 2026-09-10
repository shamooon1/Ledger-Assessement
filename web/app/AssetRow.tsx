'use client';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, generateIdempotencyKey } from '../lib/api';
import Link from 'next/link';

export default function AssetRow({ asset, workers }: { asset: any, workers: any[] }) {
  const router = useRouter();
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [showReturnForm, setShowReturnForm] = useState(false);
  const [workerId, setWorkerId] = useState('');
  const [occurredAt, setOccurredAt] = useState('');
  const [error, setError] = useState('');
  
  const issueKey = useMemo(() => showIssueForm ? generateIdempotencyKey() : '', [showIssueForm]);
  const returnKey = useMemo(() => showReturnForm ? generateIdempotencyKey() : '', [showReturnForm]);

  const handleIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await apiFetch(`/assets/${asset._id}/issue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workerId, occurredAt: new Date(occurredAt).toISOString(), idempotencyKey: issueKey })
      });
      setShowIssueForm(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await apiFetch(`/assets/${asset._id}/return`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workerId: asset.heldBy?._id, occurredAt: new Date(occurredAt).toISOString(), idempotencyKey: returnKey })
      });
      setShowReturnForm(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <tr className="border-b hover:bg-gray-50">
      <td className="p-3">
        <Link href={`/assets/${asset._id}`} className="text-blue-600 hover:underline font-medium">
          {asset.code}
        </Link>
      </td>
      <td className="p-3">{asset.kind}</td>
      <td className="p-3">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${asset.serviceStatus === 'in_service' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {asset.serviceStatus}
        </span>
      </td>
      <td className="p-3">{asset.heldBy ? asset.heldBy.name : <span className="text-gray-400 italic">Unheld</span>}</td>
      <td className="p-3">
        <div className="flex flex-col items-start gap-2">
          {!asset.heldBy && asset.serviceStatus === 'in_service' && (
            <div className="relative">
              <button onClick={() => setShowIssueForm(!showIssueForm)} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors">
                Issue
              </button>
              {showIssueForm && (
                <form onSubmit={handleIssue} className="absolute z-10 top-full mt-2 left-0 w-64 flex flex-col gap-3 bg-white p-4 border border-gray-200 rounded-lg shadow-xl">
                  <h4 className="font-semibold text-sm">Issue Asset</h4>
                  <select value={workerId} onChange={e => setWorkerId(e.target.value)} required className="border border-gray-300 rounded p-2 text-sm w-full">
                    <option value="">Select Worker...</option>
                    {workers && workers.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
                  </select>
                  <input type="datetime-local" value={occurredAt} onChange={e => setOccurredAt(e.target.value)} required className="border border-gray-300 rounded p-2 text-sm w-full" />
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setShowIssueForm(false)} className="text-gray-500 hover:text-gray-700 text-sm">Cancel</button>
                    <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors">Submit</button>
                  </div>
                  {error && <span className="text-red-500 text-xs bg-red-50 p-1 rounded">{error}</span>}
                </form>
              )}
            </div>
          )}
          {asset.heldBy && (
            <div className="relative">
              <button onClick={() => setShowReturnForm(!showReturnForm)} className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded text-sm transition-colors">
                Return
              </button>
              {showReturnForm && (
                <form onSubmit={handleReturn} className="absolute z-10 top-full mt-2 left-0 w-64 flex flex-col gap-3 bg-white p-4 border border-gray-200 rounded-lg shadow-xl">
                  <h4 className="font-semibold text-sm">Return Asset</h4>
                  <input type="datetime-local" value={occurredAt} onChange={e => setOccurredAt(e.target.value)} required className="border border-gray-300 rounded p-2 text-sm w-full" />
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setShowReturnForm(false)} className="text-gray-500 hover:text-gray-700 text-sm">Cancel</button>
                    <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors">Submit</button>
                  </div>
                  {error && <span className="text-red-500 text-xs bg-red-50 p-1 rounded">{error}</span>}
                </form>
              )}
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}
