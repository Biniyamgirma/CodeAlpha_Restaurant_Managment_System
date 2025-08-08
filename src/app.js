import 'express-async-errors';
import helmet from 'helmet';
import cors from 'cors';
import errorHandler from './middleware/errorHandler.js';
import usersRoute from './routes/usersRoute/usersRoute.js'
import express from 'express';

const app = express();
app.use(express.json())
app.use(errorHandler);
app.use(helmet());
app.use(cors());

app.get('/',usersRoute);


export default app;