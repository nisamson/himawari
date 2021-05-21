import {MigrationInterface, QueryRunner, Table} from "typeorm";


export class CreateUsers implements MigrationInterface {
    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("CREATE EXTENSION IF NOT EXISTS citext;")
        await queryRunner.createTable(new Table({
            name: "users",
            columns: [
                {
                    name: ""
                }
            ]
        }));
    }

    async up(queryRunner: QueryRunner): Promise<void> {

    }

}