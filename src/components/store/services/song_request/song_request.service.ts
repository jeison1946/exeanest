import { Injectable } from '@nestjs/common';
import { SongRequesttDto } from '../../dtos/song_request/song_request.dto';
import { SongRequest } from '../../entities/song_request/song_request.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as moment from 'moment-timezone';

@Injectable()
export class SongRequestService {
  constructor(
    @InjectModel(SongRequest.name) private readonly model: Model<SongRequest>,
  ) {}
  async create(data: SongRequesttDto) {
    let flag = false;
    const last = await this.model
      .findOne({ pos: data.pos, id: data.id })
      .sort({ date: 1 });

    const currentDate = new Date();
    currentDate.setUTCHours(currentDate.getUTCHours() - 5);
    if (last) {
      if (!last.finish) {
        flag = true;
      } else {
        const providedDate = new Date(last.date);
        console.log(providedDate, currentDate);
        const diffInMs = currentDate.getTime() - providedDate.getTime();
        // Convertir la diferencia a minutos
        const diffInMinutes = diffInMs / (1000 * 60);
        if (diffInMinutes < 120) {
          flag = true;
        }
      }
    }

    if (flag) {
      throw Error('Esta canción ya fue solicitada');
    } else {
      data.date = currentDate;
      const newEntity = new this.model(data);
      return await newEntity.save();
    }
  }

  async get(filter: any) {
    return this.model.find(filter);
  }
}
