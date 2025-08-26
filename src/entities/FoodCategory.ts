import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { FoodItem } from "./FoodItem";

@Entity()
export class FoodCategory {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @OneToMany(() => FoodItem, (item) => item.category)
  items!: FoodItem[];
}
