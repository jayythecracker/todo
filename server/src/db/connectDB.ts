import mongoose from "mongoose";

export const connectDB = async()=>{
try {
    let db_string='';
    if(process.env.NODE_ENV==='production'){
        db_string = process.env.MONGO_URI!
    }else{
        db_string = process.env.MONGO_LOCAL_URI!
   
    }
  const connection = await  mongoose.connect(db_string)
  console.log(`DB connect successfully : ${connection.connection.host}`);
  
} catch (error) {
    console.log(`DB connection error ${error}`);
    
}
}