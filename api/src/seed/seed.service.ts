import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { randomUUID } from 'crypto';
import { Asset, AssetDocument } from '../assets/schemas/asset.schema.js';
import { Worker, WorkerDocument } from '../workers/schemas/worker.schema.js';
import { Movement, MovementDocument } from '../movements/schemas/movement.schema.js';
import { Reservation, ReservationDocument } from '../reservations/schemas/reservation.schema.js';

@Injectable()
export class SeedService {
  constructor(
    @InjectModel(Asset.name) private assetModel: Model<AssetDocument>,
    @InjectModel(Worker.name) private workerModel: Model<WorkerDocument>,
    @InjectModel(Movement.name) private movementModel: Model<MovementDocument>,
    @InjectModel(Reservation.name) private reservationModel: Model<ReservationDocument>,
  ) {}

  async run() {
    console.log('Seeding Equipment Ledger database...');

    // 1. Clean existing collections for repeatable seeding
    await this.movementModel.deleteMany({});
    await this.reservationModel.deleteMany({});
    await this.assetModel.deleteMany({});
    await this.workerModel.deleteMany({});

    // Ensure unique indexes are built
    await this.movementModel.syncIndexes();
    await this.reservationModel.syncIndexes();
    await this.assetModel.syncIndexes();
    await this.workerModel.syncIndexes();

    const now = new Date();
    const d = (daysOffset: number, hoursOffset: number = 0, minutesOffset: number = 0) => {
      const date = new Date(now);
      date.setDate(date.getDate() + daysOffset);
      date.setHours(date.getHours() + hoursOffset, date.getMinutes() + minutesOffset, 0, 0);
      return date;
    };

    // 2. Seed ~12 Workers with certifications
    // Requirements: ~12 workers, including one expired and one expiring inside seeded window
    const workersData = [
      {
        name: 'Worker 1',
        certifications: [
          { kind: 'Working at Heights', expiresAt: d(180) },
          { kind: 'Confined Space', expiresAt: d(90) },
        ],
      },
      {
        name: 'Worker 2',
        certifications: [
          { kind: 'Working at Heights', expiresAt: d(-10) }, // Expired 10 days ago
        ],
      },
      {
        name: 'Worker 3',
        certifications: [
          { kind: 'Hot Works', expiresAt: d(5) }, // Expiring in 5 days (inside window)
        ],
      },
      {
        name: 'Worker 4',
        certifications: [
          { kind: 'Confined Space', expiresAt: d(120) },
        ],
      },
      {
        name: 'Worker 5',
        certifications: [
          { kind: 'Working at Heights', expiresAt: d(60) },
          { kind: 'Hot Works', expiresAt: d(200) },
        ],
      },
      {
        name: 'Worker 6',
        certifications: [
          { kind: 'Electrical Safety', expiresAt: d(150) },
        ],
      },
      {
        name: 'Worker 7',
        certifications: [
          { kind: 'Working at Heights', expiresAt: d(45) },
        ],
      },
      {
        name: 'Worker 8',
        certifications: [
          { kind: 'Confined Space', expiresAt: d(300) },
          { kind: 'Hot Works', expiresAt: d(100) },
        ],
      },
      {
        name: 'Worker 9',
        certifications: [
          { kind: 'Electrical Safety', expiresAt: d(90) },
        ],
      },
      {
        name: 'Worker 10',
        certifications: [
          { kind: 'Working at Heights', expiresAt: d(240) },
        ],
      },
      {
        name: 'Worker 11',
        certifications: [], // No certifications
      },
      {
        name: 'Worker 12',
        certifications: [
          { kind: 'Confined Space', expiresAt: d(60) },
        ],
      },
    ];

    const workers = await this.workerModel.insertMany(workersData);
    const workerMap = new Map<string, any>();
    for (const w of workers) {
      workerMap.set(w.name, w);
    }
    console.log(`Seeded ${workers.length} workers.`);

    // 3. Seed ~60 Assets across various kinds
    // Requirements: ~60 assets across kinds, some requiring certification, at least one out of service
    const assetsData: any[] = [];

    // 12 Harnesses (require 'Working at Heights')
    for (let i = 1; i <= 12; i++) {
      const num = String(i).padStart(3, '0');
      assetsData.push({
        code: `HARN-${num}`,
        kind: 'Harness',
        requiresCertification: 'Working at Heights',
        serviceStatus: i === 10 ? 'out_of_service' : 'in_service',
        heldBy: null,
      });
    }

    // 10 Detectors (require 'Confined Space')
    for (let i = 1; i <= 10; i++) {
      const num = String(i).padStart(3, '0');
      assetsData.push({
        code: `GAS-${num}`,
        kind: 'Detector',
        requiresCertification: 'Confined Space',
        serviceStatus: 'in_service',
        heldBy: null,
      });
    }

    // 8 Welders (require 'Hot Works')
    for (let i = 1; i <= 8; i++) {
      const num = String(i).padStart(3, '0');
      assetsData.push({
        code: `WLD-${num}`,
        kind: 'Welder',
        requiresCertification: 'Hot Works',
        serviceStatus: 'in_service',
        heldBy: null,
      });
    }

    // 8 Meters (require 'Electrical Safety')
    for (let i = 1; i <= 8; i++) {
      const num = String(i).padStart(3, '0');
      assetsData.push({
        code: `ELEC-${num}`,
        kind: 'Meter',
        requiresCertification: 'Electrical Safety',
        serviceStatus: 'in_service',
        heldBy: null,
      });
    }

    // 12 Drills (no cert required)
    for (let i = 1; i <= 12; i++) {
      const num = String(i).padStart(3, '0');
      assetsData.push({
        code: `DRL-${num}`,
        kind: 'Drill',
        requiresCertification: null,
        serviceStatus: i === 8 ? 'out_of_service' : 'in_service',
        heldBy: null,
      });
    }

    // 10 Levels (no cert required)
    for (let i = 1; i <= 10; i++) {
      const num = String(i).padStart(3, '0');
      assetsData.push({
        code: `LVL-${num}`,
        kind: 'Level',
        requiresCertification: null,
        serviceStatus: 'in_service',
        heldBy: null,
      });
    }

    const createdAssets = await this.assetModel.insertMany(assetsData);
    const assetMap = new Map<string, any>();
    for (const a of createdAssets) {
      assetMap.set(a.code, a);
    }
    console.log(`Seeded ${createdAssets.length} assets.`);

    // 4. Seed Movements (30 days of movements)
    // Requirements: ordinary issues and returns, outstanding issues, overdue item, late-logged entry, correction
    const movementsToInsert: any[] = [];

    // Helper to generate movement object
    const createMovement = (data: {
      _id?: Types.ObjectId;
      assetCode: string;
      workerName: string | null;
      type: string;
      occurredAt: Date;
      recordedAt: Date;
      idempotencyKey?: string;
      reason?: string | null;
      correctedBy?: Types.ObjectId | null;
      correctionOf?: Types.ObjectId | null;
    }) => {
      const asset = assetMap.get(data.assetCode)!;
      const worker = data.workerName ? workerMap.get(data.workerName) : null;
      return {
        _id: data._id || new Types.ObjectId(),
        assetId: asset._id,
        workerId: worker ? worker._id : null,
        type: data.type,
        occurredAt: data.occurredAt,
        recordedAt: data.recordedAt,
        idempotencyKey: data.idempotencyKey || randomUUID(),
        reason: data.reason || null,
        correctedBy: data.correctedBy || null,
        correctionOf: data.correctionOf || null,
      };
    };

    // Ordinary completed cycles
    // Cycle 1: HARN-002
    movementsToInsert.push(
      createMovement({
        assetCode: 'HARN-002',
        workerName: 'Worker 1',
        type: 'issue',
        occurredAt: d(-28, 8),
        recordedAt: d(-28, 8),
        reason: 'Issued for scaffold inspection',
      }),
      createMovement({
        assetCode: 'HARN-002',
        workerName: 'Worker 1',
        type: 'return',
        occurredAt: d(-25, 17),
        recordedAt: d(-25, 17),
        reason: 'Returned in good condition',
      }),
    );

    // Cycle 2: GAS-001
    movementsToInsert.push(
      createMovement({
        assetCode: 'GAS-001',
        workerName: 'Worker 4',
        type: 'issue',
        occurredAt: d(-22, 9),
        recordedAt: d(-22, 9),
        reason: 'Basement vault entry',
      }),
      createMovement({
        assetCode: 'GAS-001',
        workerName: 'Worker 4',
        type: 'return',
        occurredAt: d(-20, 16),
        recordedAt: d(-20, 16),
        reason: 'Returned cleanly',
      }),
    );

    // Cycle 3: WLD-001
    movementsToInsert.push(
      createMovement({
        assetCode: 'WLD-001',
        workerName: 'Worker 3',
        type: 'issue',
        occurredAt: d(-18, 10),
        recordedAt: d(-18, 10),
        reason: 'Pipe junction welding',
      }),
      createMovement({
        assetCode: 'WLD-001',
        workerName: 'Worker 3',
        type: 'return',
        occurredAt: d(-15, 15),
        recordedAt: d(-15, 15),
        reason: 'Job complete',
      }),
    );

    // Cycle 4: DRL-003
    movementsToInsert.push(
      createMovement({
        assetCode: 'DRL-003',
        workerName: 'Worker 5',
        type: 'issue',
        occurredAt: d(-14, 8),
        recordedAt: d(-14, 8),
        reason: 'Floor penetrations',
      }),
      createMovement({
        assetCode: 'DRL-003',
        workerName: 'Worker 5',
        type: 'return',
        occurredAt: d(-11, 16),
        recordedAt: d(-11, 16),
        reason: 'Returned to shelf',
      }),
    );

    // Cycle 5: ELEC-001
    movementsToInsert.push(
      createMovement({
        assetCode: 'ELEC-001',
        workerName: 'Worker 6',
        type: 'issue',
        occurredAt: d(-10, 8),
        recordedAt: d(-10, 8),
        reason: 'Switchboard testing',
      }),
      createMovement({
        assetCode: 'ELEC-001',
        workerName: 'Worker 6',
        type: 'return',
        occurredAt: d(-8, 14),
        recordedAt: d(-8, 14),
        reason: 'Testing concluded',
      }),
    );

    // Late-logged entry (Requirement: at least one late-logged entry where recordedAt > occurredAt)
    // DRL-004 was returned at 09:00, but the store keeper logged it at 11:40
    movementsToInsert.push(
      createMovement({
        assetCode: 'DRL-004',
        workerName: 'Worker 10',
        type: 'issue',
        occurredAt: d(-7, 8),
        recordedAt: d(-7, 8),
      }),
      createMovement({
        assetCode: 'DRL-004',
        workerName: 'Worker 10',
        type: 'return',
        occurredAt: d(-6, 9), // Happened at 09:00
        recordedAt: d(-6, 11, 40), // Logged at 11:40
        reason: 'Returned at 09:00, logged at 11:40 by store keeper',
      }),
    );

    // Correction (Requirement: at least one correction with bidirectional pointers)
    // LVL-002 was wrongly issued to Worker 3, then corrected to Worker 1
    const origMovementId = new Types.ObjectId();
    const corrMovementId = new Types.ObjectId();

    movementsToInsert.push(
      createMovement({
        _id: origMovementId,
        assetCode: 'LVL-002',
        workerName: 'Worker 3',
        type: 'issue',
        occurredAt: d(-12, 9),
        recordedAt: d(-12, 9),
        reason: 'Survey work',
        correctedBy: corrMovementId,
      }),
      createMovement({
        _id: corrMovementId,
        assetCode: 'LVL-002',
        workerName: 'Worker 1',
        type: 'correction',
        occurredAt: d(-12, 9),
        recordedAt: d(-11, 10),
        correctionOf: origMovementId,
        reason: 'Correction: Assigned to Worker 1 instead of Worker 3',
      }),
      createMovement({
        assetCode: 'LVL-002',
        workerName: 'Worker 1',
        type: 'return',
        occurredAt: d(-5, 16),
        recordedAt: d(-5, 16),
        reason: 'Survey complete',
      }),
    );

    // Outstanding Issues (Requirement: a few still outstanding)
    // 1. HARN-001 held by Worker 1
    movementsToInsert.push(
      createMovement({
        assetCode: 'HARN-001',
        workerName: 'Worker 1',
        type: 'issue',
        occurredAt: d(-2, 9),
        recordedAt: d(-2, 9),
        reason: 'Roof repair',
      }),
    );
    await this.assetModel.updateOne(
      { code: 'HARN-001' },
      { $set: { heldBy: workerMap.get('Worker 1')!._id } },
    );

    // 2. GAS-002 held by Worker 4
    movementsToInsert.push(
      createMovement({
        assetCode: 'GAS-002',
        workerName: 'Worker 4',
        type: 'issue',
        occurredAt: d(-1, 8),
        recordedAt: d(-1, 8),
        reason: 'Tunnel gas monitoring',
      }),
    );
    await this.assetModel.updateOne(
      { code: 'GAS-002' },
      { $set: { heldBy: workerMap.get('Worker 4')!._id } },
    );

    // 3. DRL-001 held by Worker 5
    movementsToInsert.push(
      createMovement({
        assetCode: 'DRL-001',
        workerName: 'Worker 5',
        type: 'issue',
        occurredAt: d(0, -3),
        recordedAt: d(0, -3),
        reason: 'Concrete anchor holes',
      }),
    );
    await this.assetModel.updateOne(
      { code: 'DRL-001' },
      { $set: { heldBy: workerMap.get('Worker 5')!._id, lastIssuedAt: d(0, -3) } },
    );

    // Overdue Item (Requirement: at least one overdue)
    // LVL-001 issued 16 days ago to Worker 9 and never returned
    movementsToInsert.push(
      createMovement({
        assetCode: 'LVL-001',
        workerName: 'Worker 9',
        type: 'issue',
        occurredAt: d(-16, 9),
        recordedAt: d(-16, 9),
        reason: 'Site boundary levelling (overdue)',
      }),
    );
    await this.assetModel.updateOne(
      { code: 'LVL-001' },
      { $set: { heldBy: workerMap.get('Worker 9')!._id, lastIssuedAt: d(-16, 9) } },
    );

    // Out of service movements
    movementsToInsert.push(
      createMovement({
        assetCode: 'DRL-008',
        workerName: 'Worker 7',
        type: 'issue',
        occurredAt: d(-25, 9),
        recordedAt: d(-25, 9),
      }),
      createMovement({
        assetCode: 'DRL-008',
        workerName: 'Worker 7',
        type: 'return',
        occurredAt: d(-23, 15),
        recordedAt: d(-23, 15),
        reason: 'Motor smoked during drilling, taken out of service',
      }),
    );

    await this.movementModel.insertMany(movementsToInsert);
    console.log(`Seeded ${movementsToInsert.length} movements.`);

    // 5. Seed Reservations
    // Requirements: past and future reservations, including one never collected
    const reservationsData = [
      // Past fulfilled reservation
      {
        assetId: assetMap.get('HARN-002')!._id,
        workerId: workerMap.get('Worker 1')!._id,
        startAt: d(-29, 8),
        endAt: d(-24, 18),
        status: 'fulfilled',
        reason: 'Scaffold inspection reservation',
        idempotencyKey: randomUUID(),
      },
      // Past uncollected reservation (never collected)
      {
        assetId: assetMap.get('GAS-003')!._id,
        workerId: workerMap.get('Worker 8')!._id,
        startAt: d(-5, 9),
        endAt: d(-4, 17),
        status: 'active', // Past window, uncollected
        reason: 'Manhole inspection (uncollected, worker reassigned)',
        idempotencyKey: randomUUID(),
      },
      // Future reservation 1: DRL-002 window 1
      {
        assetId: assetMap.get('DRL-002')!._id,
        workerId: workerMap.get('Worker 10')!._id,
        startAt: d(2, 8),
        endAt: d(4, 17),
        status: 'active',
        reason: 'HVAC core drilling',
        idempotencyKey: randomUUID(),
      },
      // Future reservation 2: DRL-002 window 2 (adjacent, non-overlapping)
      {
        assetId: assetMap.get('DRL-002')!._id,
        workerId: workerMap.get('Worker 5')!._id,
        startAt: d(5, 8),
        endAt: d(7, 17),
        status: 'active',
        reason: 'Electrical riser coring',
        idempotencyKey: randomUUID(),
      },
      // Future reservation 3: HARN-003
      {
        assetId: assetMap.get('HARN-003')!._id,
        workerId: workerMap.get('Worker 1')!._id,
        startAt: d(1, 8),
        endAt: d(3, 17),
        status: 'active',
        reason: 'Tower crane maintenance',
        idempotencyKey: randomUUID(),
      },
    ];

    const reservations = await this.reservationModel.insertMany(reservationsData);
    console.log(`Seeded ${reservations.length} reservations.`);

    console.log('Seeding complete!');
  }
}
