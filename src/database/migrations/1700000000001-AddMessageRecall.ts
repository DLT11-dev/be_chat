import { MigrationInterface, QueryRunner } from "typeorm"

export class AddMessageRecall1700000000001 implements MigrationInterface {
    name = 'AddMessageRecall1700000000001'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "messages" ADD "isRecalled" boolean NOT NULL DEFAULT false`)
        await queryRunner.query(`ALTER TABLE "messages" ADD "recalledAt" TIMESTAMP`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "recalledAt"`)
        await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "isRecalled"`)
    }
} 