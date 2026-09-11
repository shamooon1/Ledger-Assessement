# Equipment Ledger

## Overview
The Equipment Ledger is a system for tracking company assets and their movements among workers. It consists of a NestJS backend API and a Next.js frontend web application.

## Setup
You will need Docker, Node.js, and npm installed on your machine.

1. Start the MongoDB database using Docker:
   ```bash
   docker-compose up -d
   ```

2. Install dependencies for the API:
   ```bash
   cd api
   npm install
   ```

3. Install dependencies for the Web app:
   ```bash
   cd web
   npm install
   ```

## Running the API
From the `api` directory, run the development server:
```bash
npm run dev
```
The API will start and connect to the local MongoDB instance.

## Running the Web app
From the `web` directory, run the development server:
```bash
npm run dev
```

## Seeding
To populate the database with initial dummy data (workers, assets, etc.), run the seed script from the `api` directory:
```bash
npm run seed
```

## Invariant checks
The system includes a script to verify that the materialized state of assets matches their calculated state derived from the movement ledger. To run these invariant checks, execute the following from the `api` directory:
```bash
npm run check-invariants
```

## Model & design decisions
I chose an event-sourcing inspired, bitemporal ledger model for tracking asset movements, alongside a materialized "current state" on the asset records.

Why I chose this model:
1. **Auditable History**: The Movements collection acts as an immutable log. When historical corrections are needed, we do not delete or modify the original record. Instead, we create a new movement linked via `correctionOf` and `correctedBy`. This preserves a complete audit trail.
2. **Bitemporal Tracking**: By splitting `occurredAt` and `recordedAt`, the system handles backdated events gracefully. We know exactly when an event physically happened versus when the system was informed about it.
3. **Materialized State**: Storing `heldBy` and `serviceStatus` directly on the Asset document allows for fast reads and constraint checking, saving us from having to reconstruct the asset's current state from the entire movement history on every request.

## How concurrent issue is impossible
Concurrency issues are prevented by using MongoDB ACID transactions combined with atomic update conditions and idempotency keys. 
When issuing an asset, the system uses a transactional update with strict conditions (`{ _id: assetId, heldBy: null }`). If two concurrent requests attempt to issue the same available asset, the first one to acquire the lock will succeed and set `heldBy`. The second request will then fail to find a document matching `heldBy: null`, causing it to safely abort and return a conflict error.
Additionally, the use of unique `idempotencyKey` constraints guarantees that client retries won't result in duplicate movements.

## What I'd do with another day
- Add comprehensive End-to-End (E2E) testing for both the backend API and the frontend user interface.
- Implement a complete authentication and authorization system so only authorized users can issue or return equipment.
- Build a reconciliation worker that fully re-evaluates the materialized asset state when deep historical corrections are made.
- Polish the frontend UI/UX with better error states, loading skeletons, and interactive feedback.
- Set up a continuous integration (CI) pipeline to run linting, type checks, and tests automatically.

## What I knowingly left out
- **Side-effects on historical corrections**: Currently, correcting a historical movement updates the ledger but does not automatically re-trigger side effects to update the current `heldBy` state of the asset. This was a known scope limitation for this assessment.
- **Full Authentication**: Endpoints do not require a logged-in user context.
- **Frontend E2E tests**: Only the necessary setup was included, but full browser tests were omitted due to time constraints.
