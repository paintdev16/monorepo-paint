import { IsEmail, IsString, Length, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class CredentialsDto {
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @IsString()
  @Length(12, 256)
  password!: string;
}

export class RegisterDto extends CredentialsDto {
  @Transform(({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @Length(1, 100)
  name!: string;
}

export class RefreshDto {
  @IsString()
  @Length(40, 200)
  refreshToken!: string;
}

export class ChangePasswordDto {
  @IsString()
  @Length(12, 256)
  currentPassword!: string;

  @IsString()
  @Length(12, 256)
  newPassword!: string;
}
