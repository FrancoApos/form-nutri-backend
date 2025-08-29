import { Router } from "express";
import { AppDataSource } from "../data-source";
import { User } from "../entities/User";
import { FoodItem } from "../entities/FoodItem";
import { FoodResponse } from "../entities/FoodResponse";
import ExcelJS from 'exceljs';

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

router.get('/export-responses', async (req, res) => {
  try {
    const repo = AppDataSource.getRepository(FoodResponse);

    // Obtener respuestas agrupadas por id_response para evitar duplicados de un mismo formulario
    const responses = await repo
      .createQueryBuilder('fr')
      .leftJoinAndSelect('fr.user', 'u')
      .leftJoinAndSelect('fr.food', 'f')
      .leftJoinAndSelect('f.category', 'c') // si tenés relación FoodItem -> Category
      .orderBy('fr.createdAt', 'ASC')
      .getMany();

    // Filtrar para que cada userId + id_response aparezca una sola vez
    const filtered: FoodResponse[] = [];
    const seen = new Set<string>();

    for (const r of responses) {
      const key = `${r.user.id}-${r.id_response}`;
      if (!seen.has(key)) {
        seen.add(key);
        filtered.push(r);
      }
    }

    // Crear Excel
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Respuestas');

    // Cabecera
    sheet.columns = [
      { header: 'user_id', key: 'user_id', width: 10 },
      { header: 'user_apellido', key: 'user_apellido', width: 20 },
      { header: 'food_nombre', key: 'food_nombre', width: 30 },
      { header: 'categoria', key: 'categoria', width: 20 },
      { header: 'quantity', key: 'quantity', width: 15 },
      { header: 'frequency', key: 'frequency', width: 15 },
      { header: 'observations', key: 'observations', width: 30 },
      { header: 'createdAt', key: 'createdAt', width: 20 },
    ];

    // Agregar filas
    filtered.forEach((r) => {
      sheet.addRow({
        user_id: r.user.id,
        user_apellido: r.user.apellido,
        food_nombre: r.food.name,
        categoria: r.food.category?.name ?? '', // si category es relación
        quantity: r.quantity,
        frequency: r.frequency,
        observations: r.observations,
        createdAt: r.createdAt,
      });
    });

    // Enviar archivo como descarga
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', 'attachment; filename="respuestas.xlsx"');

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error generando Excel' });
  }
});


export default router;
