import express from 'express';
import cors from 'cors';
import connectDb from './config/db.js';
import dotenv from 'dotenv';
import pkg from 'body-parser';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi  from 'swagger-ui-express';

//User Route
import userRoute from './controllers/userController.js';

//Swagger Route
const options = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'User Validation and Authentication',
        version: '1.0.0',
        description: 'User Validation and Authentication',
        license: {
            name: 'License Under MIT',
            url: 'https://spdx.org/licenses/MIT.html'          
        },
        contact: {
            name: 'Clifford Edetanlen',
            url: 'https://cliffordedetanlen.com',
            email: 'clifford@gmail.com',           
        },
      },      
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          }
        }
      },
      // security: [{
      //   bearerAuth: []
      // }],
      servers: [
        {
            url: 'http://localhost:4000',
            description: 'Development server',
        }
    ],
    },    
    apis: ['./controllers/userController.js'], 
    
  };

  const openApiSpec = swaggerJsdoc(options);

//Body Parser
const {json, urlencoded} = pkg;

//dotenv
dotenv.config();

//connect to database
connectDb.sync();

//create express server
const app = express();

//encode url
app.use(urlencoded({extended: true}))

//convert incoming data to json
app.use(json());

//Enable cors
app.use(cors());

//Swagger UI
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));

//Route Configuration
app.use('/api', userRoute);

//Server port
const port = process.env.PORT || 5000

app.listen(port, () => {
    console.log('Server connected successfully on port ' +port)
})

