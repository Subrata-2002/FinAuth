require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const { sequelize } = require('./models');
const { globalErrorHandler } = require('./middleware/errorHandler');
const { seedRoles, seedAdminUser } = require('./config/seed');
const { loginRateLimiter, generalRateLimiter } = require('./middleware/rateLimitMiddleware');

const app = express();

app.use(helmet());
app.use(compression());
app.use(express.json());


app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));


app.use('/api/auth/login', loginRateLimiter);
app.use('/api', generalRateLimiter);

app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/records', require('./routes/records'));
app.use('/api/dashboard', require('./routes/dashboard'));


app.get('/health', (req, res) => res.json({ status: 'ok' }));


app.use(globalErrorHandler);

const PORT = process.env.PORT || 3000;

const start = async () => {
  try {
    await sequelize.authenticate();

    console.log('Database connected.');

    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      console.log('Database altered for development.');
    } else {
      await sequelize.sync(); 
    }
    console.log('Models synced.');
    await seedRoles();
    await seedAdminUser();
    app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
  } catch (err) {
    console.error('Failed to start:', err);
    process.exit(1);
  }
};

start();

module.exports = app; 
