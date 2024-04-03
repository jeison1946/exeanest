import { ResponseService } from '@customServices/response/response.service';
import { Body, Controller, Get, Post, Query, Req, Res } from '@nestjs/common';
import { Response, Request } from 'express';
import { RuleService } from '../../services/rule/rule.service';
import { RuletDto } from '../../dtos/rules/rule.dto';

@Controller('rules')
export class RulesController {
  compoentId: string = 'Rules';
  constructor(
    private responseService: ResponseService,
    private ruleService: RuleService,
  ) {}

  @Post()
  async postCreate(
    @Body() body: RuletDto,
    @Res() res: Response,
    @Req() request: Request,
  ) {
    await this.ruleService
      .create(body, request)
      .then((data) => {
        this.responseService.success(res, data);
      })
      .catch((e) => {
        this.responseService.error(res, 500, e, this.compoentId);
      });
  }

  @Get()
  async get(
    @Query() query: { pos: number },
    @Req() request: Request,
    @Res() res: Response,
  ) {
    await this.ruleService
      .get(query, request)
      .then((data) => {
        this.responseService.success(res, data);
      })
      .catch((e) => {
        this.responseService.error(res, 500, e, this.compoentId);
      });
  }

  @Get('/logs')
  async listLogs(@Query() query, @Res() res: Response) {
    await this.ruleService
      .getList(query)
      .then((data) => {
        this.responseService.success(res, data);
      })
      .catch((e) => {
        this.responseService.error(res, 500, e, this.compoentId);
      });
  }
}
