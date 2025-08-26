import { Router } from "express";
import { AppDataSource } from "../data-source";
import { User } from "../entities/User";
import { FoodItem } from "../entities/FoodItem";
import { FoodResponse } from "../entities/FoodResponse";

const router = Router();

router.post("/submit", async (req, res) => {
  try {
    const { apellido, dni, foods } = req.body;
    if (!dni || !apellido || !foods) return res.status(400).json({ message: "Datos incompletos" });

    const userRepo = AppDataSource.getRepository(User);
    let user = await userRepo.findOne({ where: { dni } });

    if (!user) {
      user = userRepo.create({ dni, apellido });
      await userRepo.save(user);
    }

    const foodItemRepo = AppDataSource.getRepository(FoodItem);
    const responseRepo = AppDataSource.getRepository(FoodResponse);

    for (const foodName in foods) {
      const item = await foodItemRepo.findOne({ where: { name: foodName } });
      if (!item) continue;

      const { quantity, frequency, observations } = foods[foodName];
      const response = responseRepo.create({ user, food: item, quantity, frequency, observations });
      await responseRepo.save(response);
    }

    res.json({ message: "Respuestas guardadas correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al guardar respuestas" });
  }
});

router.get("/responses/:dni", async (req, res) => {
  try {
    const { dni } = req.params;
    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({ where: { dni }, relations: ["responses", "responses.food", "responses.food.category"] });

    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

    res.json(user.responses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener respuestas" });
  }
});

export default router;
