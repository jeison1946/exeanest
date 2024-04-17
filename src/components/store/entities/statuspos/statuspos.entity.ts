import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type StatusPosDocument = HydratedDocument<StatusPos>;

@Schema()
export class StatusPos {
  @Prop({ required: true })
  pos: number;

  @Prop({ required: true })
  status: boolean;

  @Prop({ required: true })
  client: string;

  @Prop({ required: true })
  date: Date;
}

const StatusPosModel = SchemaFactory.createForClass(StatusPos);

export const StatusPosSchema = StatusPosModel;
