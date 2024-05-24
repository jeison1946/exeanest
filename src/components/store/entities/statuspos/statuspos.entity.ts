import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type StatusPosDocument = HydratedDocument<StatusPos>;

@Schema()
export class StatusPos {
  @Prop({ required: true, index: true })
  pos: number;

  @Prop({ required: true, index: true })
  status: boolean;

  @Prop({ required: true, index: true })
  client: string;

  @Prop({ required: true, index: true })
  date: Date;
}

const StatusPosModel = SchemaFactory.createForClass(StatusPos);

export const StatusPosSchema = StatusPosModel;
