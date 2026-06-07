import { User } from '@/user/entities/user.entity';
import { Entity, PrimaryColumn, Column, CreateDateColumn, OneToOne, JoinColumn } from 'typeorm';

@Entity('compatibility')
export class Compatibility {
  @PrimaryColumn('uuid')
  userId: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  characterId: string;

  @Column()
  characterName: string;

  @Column('int')
  overallScore: number;

  @Column('json')
  badgeScores: {
    sajuCompatibility: number;
    datingStyle: number;
    preferencePersonality: number;
  };

  @Column('json')
  sections: {
    destiny: string;
    personality: string;
    elemental: string;
    dating: string;
    growth: string;
  };

  @CreateDateColumn()
  createdAt: Date;
}
