import express from 'express';
import http from 'http';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import cors from 'cors';
import authRoutes from './routes/auth';
import categoriesRoutes from './routes/categories';
import destinationsRoutes from './routes/destinations';
import routesRoutes from './routes/routes';

require('dotenv').config();

const app = express();
app.use(cors({
    credentials: true,
}));

app.use(compression());
app.use(cookieParser());
app.use(bodyParser.json());

const server = http.createServer(app);

server.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
});

app.use('/auth', authRoutes);
app.use('/categories', categoriesRoutes);
app.use('/destinations', destinationsRoutes);
app.use('/routes', routesRoutes);
