import { ResponseService } from '@customServices/response/response.service';
import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { LiveService } from '../../services/live/live.service';

@Controller('store/live')
export class LiveController {
  private startTime: number = null;
  constructor(
    private responseService: ResponseService,
    private liveService: LiveService,
  ) {
    responseService.setComponent('Live');
  }

  @Get(':id')
  async getLiveSong(@Res() res: Response) {
    const Response = await this.liveService.live();
    const stream = Response.data;
    res.set('Content-Type', 'audio/mp3');
    res.set('Accept-Ranges', 'bytes');
    res.set(
      'Content-Range',
      `bytes 60000-${Response.headers['content-length']}/*`,
    );

    stream.on('data', (chunk) => {
      res.write(chunk);
    });

    stream.on('error', () => {
      res.sendStatus(404);
    });

    stream.on('end', () => {
      res.end();
    });
  }
}
