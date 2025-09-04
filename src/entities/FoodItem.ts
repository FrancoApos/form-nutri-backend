import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  RelationId,
} from "typeorm";
import { FoodCategory } from "./FoodCategory";
import { FoodResponse } from "./FoodResponse";

@Entity({ name: "food_item" })
export class FoodItem {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", nullable: false })
  name!: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  quantity?: string;

  // Ahora numérico en Postgres (double precision)
  @Column({ type: "double precision", nullable: true })
  grams?: number;

  @ManyToOne(() => FoodCategory, (category) => category.items, {
    nullable: true,
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "categoryId" })
  category?: FoodCategory;

  @RelationId((item: FoodItem) => item.category)
  categoryId?: number;

  @OneToMany(() => FoodResponse, (response) => response.food)
  responses!: FoodResponse[];
}
