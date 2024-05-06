import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Number } from 'mongoose';

export type RulesDocument = HydratedDocument<Rules>;

@Schema()
export class Rules {
  @Prop({ type: Date, required: true })
  created: Date;

  @Prop({ type: String, required: true })
  title: string;

  @Prop({ type: String, required: true })
  author: string;

  @Prop({ type: Number, required: true })
  song_id: number;

  @Prop({ type: Number, required: true })
  point_of_sale: number;

  @Prop({ type: Number, required: true })
  rule_id: number;

  @Prop({ type: String, required: true })
  name_rule: string;

  @Prop({ type: Boolean, default: false })
  finish: boolean;
}

const RulesModel = SchemaFactory.createForClass(Rules);
export const RulesSchema = RulesModel;
