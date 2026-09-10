import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Worker, WorkerDocument } from './schemas/worker.schema.js';

@Injectable()
export class WorkersService {
  constructor(@InjectModel(Worker.name) private workerModel: Model<WorkerDocument>) {}

  async getWorkers() {
    return this.workerModel.find().exec();
  }
}
