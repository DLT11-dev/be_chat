import { Role } from '@/common/enum/role';
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, IsNotEmpty, IsEnum, IsOptional, IsBoolean, ValidateIf, Min, IsNumber } from 'class-validator';
import { PrimaryGeneratedColumn } from 'typeorm';
import { Type } from 'class-transformer';

export class CreateUserDto {
  @ApiProperty({ description: 'username', example: 'username123' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ description: 'password', example: 'password123' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ description: 'email', example: 'user@example.com', required: false })
  @IsOptional()
  @ValidateIf((o) => o.email && o.email.trim() !== '')
  @IsEmail()
  email?: string;
}


export class UpdateUserDto {
    @ApiProperty({ description: 'email', example: 'user@example.com', required: false })
    @IsEmail()
    @IsOptional()
    email: string;
  
    @ApiProperty({ description: 'username', example: 'username123', required: false })
    @IsString()
    @IsOptional()
    username: string;
  
    @ApiProperty({
      description: 'fullName',
      example: 'Nguyen Van A',
      required: false,
    })
    @IsString()
    @IsOptional()
    fullName: string;
  
    @ApiProperty({
      description: 'role',
      enum: Role,
      default: Role.USER,
      required: false,
    })
    @IsEnum(Role)
    @IsOptional()
    role: Role;
  
    @ApiProperty({ description: 'isActive', example: true, required: false })
    @IsBoolean()
    @IsOptional()
    isActive: boolean;
  }

export class UserResponseDto {

    @ApiProperty({ description: 'id' })
    @PrimaryGeneratedColumn()
    id: number;
  
    @ApiProperty({ description: 'username', example: 'username123', required: false })
    @IsString()
    @IsOptional()
    username: string;
  
    @ApiProperty({
      description: 'fullName',
      example: 'Nguyen Van A',
      required: false,
    })
    @IsString()
    @IsEmail()
    email: string;
}


export class PaginationQueryDto {
  @ApiProperty({ description: 'Số lượng items trên mỗi trang', example: 20, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit: number = 20;

  @ApiProperty({ description: 'Số items bỏ qua', example: 0, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  offset: number = 0;
}

export class SearchQueryDto {
  @ApiProperty({ description: 'Từ khóa tìm kiếm', example: 'john', required: true })
  @IsString()
  @IsNotEmpty()
  q: string;

  @ApiProperty({ description: 'Số lượng kết quả tối đa', example: 20, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit: number = 20;
} 
  



