import {Column, CreateDateColumn, Entity, PrimaryColumn} from "typeorm";
import {IsEmail, MaxLength} from "class-validator";


@Entity({name: "users"})
export class User {

    @PrimaryColumn()
    @MaxLength(64)
    // @ts-ignore
    username: string;

    @Column()
    // @ts-ignore
    displayName: string;

    @Column({type: "citext"})
    @IsEmail()
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