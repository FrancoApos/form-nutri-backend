import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from "typeorm";
import { User } from "./User";
import { FoodItem } from "./FoodItem";

@Entity()
export class FoodResponse {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => User, (user) => user.responses)
  user!: User;

  @ManyToOne(() => FoodItem, (food) => food.responses)
  food!: FoodItem;

  @Column()
  quantity!: string;

  @Column()
  frequency!: string;

  @Column({ nullable: true })
  observations!: string;

  // Nuevo campo: ID de grupo de respuestas (un envío)
  @Column({ nullable: true })
  id_response!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
