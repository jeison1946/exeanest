import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Request } from 'express';
import fetch from 'node-fetch';
import { Rules } from '../../entities/rules/rules.entity';
import { Model } from 'mongoose';
import { RuletDto } from '../../dtos/rules/rule.dto';
import * as moment from 'moment-timezone';

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
        .sort({ created: -1 })
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
      const now = new Date();
      now.setUTCHours(now.getUTCHours() - 5);
      return {
        ruleId: key,
        id: key,
        name: data[key].nombre,
        song: data[key].song,
        rules_hours: this.getAdvanceHour(data),
        now: now,
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
      const currentDay = currentDate.toLocaleDateString('en-US', {
        weekday: 'long',
      });
      const dateStart = new Date(items[key].fecha);
      dateStart.setUTCHours(dateStart.getUTCHours() - 5);
      const dateEnd = new Date(items[key].date_end);
      dateEnd.setUTCHours(dateEnd.getUTCHours() - 5);
      const enabledDate = this.compareDates(currentDate, dateStart, dateEnd);
      if (!alreadyValid) {
        const rulePendingMinute = await this.pendingMinutes(
          items,
          pos,
          currentDate,
          currentDay,
        );
        if (rulePendingMinute) return rulePendingMinute;
      }
      switch (items[key].tipo) {
        case 'default':
          return key;
        case 'weekdays':
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
          break;
        case 'minute':
          //
          if (!alreadyValid) {
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
          if (enabledDate && items[key].dias.length) {
            const enabledDay = items[key].dias.some(function (element) {
              return element.dias === currentDay;
            });
            if (enabledDay) {
              const enableHours = this.compareHours(
                items[key].hora_inicio,
                items[key].hora_fin,
              );
              if (enableHours) {
                return key;
              }
            }
          }
          break;
        case 'hours_minute':
          if (!alreadyValid) {
            if (enabledDate && items[key].dias.length) {
              const enabledDay = items[key].dias.some(function (element) {
                return element.dias === currentDay;
              });
              if (enabledDay) {
                const enableHours = this.compareHours(
                  items[key].hora_inicio,
                  items[key].hora_fin,
                );
                if (enableHours) {
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
          }
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

  async pendingMinutes(
    items: any[],
    pos: number,
    currentDate: Date,
    currentDay: string,
  ): Promise<number | boolean> {
    const arrayValues = Object.values(items);
    const rules = [];
    const rowsLoad = [];
    arrayValues.forEach((element) => {
      if (element.tipo == 'minute' || element.tipo == 'hours_minute') {
        const dateStart = new Date(element.fecha);
        dateStart.setUTCHours(dateStart.getUTCHours() - 5);
        const dateEnd = new Date(element.date_end);
        dateEnd.setUTCHours(dateEnd.getUTCHours() - 5);
        const enabledDate = this.compareDates(currentDate, dateStart, dateEnd);
        if (enabledDate) {
          const enabledDay = element.dias.some(function (element: any) {
            return element.dias === currentDay;
          });
          if (enabledDay) {
            if (element.tipo == 'hours_minute') {
              const enableHours = this.compareHours(
                element.hora_inicio,
                element.hora_fin,
              );
              if (enableHours) {
                rules.push(element.rule_id);
              }
            } else {
              rules.push(element.rule_id);
            }
          }
        }
      }
    });

    if (rules.length) {
      const rulesLoad = await this.model
        .find({
          point_of_sale: pos,
          rule_id: { $in: rules },
          finish: false,
        })
        .limit(rules.length)
        .sort({ created: -1 });
      for (const ruleItem of rulesLoad) {
        const object: any = {
          created: ruleItem.created,
          rule_id: ruleItem.rule_id,
          repeat: items[ruleItem.rule_id].repeat,
        };
        rowsLoad.push(object);
      }
      if (rowsLoad.length) {
        rowsLoad.sort((a, b) => {
          return parseInt(a.repeat) - parseInt(b.repeat);
        });
        return this.getKeyByRecent(rowsLoad, rowsLoad[0], currentDate, 1);
      }
    }
    return false;
  }

  getKeyByRecent(
    rowsLoad: any[],
    load: any,
    currentDate: Date,
    init: number,
  ): number | boolean {
    const minute = load.repeat;
    const dateItem = load.created;
    dateItem.setMinutes(dateItem.getMinutes() + parseInt(minute));
    if (currentDate > dateItem) return load.rule_id;
    if (rowsLoad.length > 1) {
      if (rowsLoad.length != init) {
        const valuesSearch = rowsLoad.map((tObje) => tObje.rule_id);
        const nextRule = this.nextItemArrayMinutes(valuesSearch, load.rule_id);
        if (typeof nextRule == 'number') {
          return this.getKeyByRecent(
            rowsLoad,
            rowsLoad[nextRule],
            currentDate,
            init + 1,
          );
        }
      }
    }

    return false;
  }

  getAdvanceHour(items: any[]) {
    const currentDate = new Date();
    currentDate.setUTCHours(currentDate.getUTCHours() - 5);
    const currentDay = currentDate.toLocaleDateString('en-US', {
      weekday: 'long',
    });
    const data = Object.values(items);
    const result = {};
    data.forEach((item) => {
      if (item.tipo == 'advanced') {
        const dateStart = new Date(item.fecha);
        dateStart.setUTCHours(dateStart.getUTCHours() - 5);
        const dateEnd = new Date(item.date_end);
        dateEnd.setUTCHours(dateEnd.getUTCHours() - 5);
        const enabledDate = this.compareDates(currentDate, dateStart, dateEnd);
        if (enabledDate) {
          const enabledDay = item.dias.some(function (element: any) {
            return element.dias === currentDay;
          });
          if (enabledDay) {
            const hoursEnabled = [];
            item.horas.forEach((hour: any) => {
              const partesHora = hour.horas.split(':');
              const horaDeseada = moment();
              horaDeseada.set({
                hour: parseInt(partesHora[0]),
                minute: parseInt(partesHora[1]),
                second: 0,
              });
              hoursEnabled.push(horaDeseada.valueOf());
            });
            const hours = {
              id: item.playlist,
              name: item.nombre,
              hours: hoursEnabled,
            };
            result[item.rule_id] = hours;
          }
        }
      }
    });
    return result;
  }

  compareDates(currentDate: Date, startDate: Date, endDate: Date) {
    return currentDate >= startDate && currentDate <= endDate;
  }

  compareHours(hourStart: string, hourEnd: string) {
    // Get the current time
    const now = new Date();
    now.setUTCHours(now.getUTCHours() - 5);

    // Convert hora_inicio and hora_fin to Date objects
    const startTime = new Date();
    const startTimeParts = hourStart.split(':');
    startTime.setHours(parseInt(startTimeParts[0]));
    startTime.setMinutes(parseInt(startTimeParts[1]));
    startTime.setUTCHours(startTime.getUTCHours() - 5);

    const endTime = new Date();
    const endTimeParts = hourEnd.split(':');
    endTime.setHours(parseInt(endTimeParts[0], 10));
    endTime.setMinutes(parseInt(endTimeParts[1], 10));
    endTime.setUTCHours(endTime.getUTCHours() - 5);

    return (
      now.getTime() >= startTime.getTime() && now.getTime() <= endTime.getTime()
    );
  }

  nextItemArrayMinutes(array, valor) {
    const indice = array.indexOf(valor);
    if (indice !== -1 && indice < array.length - 1) {
      return indice + 1;
    } else {
      return false;
    }
  }

  nextItem(rule: number, items: any[]): number | boolean {
    const claves = Object.keys(items);
    const indexFind = claves.findIndex((clave) => Number(clave) === rule);
    if (indexFind !== -1) {
      const nextPosition = indexFind + 1;
      const nextKey =
        nextPosition < claves.length ? claves[nextPosition] : claves[0];
      return parseInt(nextKey);
    }
    return parseInt(claves[0]);
  }
}
