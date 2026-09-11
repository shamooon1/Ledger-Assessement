'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, generateIdempotencyKey } from '../../../lib/api';

export default function ReservationForm({
  assetId,
  workers,
}: {
  assetId: string;
  workers: any[];
}) {
  const router = useRouter();
  const [workerId, setWorkerId] = useState('');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [error, setError] = useState('');
  const [idempotencyKey, setIdempotencyKey] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setIdempotencyKey(generateIdempotencyKey());
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await apiFetch(`/assets/${assetId}/reserve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workerId,
          startAt: new Date(startAt).toISOString(),
          endAt: new Date(endAt).toISOString(),
          idempotencyKey,
        }),
      });

      // Reset on success
      setWorkerId('');
      setStartAt('');
      setEndAt('');
      setIdempotencyKey(generateIdempotencyKey());
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to create reservation');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs space-y-4 text-sm"
    >
      <div>
        <label className="block text-xs font-medium text-zinc-700 mb-1.5">
          Reserving Worker
        </label>
        <select
          value={workerId}
          onChange={(e) => setWorkerId(e.target.value)}
          required
          className="w-full bg-white border border-zinc-300 rounded-lg p-2.5 text-sm text-zinc-900 focus:outline-none focus:border-zinc-900 shadow-xs"
        >
          <option value="">Select worker...</option>
          {workers.map((w) => (
            <option key={w._id} value={w._id}>
              {w.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-zinc-700 mb-1.5">
            Window Start
          </label>
          <input
            type="datetime-local"
            value={startAt}
            onChange={(e) => setStartAt(e.target.value)}
            required
            className="w-full bg-white border border-zinc-300 rounded-lg p-2 text-sm text-zinc-900 focus:outline-none focus:border-zinc-900 shadow-xs"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-700 mb-1.5">
            Window End
          </label>
          <input
            type="datetime-local"
            value={endAt}
            onChange={(e) => setEndAt(e.target.value)}
            required
            className="w-full bg-white border border-zinc-300 rounded-lg p-2 text-sm text-zinc-900 focus:outline-none focus:border-zinc-900 shadow-xs"
          />
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-2.5 px-4 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium rounded-lg transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
      >
        {isSubmitting ? 'Creating Reservation...' : 'Reserve Asset Window'}
      </button>
    </form>
  );
}
