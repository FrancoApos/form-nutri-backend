import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "./entities/User";
import { FoodCategory } from "./entities/FoodCategory";
import { FoodItem } from "./entities/FoodItem";
import { FoodResponse } from "./entities/FoodResponse";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize: true,
  logging: true,
  entities: [User, FoodCategory, FoodItem, FoodResponse],
});
