import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Number } from 'mongoose';

export type RulesDocument = HydratedDocument<Rules>;

@Schema()
export class Rules {
  @Prop({ type: Date, required: true, index: true })
  created: Date;

  @Prop({ type: String, required: true })
  title: string;

  @Prop({ type: String, required: true })
  author: string;

  @Prop({ type: Number, required: true })
  song_id: number;

  @Prop({ type: Number, required: true, index: true })
  point_of_sale: number;

  @Prop({ type: Number, required: true, index: true })
  rule_id: number;

  @Prop({ type: String, required: true })
  name_rule: string;

  @Prop({ type: Boolean, default: false, index: true })
  finish: boolean;

  @Prop({ type: String, required: true, index: true })
  type: string;
}

const RulesModel = SchemaFactory.createForClass(Rules);
export const RulesSchema = RulesModel;
