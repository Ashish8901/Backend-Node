const express = require('express');
const app = express();
const dotenv = require('dotenv');
const path = require('path');
const { errorHandler, notFound } = require('./utils/errorHandler');
const cors = require('cors');
const helmet = require('helmet');
const swaggerUi = require('swagger-ui-express');

const swaggerDocument1 = require('./swagger.json');

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use((req, res, next) => {
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});
dotenv.config();
require('./utils/db');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const whitelist = (process.env.ENABLE_CORS_DOMAIN || '')
  .split(',')
  .map((item) => {
    return item.trim();
  });

app.use(
  cors({
    origin: function (origin, callback) {
      console.log(origin);
      if (
        typeof origin == 'undefined' ||
        !origin ||
        whitelist.indexOf(origin) !== -1
      ) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    optionsSuccessStatus: 200, // Legacy browser support
    methods: process.env.ENABLE_CORS_METHODS,
  })
);
app.use(helmet());
app.use((req, res, next) => {
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});
app.use('/Images', express.static('./Images'));
app.use('/Uploads', express.static(path.join(__dirname, '/Uploads')));

app.use(express.static('public'));

// app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use('/api-doc', swaggerUi.serve, swaggerUi.setup(swaggerDocument1));

app.use('/user', require('./routes/userRoutes'));
app.use('/post', require('./routes/postRoutes'));
app.use('/category', require('./routes/categoryRoutes'));
app.use('/resume', require('./routes/resumeRoutes'));

app.get('/', (req, res) => {
  res.send('Welcome from Revanatech API!');
});
app.use(notFound);
app.use(errorHandler);
app.listen(process.env.PORT, () =>
  console.log(`Example app listening on port ${process.env.PORT}!`)
);
