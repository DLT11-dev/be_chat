import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto, RefreshTokenDto, LogoutDto, LogoutAllDto } from './dto/auth.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    const { username, password } = loginDto;

    // Validate user
    const user = await this.authService.validateUser(username, password);
    if (!user) {
      throw new Error('incorrect login information');
    }

    // Generate token
    return this.authService.login(user);
  }

  @Post('refresh')
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto.refresh_token);
  }

  @Post('logout')
  async logout(@Body() logoutDto: LogoutDto) {
    return this.authService.logout(logoutDto.refresh_token);
  }

  @Post('logout-all')
  async logoutAll(@Body() logoutAllDto: LogoutAllDto) {
    return this.authService.logoutAll(logoutAllDto.userId);
  }
}
