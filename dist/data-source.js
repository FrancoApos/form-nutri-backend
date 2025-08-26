"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
require("reflect-metadata");
const typeorm_1 = require("typeorm");
const User_1 = require("./entities/User");
const FoodResponse_1 = require("./entities/FoodResponse");
const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = process.env;
console.log("DB_HOST:", process.env.DB_HOST);
console.log("DB_USER:", process.env.DB_USER);
console.log("DB_PASSWORD:", process.env.DB_PASSWORD);
console.log("DB_NAME:", process.env.DB_NAME);
if (!DB_HOST || !DB_USER || !DB_PASSWORD || !DB_NAME) {
    throw new Error("Faltan variables de entorno de la base de datos");
}
exports.AppDataSource = new typeorm_1.DataSource({
    type: "postgres",
    host: DB_HOST,
    port: Number(DB_PORT),
    username: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    synchronize: true,
    logging: true,
    entities: [User_1.User, FoodResponse_1.FoodResponse],
});
