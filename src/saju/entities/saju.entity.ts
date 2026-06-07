import { User } from '@/user/entities/user.entity';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';

@Entity('saju')   
export class Saju { 
    @PrimaryGeneratedColumn()
    id!: number;

    @Column('json')
    data!: object;

    @Column({ default: false })
    isDone!: boolean;

    @CreateDateColumn()
    createdAt!: Date;

    @ManyToOne(() => User, (user) => user.uuid, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_uuid' })
    user!: User;
}
