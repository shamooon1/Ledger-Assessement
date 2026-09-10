import { apiFetch } from '../../../lib/api';
import Link from 'next/link';
import ReservationForm from './ReservationForm';

export default async function AssetHistory({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const history = await apiFetch(`/assets/${id}/history`, { cache: 'no-store' });
  const reservations = await apiFetch(`/reservations?assetId=${id}`, { cache: 'no-store' });
  const workers = await apiFetch('/workers', { cache: 'no-store' });

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <Link href="/" className="text-blue-600 hover:underline">&larr; Back to Store</Link>
      </div>
      
      <h1 className="text-3xl font-bold mb-6">Asset Details</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-4 border-b pb-2">History Timeline</h2>
          <div className="flex flex-col gap-4">
            {(!history || history.length === 0) && <p className="text-gray-500 italic">No history available.</p>}
            {history && history.map((movement: any) => {
              const isCorrected = !!movement.correctedBy;
              const isCorrection = !!movement.correctionOf;

              return (
                <div key={movement._id} className={`p-4 border rounded shadow-sm ${isCorrected ? 'bg-gray-50 opacity-75' : 'bg-white'} ${isCorrection ? 'border-l-4 border-l-blue-500' : ''}`}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-semibold uppercase tracking-wider text-gray-700">{movement.type}</span>
                    <span className="text-gray-500">{new Date(movement.occurredAt).toLocaleString()}</span>
                  </div>
                  
                  <div className={`text-base ${isCorrected ? 'line-through text-gray-500' : ''}`}>
                    {movement.workerId ? `Worker ID: ${movement.workerId}` : 'No worker'}
                  </div>

                  {isCorrected && (
                    <div className="text-xs text-orange-600 font-medium mt-2 bg-orange-50 px-2 py-1 rounded inline-block">
                      Corrected — see below
                    </div>
                  )}

                  {isCorrection && (
                    <div className="mt-2 text-sm text-blue-700 bg-blue-50 p-2 rounded">
                      <strong>Correction of:</strong> {movement.correctionOf}
                      {movement.reason && <div><strong>Reason:</strong> {movement.reason}</div>}
                    </div>
                  )}
                  
                  {!isCorrection && movement.reason && (
                    <div className="mt-2 text-sm text-gray-600">
                      <strong>Reason:</strong> {movement.reason}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4 border-b pb-2">Reservations</h2>
          
          <div className="mb-6">
            <h3 className="font-medium mb-3 text-sm text-gray-700 uppercase tracking-wider">Create Reservation</h3>
            <ReservationForm assetId={id} workers={workers} />
          </div>

          <div className="flex flex-col gap-3">
            <h3 className="font-medium mb-2 text-sm text-gray-700 uppercase tracking-wider">Existing Reservations</h3>
            {(!reservations || reservations.length === 0) && <p className="text-gray-500 italic">No reservations.</p>}
            {reservations && reservations.map((res: any) => (
              <div key={res._id} className="p-4 border rounded bg-white shadow-sm text-sm flex justify-between items-center">
                <div>
                  <div className="font-semibold text-gray-800">Worker ID: {res.workerId}</div>
                  <div className="text-gray-600 mt-1">
                    {new Date(res.startAt).toLocaleString()} - {new Date(res.endAt).toLocaleString()}
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  res.status === 'active' ? 'bg-blue-100 text-blue-800' :
                  res.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {res.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
