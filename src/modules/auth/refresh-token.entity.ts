import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '@/modules/users/user.entity';

@Entity('refresh_tokens')
export class RefreshToken {
  @ApiProperty({ description: 'id' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'token' })
  @Column({ unique: true })
  token: string;

  @ApiProperty({ description: 'user id' })
  @Column()
  userId: number;

  @ApiProperty({ description: 'expires at' })
  @Column()
  expiresAt: Date;

  @ApiProperty({ description: 'is revoked' })
  @Column({ default: false })
  isRevoked: boolean;

  @ApiProperty({ description: 'created at' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'updated at' })
  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
} 