'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiFetch, generateIdempotencyKey } from '../../../lib/api';
import ReservationForm from './ReservationForm';

export default function AssetDetailView({
  asset,
  history,
  reservations,
  workers,
}: {
  asset: any;
  history: any[];
  reservations: any[];
  workers: any[];
}) {
  const router = useRouter();

  // Out of service modal state
  const [showOosModal, setShowOosModal] = useState(false);
  const [oosReason, setOosReason] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusError, setStatusError] = useState('');

  // Correction modal state
  const [correctingMovement, setCorrectingMovement] = useState<any | null>(null);
  const [correctionReason, setCorrectionReason] = useState('');
  const [correctedWorkerId, setCorrectedWorkerId] = useState('');
  const [correctedOccurredAt, setCorrectedOccurredAt] = useState('');
  const [correctionError, setCorrectionError] = useState('');
  const [isSubmittingCorrection, setIsSubmittingCorrection] = useState(false);

  // Worker lookup map
  const workerMap = new Map<string, string>();
  workers.forEach((w) => workerMap.set(w._id, w.name));

  const getWorkerName = (id: any) => {
    if (!id) return 'Unassigned';
    if (typeof id === 'object' && id.name) return id.name;
    return workerMap.get(id) || id;
  };

  // Toggle Out of Service
  const handleMarkOos = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusError('');
    setIsUpdatingStatus(true);
    try {
      await apiFetch(`/assets/${asset._id}/out-of-service`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: oosReason || 'Flagged out of service by store keeper',
          idempotencyKey: generateIdempotencyKey(),
        }),
      });
      setShowOosModal(false);
      setOosReason('');
      router.refresh();
    } catch (err: any) {
      setStatusError(err.message || 'Failed to update service status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Toggle In Service
  const handleMarkInService = async () => {
    setStatusError('');
    setIsUpdatingStatus(true);
    try {
      await apiFetch(`/assets/${asset._id}/in-service`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idempotencyKey: generateIdempotencyKey(),
        }),
      });
      router.refresh();
    } catch (err: any) {
      setStatusError(err.message || 'Failed to put back in service');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Open correction modal
  const openCorrection = (m: any) => {
    setCorrectingMovement(m);
    setCorrectionReason('');
    setCorrectedWorkerId(m.workerId?._id || m.workerId || '');
    const date = new Date(m.occurredAt);
    const offset = date.getTimezoneOffset() * 60000;
    setCorrectedOccurredAt(new Date(date.getTime() - offset).toISOString().slice(0, 16));
    setCorrectionError('');
  };

  // Submit correction
  const handleCorrectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctingMovement) return;
    setCorrectionError('');
    setIsSubmittingCorrection(true);

    try {
      const correctedFields: any = {
        occurredAt: new Date(correctedOccurredAt).toISOString(),
      };
      if (correctedWorkerId) {
        correctedFields.workerId = correctedWorkerId;
      }

      await apiFetch(`/movements/${correctingMovement._id}/correct`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          correctedFields,
          reason: correctionReason,
        }),
      });

      setCorrectingMovement(null);
      router.refresh();
    } catch (err: any) {
      setCorrectionError(err.message || 'Failed to submit correction');
    } finally {
      setIsSubmittingCorrection(false);
    }
  };

  const isOOS = asset.serviceStatus === 'out_of_service';
  const isHeld = !!asset.heldBy;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Back Link */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          ← Back to Store Overview
        </Link>
      </div>

      {/* Asset Header Card */}
      <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="font-mono text-2xl font-bold text-zinc-900">{asset.code}</span>
            <span className="px-2.5 py-0.5 rounded text-xs font-medium bg-zinc-100 text-zinc-800 border border-zinc-200">
              {asset.kind}
            </span>
            {isOOS ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-600 border border-zinc-200">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400"></span>
                Out of Service
              </span>
            ) : isHeld ? (
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
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-zinc-500 font-mono">
            <div>
              <span>CURRENT HOLDER: </span>
              <span className="font-semibold text-zinc-800 font-sans">
                {isHeld ? getWorkerName(asset.heldBy) : 'None (In Store)'}
              </span>
            </div>
            <div>
              <span>REQUIRED CERTIFICATION: </span>
              <span className="font-semibold text-zinc-800 font-sans">
                {asset.requiresCertification || 'None'}
              </span>
            </div>
          </div>
        </div>

        {/* Status Actions */}
        <div className="flex items-center gap-2">
          {isOOS ? (
            <button
              onClick={handleMarkInService}
              disabled={isUpdatingStatus}
              className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-medium transition-colors shadow-xs cursor-pointer"
            >
              {isUpdatingStatus ? 'Updating...' : 'Restore In-Service'}
            </button>
          ) : (
            <button
              onClick={() => setShowOosModal(true)}
              disabled={isUpdatingStatus}
              className="px-3.5 py-2 bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-300 rounded-lg text-xs font-medium transition-colors shadow-xs cursor-pointer"
            >
              Take Out of Service
            </button>
          )}
        </div>
      </div>

      {statusError && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
          {statusError}
        </div>
      )}

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Timeline (2 Columns) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
            <div>
              <h2 className="font-bold text-base text-zinc-900">Ledger History Timeline</h2>
              <p className="text-xs text-zinc-500">
                Immutable record of physical custody transfers and corrections.
              </p>
            </div>
            <span className="text-xs font-mono text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200">
              {history.length} movements
            </span>
          </div>

          {history.length === 0 ? (
            <div className="bg-white border border-zinc-200 rounded-xl p-8 text-center text-zinc-400 text-sm">
              No movement records exist for this asset yet.
            </div>
          ) : (
            <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-px before:bg-zinc-200">
              {history.map((m) => {
                const isCorrected = !!m.correctedBy;
                const isCorrection = !!m.correctionOf;
                const occurred = new Date(m.occurredAt);
                const recorded = new Date(m.recordedAt);
                const isLateLogged =
                  recorded.getTime() - occurred.getTime() > 1000 * 60 * 30; // > 30 mins difference

                return (
                  <div key={m._id} className="relative group">
                    {/* Timeline Node Dot */}
                    <div
                      className={`absolute -left-6 top-3 w-2.5 h-2.5 rounded-full border-2 bg-white ${
                        isCorrection
                          ? 'border-blue-500 bg-blue-50'
                          : isCorrected
                          ? 'border-zinc-300'
                          : m.type === 'issue'
                          ? 'border-amber-500'
                          : 'border-emerald-500'
                      }`}
                    ></div>

                    <div
                      className={`p-4 border rounded-xl shadow-xs transition-all ${
                        isCorrected
                          ? 'bg-zinc-50/75 border-zinc-200 text-zinc-400'
                          : isCorrection
                          ? 'bg-blue-50/30 border-blue-200 text-zinc-900'
                          : 'bg-white border-zinc-200 text-zinc-900'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 text-xs mb-1.5 font-mono">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-semibold uppercase px-2 py-0.5 rounded text-[10px] ${
                              isCorrection
                                ? 'bg-blue-100 text-blue-800'
                                : m.type === 'issue'
                                ? 'bg-amber-100 text-amber-900'
                                : 'bg-emerald-100 text-emerald-900'
                            }`}
                          >
                            {m.type}
                          </span>
                          {isLateLogged && (
                            <span className="bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded text-[10px] border border-zinc-200">
                              Late-logged
                            </span>
                          )}
                          {isCorrected && (
                            <span className="bg-zinc-200 text-zinc-600 px-1.5 py-0.5 rounded text-[10px]">
                              Superseded
                            </span>
                          )}
                        </div>

                        <span className="text-zinc-500">
                          {occurred.toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                      </div>

                      <div className="flex items-start justify-between gap-4 mt-2">
                        <div className={isCorrected ? 'line-through text-zinc-400' : ''}>
                          <div className="text-sm font-medium">
                            {m.type === 'issue' ? 'Issued to: ' : 'Handover from: '}
                            <span className="font-semibold text-zinc-900">
                              {getWorkerName(m.workerId)}
                            </span>
                          </div>
                          {m.reason && (
                            <div className="text-xs text-zinc-500 mt-1 italic">
                              "{m.reason}"
                            </div>
                          )}
                        </div>

                        {!isCorrected && (
                          <button
                            onClick={() => openCorrection(m)}
                            className="opacity-0 group-hover:opacity-100 text-xs text-zinc-400 hover:text-zinc-900 underline transition-opacity cursor-pointer font-mono"
                          >
                            Correct Entry
                          </button>
                        )}
                      </div>

                      {/* Timestamps audit footnote */}
                      <div className="mt-2.5 pt-2 border-t border-zinc-100 flex flex-wrap items-center justify-between text-[11px] font-mono text-zinc-400 gap-2">
                        <span>Occurred: {occurred.toLocaleTimeString()}</span>
                        <span>Recorded: {recorded.toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Reservations Column */}
        <div className="space-y-6">
          <div className="border-b border-zinc-200 pb-3">
            <h2 className="font-bold text-base text-zinc-900">Reservations</h2>
            <p className="text-xs text-zinc-500">
              Future windows claim management.
            </p>
          </div>

          <ReservationForm assetId={asset._id} workers={workers} />

          {/* Existing Reservations List */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono uppercase text-zinc-500 tracking-wider">
              Standing & Past Reservations ({reservations.length})
            </h3>

            {reservations.length === 0 ? (
              <div className="bg-white border border-zinc-200 rounded-xl p-4 text-center text-xs text-zinc-400">
                No active or historical reservations.
              </div>
            ) : (
              reservations.map((res) => {
                const start = new Date(res.startAt);
                const end = new Date(res.endAt);

                return (
                  <div
                    key={res._id}
                    className="p-3.5 bg-white border border-zinc-200 rounded-xl text-xs space-y-1.5 shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-zinc-900">
                        {getWorkerName(res.workerId)}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-medium font-mono uppercase ${
                          res.status === 'active'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/60'
                            : res.status === 'fulfilled'
                            ? 'bg-zinc-100 text-zinc-700 border border-zinc-200'
                            : 'bg-zinc-100 text-zinc-500'
                        }`}
                      >
                        {res.status}
                      </span>
                    </div>

                    <div className="text-zinc-500 font-mono text-[11px]">
                      {start.toLocaleDateString()} {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {' → '}
                      {end.toLocaleDateString()} {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>

                    {res.reason && (
                      <div className="text-zinc-500 text-[11px] italic">"{res.reason}"</div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* OUT OF SERVICE MODAL */}
      {showOosModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-xs">
          <div className="bg-white border border-zinc-200 rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="font-bold text-base text-zinc-900 mb-1">Take Out of Service</h3>
            <p className="text-xs text-zinc-500 mb-4">
              Prevent further checkouts or reservations while damaged/under repair.
            </p>

            <form onSubmit={handleMarkOos} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                  Reason for Out of Service
                </label>
                <textarea
                  value={oosReason}
                  onChange={(e) => setOosReason(e.target.value)}
                  required
                  placeholder="e.g. Frayed strap, motor sparking, inspection failed..."
                  className="w-full bg-white border border-zinc-300 rounded-lg p-2.5 text-sm text-zinc-900 focus:outline-none focus:border-zinc-900 shadow-xs h-24"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOosModal(false)}
                  className="px-4 py-2 text-xs font-medium text-zinc-600 hover:text-zinc-900 rounded-md hover:bg-zinc-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingStatus}
                  className="px-4 py-2 text-xs font-medium text-white bg-zinc-900 hover:bg-zinc-800 rounded-md shadow-xs"
                >
                  {isUpdatingStatus ? 'Saving...' : 'Confirm Out of Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CORRECTION MODAL */}
      {correctingMovement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-xs">
          <div className="bg-white border border-zinc-200 rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="font-bold text-base text-zinc-900 mb-1">Record Ledger Correction</h3>
            <p className="text-xs text-zinc-500 mb-4">
              Fix an inaccurate entry without destroying the historical ledger audit trail.
            </p>

            <form onSubmit={handleCorrectionSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                  Corrected Worker
                </label>
                <select
                  value={correctedWorkerId}
                  onChange={(e) => setCorrectedWorkerId(e.target.value)}
                  className="w-full bg-white border border-zinc-300 rounded-lg p-2 text-sm text-zinc-900 focus:outline-none focus:border-zinc-900 shadow-xs"
                >
                  <option value="">Select worker...</option>
                  {workers.map((w) => (
                    <option key={w._id} value={w._id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                  Corrected Timestamp
                </label>
                <input
                  type="datetime-local"
                  value={correctedOccurredAt}
                  onChange={(e) => setCorrectedOccurredAt(e.target.value)}
                  required
                  className="w-full bg-white border border-zinc-300 rounded-lg p-2 text-sm text-zinc-900 focus:outline-none focus:border-zinc-900 shadow-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                  Reason for Correction (Audited)
                </label>
                <input
                  type="text"
                  value={correctionReason}
                  onChange={(e) => setCorrectionReason(e.target.value)}
                  required
                  placeholder="e.g. Correcting recipient typo from shift log..."
                  className="w-full bg-white border border-zinc-300 rounded-lg p-2 text-sm text-zinc-900 focus:outline-none focus:border-zinc-900 shadow-xs"
                />
              </div>

              {correctionError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
                  {correctionError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCorrectingMovement(null)}
                  className="px-4 py-2 text-xs font-medium text-zinc-600 hover:text-zinc-900 rounded-md hover:bg-zinc-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCorrection}
                  className="px-4 py-2 text-xs font-medium text-white bg-zinc-900 hover:bg-zinc-800 rounded-md shadow-xs"
                >
                  {isSubmittingCorrection ? 'Applying...' : 'Apply Correction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
