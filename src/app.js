import 'express-async-errors';
import helmet from 'helmet';
import cors from 'cors';
import errorHandler from './middleware/errorHandler.js';
import usersRoute from './routes/usersRoute/usersRoute.js'; // Assuming this exists
import restaurantsRoute from './routes/restaurantsRoute/restaurantsRoute.js';
import staffRoute from './routes/staffRoute/staffRoute.js';
import diningZonesRoute from './routes/diningRoute/diningZonesRoute.js';
import diningTablesRoute from './routes/diningRoute/diningTablesRoute.js';
import menuCategoriesRoute from './routes/menuRoute/menuCategoriesRoute.js';
import menuItemsRoute from './routes/menuRoute/menuItemsRoute.js';
import modifiersRoute from './routes/menuRoute/modifiersRoute.js';
import ordersRoute from './routes/ordersRoute/ordersRoute.js';
import reportsRoute from './routes/reportsRoute/reportsRoute.js';
import reservationsRoute from './routes/reservationsRoute/reservationsRoute.js';
import express from 'express';

const app = express();
app.use(express.json());
app.use(helmet());
app.use(cors());

app.use('/test', usersRoute);
app.use('/api/v1/restaurants', restaurantsRoute);
app.use('/api/v1/staff', staffRoute);
app.use('/api/v1/dining-zones', diningZonesRoute);
app.use('/api/v1/dining-tables', diningTablesRoute);
app.use('/api/v1/menu-categories', menuCategoriesRoute);
app.use('/api/v1/menu-items', menuItemsRoute);
app.use('/api/v1/modifiers', modifiersRoute);
app.use('/api/v1/orders', ordersRoute);
app.use('/api/v1/reports', reportsRoute);
app.use('/api/v1/reservations', reservationsRoute);

app.use(errorHandler);

export default app;