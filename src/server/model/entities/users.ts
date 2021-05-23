import {Column, CreateDateColumn, Entity, Index, PrimaryColumn} from "typeorm";
import {IsEmail, MaxLength} from "class-validator";


@Entity()
export class User {
    @PrimaryColumn({
        length: 64
    })
    @MaxLength(64)
    // @ts-ignore
    username: string;

    @Column({
        length: 64
    })
    @MaxLength(64)
    // @ts-ignore
    displayName: string;

    @Column({type: "citext", unique: true})
    @IsEmail()
    @MaxLength(128)
    // @ts-ignore
    email: string;

    @Column()
    // @ts-ignore
    emailValidated: boolean;

    @Column()
    // @ts-ignore
    hash: string;

    @CreateDateColumn()
    // @ts-ignore
    created: Date
}