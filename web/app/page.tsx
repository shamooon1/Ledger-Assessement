import { apiFetch } from '../lib/api';
import StoreTable from './StoreTable';

export default async function StoreOverview() {
  const assets = await apiFetch('/assets', { cache: 'no-store' }).catch(() => []);
  const workers = await apiFetch('/workers', { cache: 'no-store' }).catch(() => []);
  const reservations = await apiFetch('/reservations', { cache: 'no-store' }).catch(() => []);

  return <StoreTable initialAssets={assets || []} workers={workers || []} reservations={reservations || []} />;
}
