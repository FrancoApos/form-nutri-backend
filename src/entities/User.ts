import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { FoodResponse } from "./FoodResponse";

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  dni!: string;

  @Column()
  apellido!: string;

  @OneToMany(() => FoodResponse, (response) => response.user)
  responses!: FoodResponse[];
}
