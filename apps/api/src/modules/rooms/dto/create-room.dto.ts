import {
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from "class-validator";
import { RoomType } from "@repo/types";

export class CreateRoomDto {
  @IsInt()
  @IsPositive()
  roomNumber!: number;

  @IsIn(["Single", "Double", "Twin"])
  type!: RoomType;

  @IsInt()
  @IsPositive()
  floor!: number;

  @IsNumber()
  @IsPositive()
  roomRate!: number;

  @IsString()
  @MaxLength(500)
  imagelink!: string;

  @IsString()
  @MaxLength(100)
  size!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  additional1?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  additional2?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  additional3?: string;
}
