import { Sequelize } from "sequelize";

    let password = process.env.PASSWORD    
    const connectDb = new Sequelize('usersdb', 'root', password,{
        dialect: 'mysql',
        host: 'localhost'
    });
    
    if(connectDb){
        console.log('Database connected Successfully')
    }
    else{
        console.log('Could not connect to database')
    }


export default connectDb;