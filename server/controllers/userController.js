import jwt from 'jsonwebtoken';
import express from 'express';
import bcrypt from 'bcrypt';
import {body, validationResult} from 'express-validator';
//User Model
import userModel from '../models/userModel.js'

const userRoute = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Def:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: The user ID.
 *         firstName:
 *           type: string
 *           description: The user's first name.
 *         lastName:
 *           type: string
 *           description: The user's last name.
 *         email:
 *           type: string
 *           description: The user's email.
 *         phone:
 *           type: string
 *           description: The user's phone.
 *         password:
 *           type: string
 *           description: The user's password.
 *         token:
 *           type: string
 *           description: The user's token.
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     LoginDef:
 *       type: object
 *       properties:
 *         email:
 *           type: string
 *           description: The user's email.
 *         password:
 *           type: string
 *           description: The user's password.
 */


/**
 * @swagger
 * components:
 *   schemas:
 *     ProfileDef:
 *       type: object
 *       properties:
 *         email:
 *           type: string
 *           description: The user's email.
 */


//Verify Token
let verifyToken = (req, res, next) => {
    //const bearerHeader = req.headers('authorization');
    const bearerHeader = req.get("Authorization");
    console.log('Authorisation ' +bearerHeader);
    if(bearerHeader){ 
        const bearer = bearerHeader.split(' ');
        const bearerToken = bearer[1];
        console.log('splited token ' +bearerToken);        
        //req.token = bearerToken
        jwt.verify(bearerToken, 'SecretKey', (err, success) =>{
            if(err){
                return res.status(403).json({Error: 'Token could not be verified'})
            }
            if(success){
                console.log('Token verified');
                //res.status(200).json({status: 'verified', token: bearerToken});                
                next();
            }
        })
    }
    else{
        res.status(403).json({Error: 'No Token Available'})
    }
}

/**
 * @swagger
 * /api/profile:
 *   post:
 *     security:              # <--- ADD THIS
 *       - bearerAuth: []     # <--- ADD THIS
 *     summary: Retrieve a user profile by email.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *              $ref: '#/components/schemas/ProfileDef' 
 *     description: Retrieve a user profile from User Validation and Authentication. 
 *     responses:
 *       200:
 *         description: User Profiles. 
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Def'
*/      
userRoute.route('/profile').post(verifyToken, (req, res) => {  
    userModel.findOne({where:{email: req.body.email}})    
    .then((user) =>{
        res.status(200).json(user)
    })
    .catch((error) =>{
        res.status(400).json({Error: 'Error fetching user profile ' +error})
    })
})



/**
 * @swagger
 * /api/login:
 *   post:
 *     summary: Retrieve a list of user profile.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *              $ref: '#/components/schemas/LoginDef'
 *     description: Retrieve user profiles from User Validation and Authentication. 
 *     responses:
 *       200:
 *         description: User Profiles. 
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Def'
*/   
userRoute.route('/login').post( 
    body('email').isEmail(),
    body('password').isLength({min:5}),
    //body('phone')
    (req, res) =>{
    //Validate Inputs
    let errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({Errors: errors.array()})
    }
    else{
        //Check if user exist
        userModel.findOne({where:{email: req.body.email}})
        .then((user) =>{
            if(!user){
                res.status(400).json({Error: 'Users does not exists'})
            }else{
                //Compare password
                let password = req.body.password;
                let hash = user.password;
                console.log(password, ' ', hash);               

                let isMatch =  bcrypt.compare(password, hash);
                if(isMatch){
                    const email = user.email;
                    jwt.sign({email}, 'SecretKey', (error, token) =>{
                        res.status(200).json({
                            success: true,
                            token: 'Bearer ' + token
                        })
                    })                    
                }
                else{
                    return res.status(400).json({Error: 'Invalid username or password '})
                }
            }
        })
        .catch((error) => {
            console.log('Err ' +error)
        })
    }
})

/**
 * @swagger
 * /api/signUp:
 *   post:
 *     summary: add a new Employee.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *              $ref: '#/components/schemas/Def'
 *     description: add a new Employee to Employee Management System. 
 *     responses:
 *       201:
 *         description: A new user added. 
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Def'
*/  
userRoute.route('/signUp').post(
    body('email').isEmail(), 
    body('password').isLength({min: 5}),
    (req, res) =>{
    //Validate inputs
    const errors = validationResult(req);
    if(!errors.isEmpty()){
       return res.status(400).json({Errors: errors.array()});
    }
    //Check if email exist
    userModel.findOne({where: {email: req.body.email}})
    .then((user) =>{
        if(!user){
            let newUser = new userModel(req.body);
            //Hash password
            var saltRounds  = 10;        
            bcrypt.hash(newUser.password, saltRounds, (err, hash) => {
                // Store hash in your password DB.
                if(err){
                    return res.status(400).json({Hash: 'Could not hash password'})                
                }
                if(hash){
                    newUser.password = hash;
                    console.log('hash ' + hash)                
                    newUser.save()
                    .then((user) =>{
                        res.json(user)
                    })
                    .catch((error) => {
                        console.log(`Could not save user ${error}`)
                    })
                }
            });
        }
        else{
            return res.status(400).json({Email: `${req.body.email} Already exist`})
        }
        
    })
    .catch((error) => {
        console.log('Error finding email ' +error + ' ' + req.body.email)
    })

})



export default userRoute