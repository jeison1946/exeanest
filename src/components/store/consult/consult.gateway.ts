import {
  WebSocketServer,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';

@WebSocketGateway({
  cors: {
    origin: ['https://emisoras.local.com'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
})
export class ConsultGateway {
  @WebSocketServer() server;
  @SubscribeMessage('getStatusStore')
  handleConsult(): void {}
}
