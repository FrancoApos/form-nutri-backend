import { Router } from "express";
import { AppDataSource } from "../data-source";
import { User } from "../entities/User";
import { FoodItem } from "../entities/FoodItem";
import { FoodResponse } from "../entities/FoodResponse";

import { v4 as uuidv4 } from "uuid";
const router = Router();


router.post("/submit", async (req, res) => {
  try {
    const { apellido, dni, email, foods } = req.body;
    if (!dni || !apellido || !email || !foods) {
      return res.status(400).json({ message: "Datos incompletos" });
    }

    const userRepo = AppDataSource.getRepository(User);
    let user = await userRepo.findOne({ where: { dni } });

    if (!user) {
      user = userRepo.create({ dni, apellido, email });
      await userRepo.save(user);
    } else {
      user.apellido = apellido;
      user.email = email;
      await userRepo.save(user);
    }

    const foodItemRepo = AppDataSource.getRepository(FoodItem);
    const responseRepo = AppDataSource.getRepository(FoodResponse);

    // Generar un único id_response para este envío
    const id_response = uuidv4();

    for (const foodName in foods) {
      const item = await foodItemRepo.findOne({ where: { name: foodName } });
      if (!item) continue;

      const { quantity, frequency, observations } = foods[foodName];
      const response = responseRepo.create({
        user,
        food: item,
        quantity,
        frequency,
        observations,
        id_response, // 👈 lo guardamos en cada respuesta
      });
      await responseRepo.save(response);
    }

    res.json({ message: "Respuestas guardadas correctamente", id_response });
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

router.get("/stats/top-foods", async (req, res) => {
  try {
    const data = await AppDataSource
      .getRepository(FoodResponse)
      .createQueryBuilder("fr")
      .leftJoin("fr.food", "f")
      .select("f.name", "alimento")
      .addSelect("COUNT(fr.id)", "total")
      .groupBy("f.name")
      .orderBy("total", "DESC")
      .getRawMany();

    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error obteniendo ranking de alimentos" });
  }
});

/**
 * 2. Distribución de frecuencia por alimento
 */
router.get("/stats/frequency-by-food", async (req, res) => {
  try {
    const data = await AppDataSource
      .getRepository(FoodResponse)
      .createQueryBuilder("fr")
      .leftJoin("fr.food", "f")
      .select("f.name", "alimento")
      .addSelect("fr.frequency", "frecuencia")
      .addSelect("COUNT(fr.id)", "total")
      .groupBy("f.name")
      .addGroupBy("fr.frequency")
      .orderBy("f.name")
      .getRawMany();

    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error obteniendo frecuencias" });
  }
});

/**
 * 3. Consumo por categoría de alimentos
 */
router.get("/stats/by-category", async (req, res) => {
  try {
    const data = await AppDataSource
      .getRepository(FoodResponse)
      .createQueryBuilder("fr")
      .leftJoin("fr.food", "f")
      .leftJoin("f.category", "c")
      .select("c.name", "categoria")
      .addSelect("fr.frequency", "frecuencia")
      .addSelect("COUNT(fr.id)", "total")
      .groupBy("c.name")
      .addGroupBy("fr.frequency")
      .orderBy("c.name")
      .getRawMany();

    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error obteniendo datos por categoría" });
  }
});

/**
 * 4. Respuestas de un usuario específico (para análisis individual)
 */
router.get("/stats/user/:dni", async (req, res) => {
  try {
    const { dni } = req.params;
    const user = await AppDataSource.getRepository(User).findOne({
      where: { dni },
      relations: ["responses", "responses.food", "responses.food.category"],
    });

    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

    const data = user.responses.map((r) => ({
      alimento: r.food.name,
      categoria: r.food.category?.name,
      frecuencia: r.frequency,
      observaciones: r.observations,
    }));

    res.json({ usuario: user.apellido, dni: user.dni, respuestas: data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error obteniendo datos del usuario" });
  }
});

router.get("/responses/:dni", async (req, res) => {
  try {
    const { dni } = req.params;

    const userRepo = AppDataSource.getRepository(User);
    const responseRepo = AppDataSource.getRepository(FoodResponse);

    // Buscar usuario por DNI
    const user = await userRepo.findOne({ where: { dni } });
    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

    // Buscar el último id_response de ese usuario
    const lastResponse = await responseRepo
      .createQueryBuilder("fr")
      .leftJoin("fr.user", "user")
      .where("user.dni = :dni", { dni })
      .select("fr.id_response", "id_response")
      .orderBy("fr.createdAt", "DESC")
      .getRawOne();

    if (!lastResponse) {
      return res.json({ user, foods: [] });
    }

    // Traer todas las respuestas de ese id_response
    const responses = await responseRepo.find({
      where: { user: { id: user.id }, id_response: lastResponse.id_response },
      relations: ["food"], // Para obtener nombre del alimento
      order: { food: { name: "ASC" } },
    });

    // Transformar la respuesta para el frontend
    const foods = responses.map((r) => ({
      foodName: r.food.name,
      quantity: r.quantity,
      frequency: r.frequency,
      observations: r.observations,
    }));

    res.json({
      user: {
        dni: user.dni,
        apellido: user.apellido,
        email: user.email,
      },
      foods,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener respuestas" });
  }
});



export default router;
