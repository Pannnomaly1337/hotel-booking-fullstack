import { IsEmail, IsString, MinLength, MaxLength } from "class-validator";

/**
 * Registration input. Note there is NO `role` field — clients cannot
 * self-assign admin at signup. role always defaults to "user" in the DB.
 */
export class CreateUserDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  firstname!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  lastname!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8, { message: "Password must be at least 8 characters" })
  @MaxLength(128)
  password!: string;
}
