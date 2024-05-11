import { Injectable } from '@nestjs/common';
import { SongRequesttDto } from '../../dtos/song_request/song_request.dto';
import { SongRequest } from '../../entities/song_request/song_request.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class SongRequestService {
  constructor(
    @InjectModel(SongRequest.name) private readonly model: Model<SongRequest>,
  ) {}
  async create(data: SongRequesttDto) {
    const last = await this.model
      .findOne({ pos: data.pos, id: data.id, finish: false })
      .sort({ date: 1 });

    if (last) {
      throw Error('Esta canción ya fue solicitada');
    } else {
      const currentDate = new Date();
      currentDate.setUTCHours(currentDate.getUTCHours() - 5);
      data.date = currentDate;
      const newEntity = new this.model(data);
      return await newEntity.save();
    }
  }

  async get(filter: any) {
    return this.model.find(filter);
  }
}
