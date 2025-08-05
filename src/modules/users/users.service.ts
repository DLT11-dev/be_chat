import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { PasswordHelper } from '@/common/helpers/password.helper';
import { CreateUserDto, UpdateUserDto, UserResponseDto } from './dto/user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const {  username, password, email} = createUserDto;

    const existingUsername = await this.usersRepository.findOne({
      where: { username },
    });
    if (existingUsername) {
      throw new ConflictException('Username already exists');
    }
    const hashedPassword = await PasswordHelper.hashPassword(password);

    const user = this.usersRepository.create({
      username,
      password: hashedPassword,
      email,
    });

    const savedUser = await this.usersRepository.save(user);

    delete savedUser.password;
    return savedUser;
  }

  async findByUsername(username: string): Promise<User| null> {
    return this.usersRepository.findOne({ where: { username } });
  }


  async findById(id: number): Promise<UserResponseDto> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    delete user.password;
    return user;
  }

  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.usersRepository.find();
    return users.map((user) => {
      delete user.password;
      return user;
    });
  }

  async findAllExceptCurrent(currentUserId: number, limit: number = 20, offset: number = 0): Promise<UserResponseDto[]> {
    
    const users = await this.usersRepository
      .createQueryBuilder('user')
      .select(['user.id', 'user.username', 'user.email', 'user.createdAt', 'user.updatedAt'])
      .where('user.id != :currentUserId', { currentUserId })
      .orderBy('user.username', 'ASC')
      .skip(offset)
      .take(limit)
      .getMany();
    
    return users;
  }

  async searchUsers(query: string, limit: number = 10, currentUserId: number): Promise<UserResponseDto[]> {
    if (!query || query.trim().length === 0) {
      return this.findAllExceptCurrent(currentUserId);
    }

    const searchQuery = query.trim().toLowerCase();
    const searchWords = searchQuery.split(' ').filter(word => word.length > 0);

    // Tạo query builder để tìm kiếm linh hoạt
    const queryBuilder = this.usersRepository
      .createQueryBuilder('user')
      .select(['user.id', 'user.username', 'user.email', 'user.createdAt', 'user.updatedAt'])
      .where('user.id != :currentUserId', { currentUserId });

    // Tìm kiếm chỉ theo username
    if (searchWords.length > 0) {
      const whereConditions = searchWords.map((word, index) => {
        const paramName = `word${index}`;
        return `user.username LIKE :${paramName}`;
      });

      const parameters = searchWords.reduce((acc, word, index) => {
        acc[`word${index}`] = `%${word}%`;
        return acc;
      }, {});

      queryBuilder.andWhere(`(${whereConditions.join(' AND ')})`, parameters);
    }

    // Sắp xếp theo độ phù hợp (username bắt đầu với query trước)
    queryBuilder.orderBy(
      `CASE 
        WHEN user.username LIKE '${searchQuery}%' THEN 1
        WHEN user.username LIKE '%${searchQuery}%' THEN 2
        ELSE 3
      END`,
      'ASC'
    );

    // Giới hạn kết quả
    queryBuilder.limit(limit);

    const users = await queryBuilder.getMany();
    return users;
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const conflicts = [];
    if (updateUserDto.username && updateUserDto.username !== user.username) {
      conflicts.push({ username: updateUserDto.username });
    }

    if (conflicts.length > 0) {
      const existingUsers = await this.usersRepository.find({
        where: conflicts,
      });

      for (const existingUser of existingUsers) {
        if (existingUser.id !== id) {
          if (existingUser.username === updateUserDto.username) {
            throw new ConflictException('Username already exists');
          }
        }
      }
    }

    const updateData = {};
    Object.keys(updateUserDto).forEach(key => {
      if (updateUserDto[key] !== undefined) {
        updateData[key] = updateUserDto[key];
      }
    });

    await this.usersRepository.update(id, updateData);
    
    const updatedUser = await this.usersRepository.findOne({ where: { id } });
    delete updatedUser.password;
    return updatedUser;
  }

  async delete(id: number): Promise<UserResponseDto> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    await this.usersRepository.delete(id);
    return user;
  }
}
