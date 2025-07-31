import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RefreshToken } from './refresh-token.entity';

@Injectable()
export class RefreshTokenService {
  constructor(
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
  ) {}

  async create(token: string, userId: number, expiresAt: Date): Promise<RefreshToken> {
    const refreshToken = this.refreshTokenRepository.create({
      token,
      userId,
      expiresAt,
    });
    return this.refreshTokenRepository.save(refreshToken);
  }

  async findByToken(token: string): Promise<RefreshToken | null> {
    return this.refreshTokenRepository.findOne({
      where: { token },
      relations: ['user'],
    });
  }

  async findByUserId(userId: number): Promise<RefreshToken[]> {
    return this.refreshTokenRepository.find({
      where: { userId },
    });
  }

  async revokeToken(token: string): Promise<void> {
    await this.refreshTokenRepository.update(
      { token },
      { isRevoked: true }
    );
  }

  async revokeAllUserTokens(userId: number): Promise<void> {
    await this.refreshTokenRepository.update(
      { userId },
      { isRevoked: true }
    );
  }

  async deleteExpiredTokens(): Promise<void> {
    const now = new Date();
    await this.refreshTokenRepository
      .createQueryBuilder()
      .delete()
      .where('expiresAt < :now', { now })
      .execute();
  }

  async isTokenValid(token: string): Promise<boolean> {
    const refreshToken = await this.findByToken(token);
    if (!refreshToken) {
      return false;
    }

    // Check if token is revoked
    if (refreshToken.isRevoked) {
      return false;
    }

    // Check if token is expired
    if (refreshToken.expiresAt < new Date()) {
      return false;
    }

    return true;
  }
} 