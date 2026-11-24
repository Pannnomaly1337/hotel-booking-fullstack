import { IsOptional, IsString } from "class-validator";

export class CheckInDto {
  @IsOptional()
  @IsString()
  roomId?: string;
}
