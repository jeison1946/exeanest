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

  async getList(filter: any) {
    const {
      point_of_sale,
      name_rule,
      title,
      created_start,
      created_end,
      limit = 10,
      page = 1,
    } = filter || {};
    const filters: any = {};

    if (point_of_sale) filters.point_of_sale = point_of_sale;
    if (name_rule)
      filters.name_rule = { $regex: `^${filter.name_rule}`, $options: 'i' };
    if (title) filters.title = { $regex: `^${filter.title}`, $options: 'i' };
    if (created_start && created_end)
      filters.created = {
        $gte: new Date(filter.created_start),
        $lt: new Date(filter.created_end),
      };

    if (limit == 1) {
      return await this.model.findOne(filters, { password: 0, code_access: 0 });
    } else {
      const skip = (page - 1) * limit;
      const count = await this.model.countDocuments();
      const data = await this.model
        .find(filters, { password: 0, code_access: 0 })
        .skip(skip)
        .limit(limit);
      return {
        rows: data,
        pager: {
          total: count,
          pages: Math.ceil(count / limit),
          page: parseInt(page),
          nextPage: parseInt(page) + 1,
          previusPage: parseInt(page) - 1,
        },
      };
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
        key = await this.getRule(lastRule.rule_id, data, filter.pos, 0);
      }
      return {
        ruleId: key,
        id: key,
        name: data[key].nombre,
        song: data[key].song,
      };
    } else {
      throw Error('Tuvimos problemas al procesar la solicitud');
    }
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
      .catch(() => {
        return false;
      });
  }

  async getRule(
    rule: number,
    items: any[],
    pos: number,
    init: number,
    alreadyValid: boolean = false,
  ) {
    const key: any = this.nextItem(rule, items);
    const itemsObjectKeys = Object.keys(items);
    if (key) {
      const currentDate = new Date();
      currentDate.setUTCHours(currentDate.getUTCHours() - 5);
      const dateStart = new Date(items[key].fecha);
      dateStart.setUTCHours(currentDate.getUTCHours() - 5);
      const dateEnd = new Date(items[key].date_end);
      dateEnd.setUTCHours(currentDate.getUTCHours() - 5);
      const currentDay = currentDate.toLocaleDateString('en-US', {
        weekday: 'long',
      });
      switch (items[key].tipo) {
        case 'default':
          return key;
        case 'once':
          console.log(key, items[key].tipo);
          break;
        case 'weekdays':
          console.log(key, items[key].tipo);
          break;
        case 'monthly':
          console.log(key, items[key].tipo);
          break;
        case 'advanced':
          console.log(key, items[key].tipo);
          break;
        case 'minute':
          if (!alreadyValid) {
            const enabledDate = this.compareDates(
              currentDate,
              dateStart,
              dateEnd,
            );
            if (enabledDate && items[key].dias.length) {
              const enabledDay = items[key].dias.some(function (element) {
                return element.dias === currentDay;
              });
              if (enabledDay) {
                const ifListen = await this.model.findOne({
                  finish: false,
                  rule_id: key,
                  point_of_sale: pos,
                });
                if (!ifListen) {
                  return key;
                }
              }
            }
          }
          break;
        case 'hours':
          console.log(key, items[key].tipo);
          break;
        case 'hours_minute':
          console.log(key, items[key].tipo);
          break;
      }
      if (itemsObjectKeys.length == init) {
        let keyDefault: boolean | number = false;
        itemsObjectKeys.some(function (keyItem) {
          if (items[keyItem].tipo === 'default_not_rule') {
            keyDefault = parseInt(keyItem);
            return true;
          }
        });
        return keyDefault;
      }
      return await this.getRule(key, items, pos, init + 1, true);
    }
  }

  compareDates(currentDate: Date, startDate: Date, endDate: Date) {
    return currentDate >= startDate && currentDate <= endDate;
  }

  nextItem(rule: number, items: any[]): number | boolean {
    const claves = Object.keys(items);
    const indexFind = claves.findIndex((clave) => Number(clave) === rule);
    if (indexFind !== -1) {
      const posicionSiguiente = indexFind + 1;
      const siguienteClave =
        posicionSiguiente < claves.length
          ? claves[posicionSiguiente]
          : claves[0];
      return parseInt(siguienteClave);
    }
    return parseInt(claves[0]);
  }
}
