import { Injectable } from '@nestjs/common';
import { Response } from 'express';

@Injectable()
export class ResponseService {
  public component: string = 'NotAsign';

  setComponent(value: string): void {
    this.component = value;
  }

  success(res: Response, message: any, code: number = 200) {
    return res.status(code).send({
      code: code,
      response: message,
    });
  }

  error(res: Response, message: any, status: number, e: any) {
    console.log(
      `[response error] - Component [${this.component}] - [detail] ${e}`,
    );
    return res.status(status).send({
      code: status,
      response: this.mapError(e),
    });
  }

  mapError(details: any): any {
    const data = {
      message: typeof details === 'object' ? details.message : details,
    };
    if (details.code) {
      switch (details.code) {
        case 11000:
          data.message = `El ${this.component} ya existe`;
          break;
        default:
          data.message = details.message;
          break;
      }
    }
    return data;
  }
}
