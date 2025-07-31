import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateInitialTables1700000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create users table
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'username',
            type: 'varchar',
            isUnique: true,
          },
          {
            name: 'password',
            type: 'varchar',
          },
          {
            name: 'email',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create messages table
    await queryRunner.createTable(
      new Table({
        name: 'messages',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            isPrimary: true,
          },
          {
            name: 'content',
            type: 'text',
          },
          {
            name: 'type',
            type: 'text',
            default: "'text'",
          },
          {
            name: 'senderId',
            type: 'integer',
          },
          {
            name: 'receiverId',
            type: 'integer',
          },
          {
            name: 'isRead',
            type: 'boolean',
            default: false,
          },
          {
            name: 'createdAt',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create refresh_tokens table
    await queryRunner.createTable(
      new Table({
        name: 'refresh_tokens',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'token',
            type: 'varchar',
            isUnique: true,
          },
          {
            name: 'userId',
            type: 'integer',
          },
          {
            name: 'expiresAt',
            type: 'datetime',
          },
          {
            name: 'isRevoked',
            type: 'boolean',
            default: false,
          },
          {
            name: 'createdAt',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Add foreign key constraints
    await queryRunner.createForeignKey(
      'messages',
      new TableForeignKey({
        columnNames: ['senderId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'messages',
      new TableForeignKey({
        columnNames: ['receiverId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'refresh_tokens',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys first
    const messagesTable = await queryRunner.getTable('messages');
    const refreshTokensTable = await queryRunner.getTable('refresh_tokens');
    
    if (messagesTable) {
      const senderForeignKey = messagesTable.foreignKeys.find(fk => fk.columnNames.indexOf('senderId') !== -1);
      const receiverForeignKey = messagesTable.foreignKeys.find(fk => fk.columnNames.indexOf('receiverId') !== -1);
      
      if (senderForeignKey) {
        await queryRunner.dropForeignKey('messages', senderForeignKey);
      }
      if (receiverForeignKey) {
        await queryRunner.dropForeignKey('messages', receiverForeignKey);
      }
    }

    if (refreshTokensTable) {
      const userForeignKey = refreshTokensTable.foreignKeys.find(fk => fk.columnNames.indexOf('userId') !== -1);
      if (userForeignKey) {
        await queryRunner.dropForeignKey('refresh_tokens', userForeignKey);
      }
    }

    // Drop tables
    await queryRunner.dropTable('messages');
    await queryRunner.dropTable('refresh_tokens');
    await queryRunner.dropTable('users');
  }
} 