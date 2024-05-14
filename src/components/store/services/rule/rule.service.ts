import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Request } from 'express';
import fetch from 'node-fetch';
import { Rules } from '../../entities/rules/rules.entity';
import { Model } from 'mongoose';
import { RuletDto } from '../../dtos/rules/rule.dto';
import * as moment from 'moment-timezone';
import { SongRequest } from '../../entities/song_request/song_request.entity';

@Injectable()
export class RuleService {
  constructor(
    @InjectModel(Rules.name) private readonly model: Model<Rules>,
    @InjectModel(SongRequest.name)
    private readonly modelSongRequest: Model<SongRequest>,
  ) {}

  async create(data: RuletDto, request: Request): Promise<any> {
    const token: any =
      request.headers['x-auth-token'] || request.headers['x-user-token'];
    let statusUpdate: any;
    if (token) {
      const type = request.headers['x-auth-token'] ? 'web' : 'radio';
      if (data.rule_id == 0) {
        console.log(data.point_of_sale.toString(), data.song_id.toString());
        data.type = 'user_request';
        statusUpdate = await this.modelSongRequest.findOne({
          pos: data.point_of_sale.toString(),
          id: data.song_id.toString(),
          finish: false,
        });
        statusUpdate.finish = true;
        statusUpdate.save();
      } else {
        data.type = 'rules_default';
        const filters = {
          point_of_sale: data.point_of_sale,
          rule_id: data.rule_id,
        };
        const items = await this.model.find(filters);
        if (items.length) {
          for (const item of items) {
            await this.model.findByIdAndUpdate(item._id, {
              finish: true,
            });
          }
        }
        const dataBody = {
          rule_id: data.rule_id,
          pos_id: data.point_of_sale,
        };
        statusUpdate = await this.updateCaheData(dataBody, token, type);
      }
      if (statusUpdate) {
        const currentDate = new Date();
        currentDate.setUTCHours(currentDate.getUTCHours() - 5);
        data.created = currentDate;
        const newEntity = new this.model(data);
        return await newEntity.save();
      }
    }
    throw Error('Tuvimos problemas al actualizar la información');
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
      return await this.model
        .findOne(filters, { password: 0, code_access: 0 })
        .sort({ created: -1 });
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
    const token: any =
      request.headers['x-auth-token'] || request.headers['x-user-token'];
    if (token) {
      const type = request.headers['x-auth-token'] ? 'web' : 'radio';
      const ruleRequest = await this.modelSongRequest
        .findOne({ pos: filter.pos.toString(), finish: false })
        .sort({ created: 1 });
      if (ruleRequest) {
        return {
          ruleId: 0,
          id: 0,
          name: 'Solicitado por usuario',
          song: ruleRequest,
          rules_hours: [],
        };
      } else {
        const data = await this.getRulesCms(filter.pos, token, type);
        const lastRule = await this.model
          .findOne({ point_of_sale: filter.pos, type: { $ne: 'user_request' } })
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
          rules_hours: this.getAdvanceHour(data),
        };
      }
    } else {
      throw Error('Tuvimos problemas al procesar la solicitud');
    }
  }

  async getRulesCms(
    id: number,
    token: string,
    type: string = 'web',
  ): Promise<any> {
    let header: any = {
      'Content-Type': 'application/json',
      'X-AUTH-TOKEN': token,
    };
    if (type == 'radio') {
      header = {
        'Content-Type': 'application/json',
        'X-USER-TOKEN': token,
      };
    }
    return await fetch(`${process.env.CMS}/api/v1/pos/rules?id=${id}`, {
      method: 'GET',
      headers: header,
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

  async updateCaheData(data: any, token: string, type: string = 'web') {
    let header: any = {
      'Content-Type': 'application/json',
      'X-AUTH-TOKEN': token,
    };
    if (type == 'radio') {
      header = {
        'Content-Type': 'application/json',
        'X-USER-TOKEN': token,
      };
    }
    return await fetch(`${process.env.CMS}/api/v1/pos/rules`, {
      method: 'PATCH',
      headers: header,
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
      const currentDate = moment();
      const dateStart = moment(items[key].fecha);
      const dateEnd = moment(items[key].date_end).set({ hour: 23, minute: 59 });
      const currentDay = currentDate.format('dddd');
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
    currentDate: moment.Moment,
    currentDay: string,
  ): Promise<number | boolean> {
    const arrayValues = Object.values(items);
    const rules = [];
    const rowsLoad = [];
    arrayValues.forEach((element) => {
      if (element.tipo == 'minute' || element.tipo == 'hours_minute') {
        const dateStart = moment(element.fecha);
        const dateEnd = moment(element.date_end).set({ hour: 23, minute: 59 });
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
    currentDate: moment.Moment,
    init: number,
  ): number | boolean {
    const minute = load.repeat;
    const dateItem = moment(load.created).add(5, 'hours');
    dateItem.add(parseInt(minute), 'minutes');
    if (currentDate.isAfter(dateItem)) return load.rule_id;
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
    const currentDate = moment();
    const currentDay = currentDate.format('dddd');
    const data = Object.values(items);
    const result = {};
    data.forEach((item) => {
      if (item.tipo == 'advanced') {
        const dateStart = moment(item.fecha);
        const dateEnd = moment(item.date_end).set({ hour: 23, minute: 59 });
        const enabledDate = this.compareDates(currentDate, dateStart, dateEnd);
        if (enabledDate) {
          const enabledDay = item.dias.some(function (element: any) {
            return element.dias === currentDay;
          });
          if (enabledDay) {
            const hoursEnabled = [];
            item.horas.forEach((hour: any) => {
              const partesHora = hour.horas.split(':');
              const horaDeseada = currentDate;
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

  compareDates(
    currentDate: moment.Moment,
    startDate: moment.Moment,
    endDate: moment.Moment,
  ) {
    return (
      currentDate.valueOf() >= startDate.valueOf() &&
      currentDate.valueOf() <= endDate.valueOf()
    );
  }

  compareHours(hourStart: string, hourEnd: string) {
    // Get the current time
    const now = moment();
    const startTime = moment();
    const startTimeParts = hourStart.split(':');
    startTime.set({
      hour: parseInt(startTimeParts[0]),
      minute: parseInt(startTimeParts[1]),
      second: 0,
    });

    const endTime = moment();
    const endTimeParts = hourEnd.split(':');
    endTime.set({
      hour: parseInt(endTimeParts[0]),
      minute: parseInt(endTimeParts[1]),
      second: 0,
    });
    return (
      now.valueOf() >= startTime.valueOf() && now.valueOf() <= endTime.valueOf()
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
