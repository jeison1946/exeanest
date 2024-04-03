import { Module } from '@nestjs/common';
import { LiveController } from './controller/live/live.controller';
import { LiveService } from './services/live/live.service';
import { ResponseService } from '@customServices/response/response.service';
import { StatusposController } from './controller/statuspos/statuspos.controller';
import { StatusposService } from './services/statuspos/statuspos.service';
import { MongooseModule } from '@nestjs/mongoose';
import {
  StatusPos,
  StatusPosSchema,
} from './entities/statuspos/statuspos.entity';
import { RulesController } from './controller/rules/rules.controller';
import { RuleService } from './services/rule/rule.service';
import { Rules, RulesSchema } from './entities/rules/rules.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: StatusPos.name, schema: StatusPosSchema },
      { name: Rules.name, schema: RulesSchema },
    ]),
  ],
  providers: [ResponseService, LiveService, StatusposService, RuleService],
  controllers: [LiveController, StatusposController, RulesController],
})
export class StoreModule {}
