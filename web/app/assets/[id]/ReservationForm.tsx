'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, generateIdempotencyKey } from '../../../lib/api';

export default function ReservationForm({ assetId, workers }: { assetId: string, workers: any[] }) {
  const router = useRouter();
  const [workerId, setWorkerId] = useState('');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [error, setError] = useState('');
  const [idempotencyKey, setIdempotencyKey] = useState('');

  // Generate idempotency key on mount so retries reuse it
  useEffect(() => {
    setIdempotencyKey(generateIdempotencyKey());
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await apiFetch(`/assets/${assetId}/reserve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workerId,
          startAt: new Date(startAt).toISOString(),
          endAt: new Date(endAt).toISOString(),
          idempotencyKey
        })
      });
      // Reset form and key on success
      setWorkerId('');
      setStartAt('');
      setEndAt('');
      setIdempotencyKey(generateIdempotencyKey());
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 p-4 border rounded-lg shadow-sm flex flex-col gap-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Worker</label>
        <select value={workerId} onChange={e => setWorkerId(e.target.value)} required className="w-full border border-gray-300 rounded p-2 text-sm">
          <option value="">Select Worker...</option>
          {workers && workers.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start</label>
          <input type="datetime-local" value={startAt} onChange={e => setStartAt(e.target.value)} required className="w-full border border-gray-300 rounded p-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">End</label>
          <input type="datetime-local" value={endAt} onChange={e => setEndAt(e.target.value)} required className="w-full border border-gray-300 rounded p-2 text-sm" />
        </div>
      </div>
      <button type="submit" className="mt-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded text-sm transition-colors">
        Reserve Asset
      </button>
      {error && <div className="text-red-500 text-sm bg-red-50 p-2 rounded">{error}</div>}
    </form>
  );
}
