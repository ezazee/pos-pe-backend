import { Router } from 'express';
import authRoutes from './auth.routes.js';
import productsRoutes from './products.routes.js';
import salesRoutes from './sales.routes.js';

const api = Router();

api.use(authRoutes);
api.use(productsRoutes);
api.use(salesRoutes);

export default api;
