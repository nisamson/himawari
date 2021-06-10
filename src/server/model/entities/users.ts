import {Column, CreateDateColumn, Entity, Index, ManyToMany, OneToMany, PrimaryColumn} from "typeorm";
import {IsEmail, MaxLength} from "class-validator";
import {User as UserModel} from "../../../model/users";
import {ContestEntity} from "./contests";


@Entity({name: "users"})
export class UserEntity {
    @PrimaryColumn({
        length: 64
    })
    @MaxLength(464)
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

    @OneToMany(() => ContestEntity, contest => contest.owner,
        {
            onDelete: "CASCADE",
        })
    // @ts-ignore
    contests: ContestEntity[];

    @ManyToMany(() => ContestEntity, contest => contest.judges, {
        onDelete: "CASCADE",
    })
    // @ts-ignore
    judgeContests: ContestEntity[];


    claims(): UserModel.Info {
        return {
            email: this.email,
            created: this.created,
            displayName: this.displayName,
            username: this.username
        }
    }
}