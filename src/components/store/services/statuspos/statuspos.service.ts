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

  async get(filter: any) {
    const posArray = filter.pos ? filter.pos.split(',') : [];
    const converInt = posArray.map((numero: string) => parseInt(numero));
    return await this.model.aggregate([
      // Filtrar los documentos para incluir solo los registros con pos igual a 102 o 103
      { $match: { pos: { $in: converInt } } },
      // Ordenar los documentos por fecha en orden descendente dentro de cada grupo de "pos"
      { $sort: { date: -1 } },
      // Agrupar los documentos por el campo "pos"
      { $group: { _id: '$pos', lastRecord: { $first: '$$ROOT' } } },
    ]);
  }

  async disconect(id: string) {
    const exist = await this.model.findOne({ client: id });
    if (exist) {
      const currentDate = new Date();
      currentDate.setUTCHours(currentDate.getUTCHours() - 5);
      const data = {
        pos: exist.pos,
        status: false,
        client: id,
        date: currentDate,
      };
      const newEntity = new this.model(data);
      await newEntity.save();
      return data;
    }
    return false;
  }
}
