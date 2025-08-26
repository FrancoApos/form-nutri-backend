"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const data_source_1 = require("../data-source");
const User_1 = require("../entities/User");
const FoodItem_1 = require("../entities/FoodItem");
const FoodResponse_1 = require("../entities/FoodResponse");
const router = (0, express_1.Router)();
router.post("/submit", async (req, res) => {
    try {
        const { apellido, dni, foods } = req.body;
        if (!dni || !apellido || !foods)
            return res.status(400).json({ message: "Datos incompletos" });
        const userRepo = data_source_1.AppDataSource.getRepository(User_1.User);
        let user = await userRepo.findOne({ where: { dni } });
        if (!user) {
            user = userRepo.create({ dni, apellido });
            await userRepo.save(user);
        }
        const foodItemRepo = data_source_1.AppDataSource.getRepository(FoodItem_1.FoodItem);
        const responseRepo = data_source_1.AppDataSource.getRepository(FoodResponse_1.FoodResponse);
        for (const foodName in foods) {
            const item = await foodItemRepo.findOne({ where: { name: foodName } });
            if (!item)
                continue;
            const { quantity, frequency, observations } = foods[foodName];
            const response = responseRepo.create({ user, food: item, quantity, frequency, observations });
            await responseRepo.save(response);
        }
        res.json({ message: "Respuestas guardadas correctamente" });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al guardar respuestas" });
    }
});
router.get("/responses/:dni", async (req, res) => {
    try {
        const { dni } = req.params;
        const userRepo = data_source_1.AppDataSource.getRepository(User_1.User);
        const user = await userRepo.findOne({ where: { dni }, relations: ["responses", "responses.food", "responses.food.category"] });
        if (!user)
            return res.status(404).json({ message: "Usuario no encontrado" });
        res.json(user.responses);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al obtener respuestas" });
    }
});
exports.default = router;
