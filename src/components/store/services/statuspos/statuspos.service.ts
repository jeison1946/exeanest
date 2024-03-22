import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { StatusPos } from '../../entities/statuspos/statuspos.entity';
import { Model } from 'mongoose';

@Injectable()
export class StatusposService {
  constructor(
    @InjectModel(StatusPos.name) private readonly model: Model<StatusPos>,
  ) {}

  async create(data: any): Promise<any> {
    const exist = await this.model
      .find({
        pos: data.pos,
        status: data.status,
        client: data.clien4t,
      })
      .limit(1)
      .sort({ date: -1 })
      .exec();
    if (!exist.length) {
      const newEntity = new this.model(data);
      await newEntity.save();
      return data;
    }
    return false;
  }

  async disconect(id: string) {
    const exist = await this.model.findOne({ client: id });
    if (exist) {
      const data = {
        pos: exist.pos,
        status: false,
        client: id,
      };
      const newEntity = new this.model(data);
      await newEntity.save();
      return data;
    }
    return false;
  }
}
