import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Number } from 'mongoose';

export type SongRequestDocument = HydratedDocument<SongRequest>;

@Schema()
export class SongRequest {
  @Prop({ type: Date, required: true })
  date: Date;

  @Prop({ type: String, required: true })
  title: string;

  @Prop({ type: String, required: true })
  album: string;

  @Prop({ type: String, required: true })
  artist: string;

  @Prop({ type: String, required: true })
  year: string;

  @Prop({ type: String, required: true })
  url: number;

  @Prop({ type: Number, required: true })
  file_size: number;

  @Prop({ type: String, required: true })
  id: string;

  @Prop({ type: String, required: true })
  pos: string;

  @Prop({ type: Boolean, default: false })
  finish: boolean;
}

const SongRequestModel = SchemaFactory.createForClass(SongRequest);
export const SongRequestSchema = SongRequestModel;
