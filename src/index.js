import dotenv from "dotenv";
import connectDB from "./db/index.js";
import express from "express";


const app = express();

dotenv.config({
    path:"./env"
});

connectDB()
.then(()=>{
    app.on('error',(error) => {
        console.log("Error", error)
    });
    app.listen(porcess.env.PORT || 8000,() => {
        console.log(`Server is runnuing on port: ${procss.env.PORT}`);
    })
    
})  
.catch((error)=>{
    console.log(`Mongo Database connection error`, error)
});



// import mongoose from "mongoose";
// import { DB_NAME } from "./constants";
//     ( async  () => {
//         try{
//             await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
//         } catch (error) {
//             console.error(error)
//         }
// })();


