import mongoose from 'mongoose';
import { config } from 'dotenv';

config();

async function runChecks() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/equipment-ledger?replicaSet=rs0';
  await mongoose.connect(uri);

  const db = mongoose.connection.db;
  if (!db) {
    console.error('Failed to get database connection');
    process.exit(1);
  }

  let anyFailed = false;
  let passedCount = 0;

  function reportPass(checkName: string) {
    console.log(`[PASS] ${checkName}`);
    passedCount++;
  }

  function reportFail(checkName: string, offendingIds: any[]) {
    console.error(`[FAIL] ${checkName}`);
    console.error(`       Offending IDs: ${offendingIds.join(', ')}`);
    anyFailed = true;
  }

  // Collections
  const assetsCol = db.collection('assets');
  const movementsCol = db.collection('movements');
  const workersCol = db.collection('workers');
  const reservationsCol = db.collection('reservations');

  // Check 1: Single-holder consistency
  const check1Name = 'Single-holder consistency';
  const assetsWithHolder = await assetsCol.find({ heldBy: { $ne: null } }).toArray();
  const offendingAssets1: string[] = [];

  for (const asset of assetsWithHolder) {
    // Find all non-superseded movements for this asset
    const movements = await movementsCol
      .find({ assetId: asset._id, correctedBy: null })
      .sort({ occurredAt: -1, recordedAt: -1 })
      .limit(1)
      .toArray();

    if (movements.length === 0) {
      offendingAssets1.push(asset._id.toString());
    } else {
      const lastMovement = movements[0];
      if (lastMovement.type !== 'issue' || lastMovement.workerId?.toString() !== asset.heldBy?.toString()) {
        offendingAssets1.push(asset._id.toString());
      }
    }
  }

  if (offendingAssets1.length > 0) {
    reportFail(check1Name, offendingAssets1);
  } else {
    reportPass(check1Name);
  }

  // Check 2: No orphaned holder
  const check2Name = 'No orphaned holder';
  const offendingAssets2: string[] = [];
  const uniqueWorkerIds = [...new Set(assetsWithHolder.map(a => a.heldBy?.toString()))];
  const existingWorkers = await workersCol
    .find({ _id: { $in: uniqueWorkerIds.map(id => new mongoose.Types.ObjectId(id)) } })
    .toArray();
  const existingWorkerIdSet = new Set(existingWorkers.map(w => w._id.toString()));

  for (const asset of assetsWithHolder) {
    if (!existingWorkerIdSet.has(asset.heldBy?.toString())) {
      offendingAssets2.push(asset._id.toString());
    }
  }

  if (offendingAssets2.length > 0) {
    reportFail(check2Name, offendingAssets2);
  } else {
    reportPass(check2Name);
  }

  // Check 3: No overlapping active reservations
  const check3Name = 'No overlapping active reservations';
  const offendingReservations3: string[] = [];
  const activeReservations = await reservationsCol.find({ status: 'active' }).toArray();

  const reservationsByAsset = new Map<string, any[]>();
  for (const res of activeReservations) {
    const assetIdStr = res.assetId.toString();
    if (!reservationsByAsset.has(assetIdStr)) {
      reservationsByAsset.set(assetIdStr, []);
    }
    reservationsByAsset.get(assetIdStr)!.push(res);
  }

  for (const [_, resList] of reservationsByAsset) {
    resList.sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
    for (let i = 1; i < resList.length; i++) {
      const prev = resList[i - 1];
      const curr = resList[i];
      if (curr.startAt < prev.endAt) {
        offendingReservations3.push(curr._id.toString());
        offendingReservations3.push(prev._id.toString());
      }
    }
  }

  const uniqueOffendingRes3 = [...new Set(offendingReservations3)];
  if (uniqueOffendingRes3.length > 0) {
    reportFail(check3Name, uniqueOffendingRes3);
  } else {
    reportPass(check3Name);
  }

  // Check 4: Movement timestamp sanity
  const check4Name = 'Movement timestamp sanity';
  const offendingMovements4 = await movementsCol
    .find({
      $or: [
        { occurredAt: { $exists: false } },
        { recordedAt: { $exists: false } },
        { $expr: { $lt: ['$recordedAt', '$occurredAt'] } },
      ],
    })
    .toArray();

  if (offendingMovements4.length > 0) {
    reportFail(check4Name, offendingMovements4.map(m => m._id.toString()));
  } else {
    reportPass(check4Name);
  }

  // Check 5: Correction pointers are bidirectional
  const check5Name = 'Correction pointers are bidirectional';
  const movementsWithCorrectedBy = await movementsCol.find({ correctedBy: { $ne: null } }).toArray();
  const offendingMovements5: string[] = [];

  for (const m of movementsWithCorrectedBy) {
    const refMovement = await movementsCol.findOne({ _id: m.correctedBy });
    if (!refMovement || refMovement.correctionOf?.toString() !== m._id.toString()) {
      offendingMovements5.push(m._id.toString());
    }
  }

  if (offendingMovements5.length > 0) {
    reportFail(check5Name, offendingMovements5);
  } else {
    reportPass(check5Name);
  }

  // Check 6: Idempotency key uniqueness
  const check6Name = 'Idempotency key uniqueness';
  const offendingMovements6: string[] = [];
  
  // Verify no duplicates directly
  const duplicateKeys = await movementsCol
    .aggregate([
      { $group: { _id: '$idempotencyKey', count: { $sum: 1 }, ids: { $push: '$_id' } } },
      { $match: { count: { $gt: 1 }, _id: { $ne: null } } }
    ])
    .toArray();
    
  for (const dup of duplicateKeys) {
    for (const id of dup.ids) {
      offendingMovements6.push(id.toString());
    }
  }

  // Check the index
  let indexMissingOrNotUnique = false;
  try {
    const indexes = await movementsCol.listIndexes().toArray();
    const idempotencyIndex = indexes.find(
      idx => idx.key && idx.key.idempotencyKey === 1
    );
    if (!idempotencyIndex || !idempotencyIndex.unique) {
      indexMissingOrNotUnique = true;
    }
  } catch (e) {
    // If collection doesn't exist, listIndexes might throw, but it shouldn't fail if we have data.
    indexMissingOrNotUnique = true;
  }

  if (offendingMovements6.length > 0) {
    reportFail(`${check6Name} (duplicate records found)`, offendingMovements6);
  } else if (indexMissingOrNotUnique) {
    reportFail(`${check6Name} (index missing or not unique)`, ['INDEX_MISSING']);
  } else {
    reportPass(check6Name);
  }

  // Summary
  console.log(`${passedCount}/6 checks passed`);
  
  await mongoose.disconnect();

  if (anyFailed) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runChecks().catch(err => {
  console.error('Unhandled error during invariant checks:', err);
  process.exit(1);
});
