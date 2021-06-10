import {MigrationInterface, QueryRunner} from "typeorm";

export class InitContests1623225915473 implements MigrationInterface {
    name = 'InitContests1623225915473'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "contests" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "ownerUsername" character varying(64), CONSTRAINT "CHK_031539991448565a99c94bcf72" CHECK ("name" <> ''), CONSTRAINT "PK_0b8012f5cf6f444a52179e1227a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "entries" ("id" SERIAL NOT NULL, "name" character varying(1024) NOT NULL, "creator" character varying(1024) NOT NULL, "url" character varying NOT NULL, "description" character varying(65536) NOT NULL, "contestId" integer, CONSTRAINT "UQ_EntryPerContest" UNIQUE ("contestId", "name"), CONSTRAINT "CHK_2b2c322ba0f778ef5f30ccfec2" CHECK ("creator" <> ''), CONSTRAINT "CHK_910da67ebbb20e7d886b26158b" CHECK ("name" <> ''), CONSTRAINT "PK_23d4e7e9b58d9939f113832915b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "contests_judges_users" ("contestsId" integer NOT NULL, "usersUsername" character varying(64) NOT NULL, CONSTRAINT "PK_8530203fe46cd233c69af907f39" PRIMARY KEY ("contestsId", "usersUsername"))`);
        await queryRunner.query(`CREATE INDEX "IDX_48dc3d20b08fe7e7a5e36ab405" ON "contests_judges_users" ("contestsId") `);
        await queryRunner.query(`CREATE INDEX "IDX_210b6c7ebdafaa6ee920824422" ON "contests_judges_users" ("usersUsername") `);
        await queryRunner.query(`ALTER TABLE "contests" ADD CONSTRAINT "FK_f1fdb00db85e9f2fe7913a33d38" FOREIGN KEY ("ownerUsername") REFERENCES "users"("username") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "entries" ADD CONSTRAINT "FK_dca2e7c34ad931786b670842064" FOREIGN KEY ("contestId") REFERENCES "contests"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "contests_judges_users" ADD CONSTRAINT "FK_48dc3d20b08fe7e7a5e36ab4059" FOREIGN KEY ("contestsId") REFERENCES "contests"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "contests_judges_users" ADD CONSTRAINT "FK_210b6c7ebdafaa6ee9208244229" FOREIGN KEY ("usersUsername") REFERENCES "users"("username") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "contests_judges_users" DROP CONSTRAINT "FK_210b6c7ebdafaa6ee9208244229"`);
        await queryRunner.query(`ALTER TABLE "contests_judges_users" DROP CONSTRAINT "FK_48dc3d20b08fe7e7a5e36ab4059"`);
        await queryRunner.query(`ALTER TABLE "entries" DROP CONSTRAINT "FK_dca2e7c34ad931786b670842064"`);
        await queryRunner.query(`ALTER TABLE "contests" DROP CONSTRAINT "FK_f1fdb00db85e9f2fe7913a33d38"`);
        await queryRunner.query(`DROP INDEX "IDX_210b6c7ebdafaa6ee920824422"`);
        await queryRunner.query(`DROP INDEX "IDX_48dc3d20b08fe7e7a5e36ab405"`);
        await queryRunner.query(`DROP TABLE "contests_judges_users"`);
        await queryRunner.query(`DROP TABLE "entries"`);
        await queryRunner.query(`DROP TABLE "contests"`);
    }

}
