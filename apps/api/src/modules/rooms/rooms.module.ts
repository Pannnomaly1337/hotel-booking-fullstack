import { Module } from "@nestjs/common";
import { RoomsController } from "./rooms.controller";
import { RoomsOpsController } from "./rooms-ops.controller";
import { RoomsService } from "./rooms.service";

@Module({
  controllers: [RoomsController, RoomsOpsController],
  providers: [RoomsService],
  exports: [RoomsService],
})
export class RoomsModule {}
