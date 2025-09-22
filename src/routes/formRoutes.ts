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

    if (!dni || !apellido || !email || !Array.isArray(foods)) {
      return res.status(400).json({ message: "Datos incompletos" });
    }

    await AppDataSource.transaction(async (trx) => {
      const userRepo = trx.getRepository(User);
      const frRepo = trx.getRepository(FoodResponse);

      // upsert user por dni
      let user = await userRepo.findOne({ where: { dni } });
      if (!user) {
        user = userRepo.create({ dni, apellido, email });
      } else {
        user.apellido = apellido ?? user.apellido;
        user.email = email ?? user.email;
      }
      await userRepo.save(user);

      // construir filas usando RELACIONES (no userId/foodId)
      const id_response = uuidv4();
      const rows = foods
        .filter((f: any) => f && typeof f.foodId !== "undefined" && f.frequency)
        .map((f: any) => ({
          user: { id: user.id } as any,
          food: { id: Number(f.foodId) } as any,
          quantity: String(f.quantity ?? ""),
          frequency: String(f.frequency ?? ""),
          observations: f.observations ?? null,
          id_response,
        }));

      if (rows.length === 0) {
        return res.status(400).json({ message: "No hay respuestas válidas para guardar" });
      }

      await frRepo.createQueryBuilder().insert().into(FoodResponse).values(rows).execute();

      res.json({ message: "Respuestas guardadas correctamente", id_response });
    });
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

    // 1) Último id_response por usuario
    const latestResponses = await repo
      .createQueryBuilder('fr')
      .select('DISTINCT ON (fr.userId) fr.id_response', 'id_response')
      .addSelect('fr.userId', 'userId')
      .orderBy('fr.userId', 'ASC')
      .addOrderBy('fr.createdAt', 'DESC')
      .getRawMany();

    const idResponsesToFetch = latestResponses.map(r => r.id_response);

    // Guardar si no hay datos
    if (idResponsesToFetch.length === 0) {
      res.status(204).end(); // No Content
      return;
    }

    // 2) Traer todas las filas de esos formularios
    const responses = await repo
      .createQueryBuilder('fr')
      .leftJoinAndSelect('fr.user', 'u')
      .leftJoinAndSelect('fr.food', 'f')     // f.grams viene de FoodItem
      .leftJoinAndSelect('f.category', 'c')
      .where('fr.id_response IN (:...ids)', { ids: idResponsesToFetch })
      .orderBy('fr.userId', 'ASC')
      .addOrderBy('fr.createdAt', 'ASC')
      .getMany();

    // 3) Generar Excel
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Respuestas');

    sheet.columns = [
      { header: 'user_id',        key: 'user_id',        width: 10 },
      { header: 'user_apellido',  key: 'user_apellido',  width: 20 },
      { header: 'food_nombre',    key: 'food_nombre',    width: 30 },
      { header: 'categoria',      key: 'categoria',      width: 24 },
      { header: 'quantity',       key: 'quantity',       width: 15 },
      { header: 'grams',          key: 'grams',          width: 12 }, // 👈 NUEVA
      { header: 'frequency',      key: 'frequency',      width: 15 },
      { header: 'observations',   key: 'observations',   width: 30 },
      { header: 'createdAt',      key: 'createdAt',      width: 20 },
    ];

    responses.forEach(r => {
      sheet.addRow({
        user_id:       r.user.id,
        user_apellido: r.user.apellido,
        food_nombre:   r.food.name,
        categoria:     r.food.category?.name ?? '',
        quantity:      r.quantity,
        grams:         r.food?.grams ?? null,   // 👈 toma el grams del FoodItem matcheado
        frequency:     r.frequency,
        observations:  r.observations,
        createdAt:     r.createdAt,
      });
    });

    // (Opcional) Formato numérico a 2 decimales
    // const gramsCol = sheet.getColumn('grams');
    // gramsCol.numFmt = '0.00';

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

router.get("/foods", async (_req, res) => {
  try {
    const items = await AppDataSource.getRepository(FoodItem).find({
      relations: ["category"],
      select: { 
        id: true, 
        name: true, 
        quantity: true,     // 👈 incluir quantity
        grams: true,        // 👈 incluir grams
        category: { id: true, name: true } 
      },
      order: { category: { id: "ASC" }, id: "ASC" },
    });

    type CatItem = {
      id: number;
      name: string;
      defaultQuantity: string;     // (desde food_item.quantity)
      grams: number | null;        // (desde food_item.grams)
    };
    type CatPayload = { 
      id: number | null; 
      name: string; 
      items: CatItem[];
    };

    const grouped = new Map<number, CatPayload>();
    const UNCATEGORIZED_KEY = 0;

    for (const it of items) {
      const catId = it.category?.id ?? UNCATEGORIZED_KEY;
      const catName = it.category?.name ?? "Sin categoría";

      if (!grouped.has(catId)) {
        grouped.set(catId, {
          id: catId === UNCATEGORIZED_KEY ? null : catId,
          name: catName,
          items: [],
        });
      }
      grouped.get(catId)!.items.push({
        id: it.id,
        name: it.name,
        defaultQuantity: it.quantity ?? "",     
        grams: it.grams ?? null,                
      });
    }

    const realCats = [...grouped.entries()]
      .filter(([k]) => k !== UNCATEGORIZED_KEY)
      .sort((a, b) => a[0] - b[0])
      .map(([, v]) => v);

    const uncategorized = grouped.get(UNCATEGORIZED_KEY);
    const payload = uncategorized ? [...realCats, uncategorized] : realCats;

    res.json(payload);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error obteniendo alimentos" });
  }
});


export default router;
