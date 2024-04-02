import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { StatusposService } from '../store/services/statuspos/statuspos.service';
import { Server } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: [
      'http://localhost:4200',
      'https://emisoras.local.com',
      'https://dev-epa.us.seedcloud.co',
      'https://dev-exea-player.seedcloud.co',
      'https://emisoras2.exeamedia.com',
      'https://emisora2.exeamedia.com',
    ],
    methods: ['GET', 'POST', 'DELETE', 'UPDATE', 'PATCH'],
    credentials: false,
  },
})
export class GatewaysGateway {
  @WebSocketServer() server: Server;
  constructor(private statusposService: StatusposService) {}

  async handleDisconnect(client: any) {
    const response = await this.statusposService.disconect(client.id);
    if (response) {
      this.server.emit('statusPointofsaleEvent', response);
    }
  }

  @SubscribeMessage('statusPointofsale')
  async statusPointofsale(client: any, payload: any): Promise<void> {
    const currentDate = new Date();
    currentDate.setUTCHours(currentDate.getUTCHours() - 5);
    const response = await this.statusposService.create({
      pos: payload.pos,
      status: payload.status,
      client: client.id,
      date: currentDate,
    });
    if (response) {
      this.server.emit('statusPointofsaleEvent', response);
    }
  }

  @SubscribeMessage('statusPointofsaleEvent')
  statusPointofsaleEvent(): void {}

  /* @SubscribeMessage('statusClient')
  statusClient(client: any, payload: any): void {} */
}
