import { Router, Request, Response } from 'express';
import db from '../config/database';
import { authenticateToken } from '../middleware/auth';

interface IRequest extends Request {
    userId?: number;
}
const router = Router();

// Встановлюємо маршрут для створення нового маршруту з перевіркою авторизації
router.post('/create', authenticateToken, (req: IRequest, res: Response) => {
    try {
        const { url, name, destinations, duration, price, places, routes, backtrack, coordinates, start, ispublic, startdate } = req.body;
        const userId = (req as any).userId; // Отримуємо userId з токену
        // Перевіряємо, чи всі обов'язкові поля надані
        if (!name || !destinations || !duration || !price || !places ) {
            res.status(400).json({ message: 'Missing required fields' });
            return;
        }

        // Створюємо запит для вставки нового маршруту
        const query = `
      INSERT INTO routes (user_id, url, name, destinations, duration, price, places, routes, backtrack, coordinates, start, ispublic, startdate)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

        // Виконання запиту до бази даних
        db.prepare(query).run(
            userId,
            url ? url : '',
            name,
            destinations,
            duration,
            price,
            places,
            routes ? routes : '[]',
            backtrack ? 1: 0, // Якщо backtrack не вказано, то за замовчуванням 0
            coordinates ? coordinates : '', // Якщо координати не вказано, то NULL
            start ? start : '', // Якщо стартова точка не вказана, то NULL
            ispublic ? 1 : 0,
            startdate ? startdate : '', // Якщо не вказано, маршрут не буде публічним за замовчуванням
        );
        res.status(201).json({ message: 'Route created successfully' });
    }
    catch (error) {
        res.status(500).json({ message: 'Error inserting route' });
        console.log(error);
    }
});

router.delete('/delete/:id', authenticateToken, (req: IRequest, res: Response) => {
    try {
        const routeId = req.params.id; // Отримуємо ID маршруту з параметрів запиту
        const userId = req.userId; // Отримуємо userId з токену (враховуючи кастомну типізацію)

        if (!routeId) {
            res.status(400).json({ message: 'Route ID is required' });
            return;
        }

        // Перевіряємо, чи існує маршрут і чи належить він користувачу
        const checkQuery = `
        SELECT COUNT(*) as total FROM routes WHERE id = ? AND user_id = ?
      `;
        const { total } = db.prepare(checkQuery).get(routeId, userId) as { total: number };

        if (total === 0) {
            res.status(404).json({ message: 'Route not found or access denied' });
            return;
        }

        // Видаляємо маршрут
        const deleteQuery = `
          DELETE FROM routes WHERE id = ? AND user_id = ?
        `;
        const changes = db.prepare(deleteQuery).run(routeId, userId).changes;
        if (changes === 0) {
            res.status(404).json({ message: 'Route not found or access denied' });
            return;
        }
        res.status(200).json({ message: 'Route deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Unexpected error occurred' });
    }
});

router.put('/edit/', authenticateToken, (req: IRequest, res: Response) => {
    try {
        const userId = req.userId; // Отримуємо userId з токену
        const {
            id,
            url,
            name,
            destinations,
            duration,
            price,
            places,
            routes,
            backtrack,
            coordinates,
            start,
            ispublic,
            startdate,
        } = req.body;

        // Перевіряємо, чи всі обов'язкові поля надані
        if (!name || !destinations || !duration || !price || !places || !id ) {
            res.status(400).json({ message: 'Missing required fields' });
            return;
        }

        // Перевіряємо, чи існує маршрут і чи належить він користувачу
        const checkQuery = `
            SELECT COUNT(*) as total FROM routes WHERE id = ? AND user_id = ?
        `;
        const { total } = db.prepare(checkQuery).get(id, userId) as { total: number };

        if (total === 0) {
            res.status(404).json({ message: 'Route not found or access denied' });
            return;
        }
        // Створюємо запит для оновлення маршруту
        const updateQuery = `
                UPDATE routes
                SET 
                    name = ?,
                    url = ?,
                    destinations = ?,
                    duration = ?,
                    price = ?,
                    places = ?,
                    routes = ?,
                    backtrack = ?,
                    coordinates = ?,
                    start = ?,
                    ispublic = ?,
                    startdate = ?
                WHERE id = ? AND user_id = ?
            `;
        db.prepare(updateQuery).run(
            name,
            url ? url : '',
            destinations,
            duration,
            price,
            places,
            routes ? routes : '[]',
            backtrack ? 1 : 0, // Якщо backtrack не вказано, то за замовчуванням 0
            coordinates ? coordinates : '', // Якщо координати не вказано, то NULL
            start ? start : '', // Якщо стартова точка не вказана, то NULL
            ispublic ? 1 : 0, // Якщо не вказано, маршрут не буде публічним за замовчуванням
            startdate ? startdate : '',
            id,
            userId
        );
        res.status(200).json({ message: 'Route updated successfully' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Unexpected error occurred' });
    }
});

router.get('/get', authenticateToken, (req: IRequest, res: Response) => {
    try {
        const userId = req.userId; // Отримуємо userId з токену
        const { page = 1 } = req.query;
        const pageNumber = Number(page);

        // Count total results for pagination
        const ITEMS_PER_PAGE = 2;
        const offset = (pageNumber - 1) * ITEMS_PER_PAGE;

        const countQuery = `SELECT COUNT(*) as total FROM routes WHERE user_id = ?`;
        const { total } = db.prepare(countQuery).get(userId) as { total: number };
        const pages = Math.ceil(total / ITEMS_PER_PAGE);

        const query = `
            SELECT * FROM routes WHERE user_id = ? LIMIT ? OFFSET ?
        `;

        const routes = db.prepare(query).all(userId, ITEMS_PER_PAGE, offset);
        res.status(200).json({ routes: routes, pages: pages });
    } catch (error) {
        res.status(500).json({ message: 'Unexpected error occurred' });
    }
});

router.get('/id/:id', authenticateToken, (req: IRequest, res: Response) => {
    try {
        const userId = req.userId; // Отримуємо userId з токену
        const { id } = req.params; // Отримуємо id маршруту з параметрів URL

        if (!id || isNaN(Number(id))) {
            res.status(400).json({ message: 'Invalid route ID' });
            return;
        }

        const query = `
            SELECT * FROM routes WHERE id = ? AND user_id = ?
        `;
        const route = db.prepare(query).get(Number(id), userId);

        if (!route) {
            res.status(404).json({ message: 'Route not found or access denied' });
            return;
        }

        res.status(200).json(route);
    } catch (error) {
        res.status(500).json({ message: 'Unexpected error occurred' });
    }
});

router.get('/public/:id', (req: Request, res: Response) => {
    try {
        const { id } = req.params; // Отримуємо id маршруту з параметрів URL

        if (!id || isNaN(Number(id))) {
            res.status(400).json({ message: 'Invalid route ID' });
            return;
        }

        const query = `
            SELECT * FROM routes WHERE id = ? AND ispublic = 1
        `;
        const route = db.prepare(query).get(Number(id));

        if (!route) {
            res.status(404).json({ message: 'Public route not found' });
            return;
        }

        res.status(200).json(route);
    } catch (error) {
        res.status(500).json({ message: 'Unexpected error occurred' });
    }
});

router.get('/public', (req: Request, res: Response) => {
    try {
        const { name = '', categories = [], budget, duration, page = 1 } = req.query;
        const limit = 10;
        const offset = (Number(page) - 1) * Number(limit);
        
        // Базовий SQL-запит
        let query = `SELECT * FROM routes WHERE ispublic = 1`;
        let countQuery = `SELECT COUNT(*) as total FROM routes WHERE ispublic = 1`;

        const params: any[] = [];

        // Фільтрація за name (ігноруючи регістр)
        if (name && name!='') {
            query += ` AND LOWER(name) LIKE ?`;
            countQuery += ` AND LOWER(name) LIKE ?`;
            params.push(`%${(name as string).toLowerCase()}%`);
        }

        // Фільтрація за categories
        if ((categories as string[]).length > 0) {
            query += ` AND (places LIKE ${(categories as string[]).map(() => `?`).join(' OR places LIKE ')})`;
            countQuery += ` AND (places LIKE ${(categories as string[]).map(() => `?`).join(' OR places LIKE ')})`;
            params.push(...(categories as string[]).map(category => `%${category}%`));
        }

        // Фільтрація за budget
        if (budget) {
            const minPrice = Number(budget) - 500;
            const maxPrice = Number(budget) + 500;
            query += ` AND price BETWEEN ? AND ?`;
            countQuery += ` AND price BETWEEN ? AND ?`;
            params.push(minPrice, maxPrice);
        }

        // Фільтрація за duration
        if (duration) {
            query += ` AND duration LIKE ?`;
            countQuery += ` AND duration LIKE ?`;
            params.push(`%${duration}%`);
        }

        // Додаємо пагінацію
        query += ` LIMIT ? OFFSET ?`;
        params.push(limit, offset);
        // Виконання запиту для отримання записів
        const publicRoutes = db.prepare(query).all(...params);

        // Виконання запиту для підрахунку загальної кількості записів
        const {total} = db.prepare(countQuery).get(...params.slice(0, params.length - 2)) as {total: number};

        const totalPages = Math.ceil(total / Number(limit));

        res.status(200).json({
            routes: publicRoutes,
            pages: totalPages,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Unexpected error occurred' });
    }
});

export default router;
