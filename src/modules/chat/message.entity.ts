import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../users/user.entity';

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  content: string;

  @Column('text', { default: 'text' })
  type: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  sender: User;

  @Column()
  senderId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  receiver: User;

  @Column()
  receiverId: number;

  @Column({ default: false })
  isRead: boolean;

  @Column({ default: false })
  isRecalled: boolean;

  @Column({ nullable: true })
  recalledAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 