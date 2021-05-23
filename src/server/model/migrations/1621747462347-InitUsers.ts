import {MigrationInterface, QueryRunner} from "typeorm";

export class InitUsers1621747462347 implements MigrationInterface {
    name = 'InitUsers1621747462347'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "users" ("username" character varying NOT NULL, "displayName" character varying NOT NULL, "email" citext NOT NULL, "emailValidated" boolean NOT NULL, "hash" character varying NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_fe0bb3f6520ee0469504521e710" PRIMARY KEY ("username"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "users"`);
    }

}
