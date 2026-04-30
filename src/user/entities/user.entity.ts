import { Physiognomy } from '@/physiognomy/entities/physiognomy.entity';
import { Saju } from '@/saju/entities/saju.entity';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';

@Entity('user')
export class User {
    @PrimaryGeneratedColumn('uuid')
    uuid!: string;

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

    @ManyToOne(() => Saju, (saju) => saju.id, { onDelete: 'CASCADE' })
    saju!: Saju;

    @ManyToOne(() => Physiognomy, (physiognomy) => physiognomy.id, { onDelete: 'CASCADE' })
    physiognomy!: Physiognomy;

    @CreateDateColumn()
    createdAt!: Date;
}
