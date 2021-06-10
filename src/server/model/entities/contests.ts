import {
    Check,
    Column,
    Entity,
    JoinTable,
    ManyToMany,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    Unique
} from "typeorm";
import {UserEntity} from "./users";
import {IsFQDN, Length, MaxLength, MinLength} from "class-validator";

@Entity({name: "contests"})
@Check(`"name" <> ''`)
export class ContestEntity {
    @PrimaryGeneratedColumn()
        // @ts-ignore
    id: number;

    @Column()
    @MinLength(1)
        // @ts-ignore
    name: string;

    @ManyToOne(() => UserEntity, user => user.contests)
        // @ts-ignore
    owner: UserEntity;

    @ManyToMany(() => UserEntity, user => user.judgeContests, {
        onDelete: "CASCADE"
    })
    @JoinTable()
        // @ts-ignore
    judges: UserEntity[];

    @OneToMany(() => EntryEntity, entry => entry.contest)
        // @ts-ignore
    entries: EntryEntity[];
}

@Entity({name: "entries"})
@Check(`"name" <> ''`)
@Check(`"creator" <> ''`)
@Unique("UQ_EntryPerContest", ["contest", "name"])
export class EntryEntity {
    @PrimaryGeneratedColumn()
        // @ts-ignore
    id: number;

    @ManyToOne(() => ContestEntity, contest => contest.entries)
        // @ts-ignore
    contest: ContestEntity;

    @Column({
        length: 1024
    })
    @Length(1, 1024)
        // @ts-ignore
    name: string;

    @Column({
        length: 1024
    })
    @Length(1, 1024)
        // @ts-ignore
    creator: string;

    @Column()
        // @ts-ignore
    url: string;

    @Column({length: 64 * 1024})
    @MaxLength(64 * 1024)
        // @ts-ignore
    description: string;
}