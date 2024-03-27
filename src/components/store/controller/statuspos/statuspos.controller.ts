import { Controller, Get, Query, Res } from '@nestjs/common';
import { StatusposService } from '../../services/statuspos/statuspos.service';
import { ResponseService } from '@customServices/response/response.service';
import { Response } from 'express';

@Controller('statuspos')
export class StatusposController {
  constructor(
    private statusposService: StatusposService,
    private responseService: ResponseService,
  ) {}

  @Get()
  async get(@Query() query, @Res() res: Response) {
    await this.statusposService
      .get(query)
      .then((data) => {
        this.responseService.success(res, data);
      })
      .catch((e) => {
        this.responseService.error(res, 500, e, 'StatusPos');
      });
  }
}
