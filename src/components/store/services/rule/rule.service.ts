import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Request } from 'express';
import fetch from 'node-fetch';
import { Rules } from '../../entities/rules/rules.entity';
import { Model } from 'mongoose';
import { RuletDto } from '../../dtos/rules/rule.dto';

@Injectable()
export class RuleService {
  constructor(@InjectModel(Rules.name) private readonly model: Model<Rules>) {}

  async create(data: RuletDto, request: Request): Promise<any> {
    const token: any = request.headers['x-auth-token'];
    const filters = {
      point_of_sale: data.point_of_sale,
      rule_id: data.rule_id,
    };
    const items = await this.model.find(filters);
    for (const item of items) {
      await this.model.findByIdAndUpdate(item._id, {
        finish: true,
      });
    }
    const dataBody = {
      rule_id: data.rule_id,
      pos_id: data.point_of_sale,
    };
    const statusUpdate = await this.updateCaheData(dataBody, token);
    if (statusUpdate) {
      const newEntity = new this.model(data);
      return await newEntity.save();
    } else {
      throw Error('Tuvimos problemas al actualizar la información');
    }
  }

  async get(filter: { pos: number }, request: Request) {
    const token: any = request.headers['x-auth-token'];
    if (token) {
      const data = await this.getRulesCms(filter.pos, token);
      const lastRule = await this.model
        .findOne({ point_of_sale: filter.pos })
        .sort({ created: -1 });
      let key: any = 0;
      if (!lastRule) {
        key = Object.keys(data)[0];
      } else {
        key = this.getRule(lastRule.rule_id, data, filter.pos, 0);
      }
      return {
        ruleId: key,
        id: key,
        name: data[key].nombre,
        song: data[key].song,
      };
    }
    throw Error('Tuvimos problemas al procesar la solicitud');
  }

  async getRulesCms(id: number, token: string): Promise<any> {
    return await fetch(`${process.env.CMS}/api/v1/pos/rules?id=${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-AUTH-TOKEN': token,
      },
    })
      .then(async (response) => {
        if (response.status == 200) {
          const data = await response.json();
          return data.payload;
        }
      })
      .catch(() => {
        return {};
      });
  }

  async updateCaheData(data: any, token: string) {
    return await fetch(`${process.env.CMS}/api/v1/pos/rules`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-AUTH-TOKEN': token,
      },
      body: JSON.stringify(data),
    })
      .then(async (response) => {
        if (response.status == 200) {
          return true;
        }
      })
      .catch((e) => {
        return false;
      });
  }

  getRule(rule: number, items: [], pos: number, init: number) {
    const claves = Object.keys(items);
    const indexFind = claves.findIndex((clave) => Number(clave) === rule);
    if (indexFind !== -1) {
      const posicionSiguiente = indexFind + 1;
      const siguienteClave =
        posicionSiguiente < claves.length
          ? claves[posicionSiguiente]
          : claves[0];
      return siguienteClave;
    }
    return false;
  }
}
