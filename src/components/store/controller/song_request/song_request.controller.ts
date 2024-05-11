import { ResponseService } from '@customServices/response/response.service';
import { Body, Controller, Get, Post, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { SongRequestService } from '../../services/song_request/song_request.service';
import { SongRequesttDto } from '../../dtos/song_request/song_request.dto';

@Controller('song-request')
export class SongRequestController {
  compoentId: string = 'SongRequest';
  constructor(
    private responseService: ResponseService,
    private songRequestService: SongRequestService,
  ) {}

  @Get()
  async get(@Query() query, @Res() res: Response) {
    await this.songRequestService
      .get(query)
      .then((data) => {
        this.responseService.success(res, data);
      })
      .catch((e) => {
        this.responseService.error(res, 500, e, 'StatusPos');
      });
  }

  @Post()
  async postCreate(@Body() body: SongRequesttDto, @Res() res: Response) {
    await this.songRequestService
      .create(body)
      .then((data) => {
        this.responseService.success(res, data);
      })
      .catch((e) => {
        this.responseService.error(res, 500, e, this.compoentId);
      });
  }
}
