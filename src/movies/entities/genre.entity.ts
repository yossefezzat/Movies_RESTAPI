import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('genres')
export class Genre {
  @PrimaryColumn()
  id: number;

  @Column({ type: 'varchar', length: 100, unique: true })
  name: string;
}
