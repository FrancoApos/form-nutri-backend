import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "./entities/User";
import { FoodCategory } from "./entities/FoodCategory";
import { FoodItem } from "./entities/FoodItem";
import { FoodResponse } from "./entities/FoodResponse";


const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = process.env;

if (!DB_HOST || !DB_USER || !DB_PASSWORD || !DB_NAME) {
  throw new Error("Faltan variables de entorno de la base de datos");
}

export const AppDataSource = new DataSource({
  type: "postgres",
  host: DB_HOST,
  port: Number(DB_PORT),
  username: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  synchronize: true,
  logging: true,
  ssl: {
    rejectUnauthorized: false, // importante para Render
  },
  entities: [User, FoodResponse, FoodItem, FoodCategory],
});