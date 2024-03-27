import { Response } from 'express';
export class ResponseService {
  success(res: Response, message: any, code: number = 200) {
    return res.status(code).send({
      code: code,
      response: message,
    });
  }

  error(res: Response, status: number, e: any, componentId: string) {
    console.log(
      `[response error] - Component [${componentId}] - [detail] ${e}`,
    );
    return res.status(status).send({
      code: status,
      response: this.mapError(e, componentId),
    });
  }

  mapError(details: any, componentId): any {
    const data = {
      message: typeof details === 'object' ? details.message : details,
    };
    if (details.code) {
      switch (details.code) {
        case 11000:
          data.message = `El ${componentId} ya existe`;
          break;
        default:
          data.message = details.message;
          break;
      }
    }
    return data;
  }
}
