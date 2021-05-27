import {MigrationInterface, QueryRunner} from "typeorm";

export class InitUsers1621753068278 implements MigrationInterface {
    name = 'InitUsers1621753068278'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "users" ("username" character varying(64) NOT NULL, "displayName" character varying(64) NOT NULL, "email" citext NOT NULL, "emailValidated" boolean NOT NULL, "hash" character varying NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "PK_78a916df40e02a9deb1c4b75edb" PRIMARY KEY ("username"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "users"`);
    }

}
