import { BadGatewayException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '@/modules/users/users.service';
import { ConfigService } from '@nestjs/config';
import { PasswordHelper } from '@/common/helpers/password.helper';
import { RefreshTokenService } from './refresh-token.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private refreshTokenService: RefreshTokenService,
  ) {}

  async validateUser(username: string, password: string): Promise<any> {
    let user = await this.usersService.findByUsername(username);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user && (await PasswordHelper.comparePassword(password, user.password))) {
      const { password: _password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const accessPayload = { 
      sub: user.id,
      type: 'access'
    };
    
    const refreshPayload = { 
      sub: user.id,
      type: 'refresh'
    };
    
    const accessToken = this.jwtService.sign(accessPayload, { 
      expiresIn: this.configService.get('JWT_EXPIRES_IN') 
    });
    
    const refreshToken = this.jwtService.sign(refreshPayload, { 
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN') 
    });

    // Calculate refresh token expiration date
    const refreshExpiresIn = this.configService.get('JWT_REFRESH_EXPIRES_IN');
    const expiresAt = new Date();
    if (refreshExpiresIn.includes('d')) {
      expiresAt.setDate(expiresAt.getDate() + parseInt(refreshExpiresIn));
    } else if (refreshExpiresIn.includes('h')) {
      expiresAt.setHours(expiresAt.getHours() + parseInt(refreshExpiresIn));
    } else if (refreshExpiresIn.includes('m')) {
      expiresAt.setMinutes(expiresAt.getMinutes() + parseInt(refreshExpiresIn));
    }

    // Save refresh token to database
    await this.refreshTokenService.create(refreshToken, user.id, expiresAt);
    
    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
      },
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      // First check if token exists and is valid in database
      const isValid = await this.refreshTokenService.isTokenValid(refreshToken);
      if (!isValid) {
        throw new Error('Invalid or revoked refresh token');
      }

      const payload = this.jwtService.verify(refreshToken);
      
      if (payload.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      const user = await this.usersService.findById(payload.sub);
      if (!user) {
        throw new Error('User not found');
      }

      // Revoke the old refresh token
      await this.refreshTokenService.revokeToken(refreshToken);

      const accessPayload = { 
        sub: user.id,
        type: 'access'
      };

      const newRefreshPayload = { 
        sub: user.id,
        type: 'refresh'
      };

      const newAccessToken = this.jwtService.sign(accessPayload, { 
        expiresIn: this.configService.get('JWT_EXPIRES_IN') 
      });
      
      const newRefreshToken = this.jwtService.sign(newRefreshPayload, { 
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN') 
      });

      // Calculate new refresh token expiration date
      const refreshExpiresIn = this.configService.get('JWT_REFRESH_EXPIRES_IN');
      const expiresAt = new Date();
      if (refreshExpiresIn.includes('d')) {
        expiresAt.setDate(expiresAt.getDate() + parseInt(refreshExpiresIn));
      } else if (refreshExpiresIn.includes('h')) {
        expiresAt.setHours(expiresAt.getHours() + parseInt(refreshExpiresIn));
      } else if (refreshExpiresIn.includes('m')) {
        expiresAt.setMinutes(expiresAt.getMinutes() + parseInt(refreshExpiresIn));
      }

      // Save new refresh token to database
      await this.refreshTokenService.create(newRefreshToken, user.id, expiresAt);

      return {
        access_token: newAccessToken,
        refresh_token: newRefreshToken,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
        },
      };
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  async logout(refreshToken: string) {
    try {
      // Revoke the refresh token
      await this.refreshTokenService.revokeToken(refreshToken);
      return { message: 'Logged out successfully' };
    } catch (error) {
      throw new Error('Logout failed');
    }
  }

  async logoutAll(userId: number) {
    try {
      // Revoke all refresh tokens for the user
      await this.refreshTokenService.revokeAllUserTokens(userId);
      return { message: 'Logged out from all devices successfully' };
    } catch (error) {
      throw new Error('Logout from all devices failed');
    }
  }
}
