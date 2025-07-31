import {
  Controller,
  Get,
  Post,
  Body,
  Request,
  Param,
  Delete,
  Patch,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto, UserResponseDto } from './dto/user.dto';
import { RequestModel } from '@/common/models/request.model';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('register')
  async register(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    return this.usersService.create(createUserDto);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getProfile(@Request() req: RequestModel): Promise<UserResponseDto> {
    return this.usersService.findById(req.user.id);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async findAll(@Request() req: RequestModel): Promise<UserResponseDto[]> {
    return this.usersService.findAllExceptCurrent(req.user.id);
  }

  @Get('search')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tìm kiếm người dùng' })
  @ApiResponse({ status: 200, description: 'Danh sách người dùng tìm được', type: [UserResponseDto] })
  async searchUsers(
    @Query('q') query: string,
    @Query('limit') limit: number = 10,
    @Request() req: RequestModel
  ): Promise<UserResponseDto[]> {
    return this.usersService.searchUsers(query, limit, req.user.id);
  }

  @Patch(':id')
  async update(@Param('id') id: number, @Body() updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  async delete(@Param('id') id: number): Promise<UserResponseDto> {
    return this.usersService.delete(id);
  }
}
