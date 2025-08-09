import 'express-async-errors';
import helmet from 'helmet';
import cors from 'cors';
import errorHandler from './middleware/errorHandler.js';
import usersRoute from './routes/usersRoute/usersRoute.js';
import restaurantsRoute from './routes/restaurantsRoute.js';
import staffRoute from './routes/staffRoute.js';
import express from 'express';

const app = express();
app.use(express.json());
app.use(helmet());
app.use(cors());

app.use('/test', usersRoute);
app.use('/api/v1/restaurants', restaurantsRoute);
app.use('/api/v1/staff', staffRoute);

app.use(errorHandler);

export default app;