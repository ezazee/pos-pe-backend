import { Router } from 'express';
import authRoutes from './auth.routes';
import productsRoutes from './products.routes';
import salesRoutes from './sales.routes';

const api = Router();

api.use(authRoutes);
api.use(productsRoutes);
api.use(salesRoutes);

export default api;
