import {
  MessageBody,
  WebSocketServer,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:4200', 'https://emisoras.local.com'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
})
export class StatusController {
  @WebSocketServer() server;
  public cllientId;

  @SubscribeMessage('checkStore')
  handleCheckStore(
    @MessageBody() data: { storeId: string; status: boolean },
  ): void {
    // Aquí deberías realizar la lógica para verificar si la tienda está activa
    this.cllientId = data.storeId;
    this.server.emit('getStatusStore', {
      pos: data.storeId,
      status: data.status,
    });
  }

  handleDisconnect(): void {
    if (this.cllientId) {
      this.server.emit('getStatusStore', {
        pos: this.cllientId,
        status: false,
      });
    }
  }
}
