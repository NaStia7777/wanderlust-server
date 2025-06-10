import { Router } from 'express';
import db from '../config/database';
import { ICategory } from 'data/categories';
export interface IDestination {
    id: number,
    name: string;
    location: string;
    image: string;
    description: string;
    category: number[];
    rating: number;
    price: string;
    time: string;
    duration: string;
    lat: number,
    lng: number,
}
const router = Router();
const ITEMS_PER_PAGE = 10;

router.get('/', (req, res) => {
  try {
    const { query = '', categories = [], price = [], page = 1 } = req.query;
    const searchQuery = `%${query}%`;
    const pageNumber = Number(page);
    const offset = (pageNumber - 1) * ITEMS_PER_PAGE;
    let baseQuery = `
      SELECT DISTINCT d.*
      FROM destinations d
      LEFT JOIN destination_categories dc ON d.id = dc.destination_id
      WHERE 1=1
    `;
    
    const params: any[] = [];

    // Search by name or description
    if (query) {
      baseQuery += ` AND (LOWER(d.name) LIKE LOWER(?) OR LOWER(d.description) LIKE LOWER(?))`;
      params.push(searchQuery, searchQuery);
    }

    // Filter by categories
    if (Array.isArray(categories) && categories.length > 0) {
      baseQuery += ` AND dc.category_id IN (${categories.join(',')})`;
    }

    // Filter by price ranges
    if (Array.isArray(price) && price.length > 0) {
      const priceRangesStr = price.map(p => `'${p}'`).join(',');
      baseQuery += ` AND d.price IN (${priceRangesStr})`;
    }

    // Count total results for pagination
    const countQuery = `SELECT COUNT(DISTINCT d.id) as total FROM (${baseQuery}) as d`;
    const { total } = db.prepare(countQuery).get(...params) as {total: number};
    const pages = Math.ceil(total / ITEMS_PER_PAGE);

    // Get paginated results
    const paginatedQuery = baseQuery + ` LIMIT ? OFFSET ?`;
    params.push(ITEMS_PER_PAGE, offset);
    const destinations = db.prepare(paginatedQuery).all(...params) as IDestination[];

    // Get categories for each destination
    const destinationsWithCategories = destinations.map(dest => {
      const categories = db.prepare(`
        SELECT *
        FROM categories c
        JOIN destination_categories dc ON c.id = dc.category_id
        WHERE dc.destination_id = ?
      `).all(dest.id) as ICategory[];
      
      return {
        ...dest,
        category: categories.map(c => c.name)
      };
    });
    
    res.json({
      destinations: destinationsWithCategories,
      pages,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching destinations' });
  }
});

export default router;