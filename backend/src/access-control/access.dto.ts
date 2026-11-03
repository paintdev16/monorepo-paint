import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayUnique, IsArray, IsInt, IsOptional, IsString, IsUUID, Matches, Max, MaxLength, Min, MinLength } from 'class-validator';

export class PageDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit = 20;
  @IsOptional() @IsString() @MaxLength(100) search?: string;
}
export class RoleCreateDto {
  @IsString() @Matches(/^[a-z][a-z0-9_]{0,63}$/) name: string;
  @IsOptional() @IsString() @MaxLength(500) description?: string;
}
export class RoleUpdateDto {
  @IsOptional() @IsString() @Matches(/^[a-z][a-z0-9_]{0,63}$/) name?: string;
  @IsOptional() @IsString() @MaxLength(500) description?: string;
}
export class PermissionCreateDto {
  @IsString() @MinLength(3) @MaxLength(100) @Matches(/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/) key: string;
  @IsOptional() @IsString() @MaxLength(500) description?: string;
}
export class PermissionUpdateDto {
  @IsOptional() @IsString() @MinLength(3) @MaxLength(100) @Matches(/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/) key?: string;
  @IsOptional() @IsString() @MaxLength(500) description?: string;
}
export class IdsDto {
  @IsArray() @ArrayUnique() @ArrayMaxSize(200) @IsUUID('4', { each: true }) ids: string[];
}
