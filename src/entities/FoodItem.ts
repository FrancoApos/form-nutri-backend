import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from "typeorm";
import { FoodCategory } from "./FoodCategory";
import { FoodResponse } from "./FoodResponse";

@Entity()
export class FoodItem {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @ManyToOne(() => FoodCategory, (category) => category.items)
  category!: FoodCategory;

  @OneToMany(() => FoodResponse, (response) => response.food)
  responses!: FoodResponse[];
}
