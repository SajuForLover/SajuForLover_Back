import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';

@Entity('saju')   
export class Saju {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column('json')
    data!: object;

    @Column({ length: 32 })
    name!: string;

    @Column({ length: 10 })
    gender!: string;

    @Column({ length: 10 })
    birthDate!: string;

    @Column({ length: 255 })
    location!: string;

    @Column({ length: 50 })
    calendar!: string;

    @Column({ length: 255 })
    birthTime!: string;

    @CreateDateColumn()
    createdAt!: Date;
}
