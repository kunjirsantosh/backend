import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import commentRouter from "./routes/comment.routes.js"
import videoRouter from "./routes/video.routes.js"
//Routes import 
import userRouter from "./routes/user.routes.js"

const app  = express();

app.use(cors())

app.use(express.json({limit:'16kb'}))
app.use(express.urlencoded({extended:true, limit:'16kb'}))
app.use(express.static('static'))
app.use(cookieParser())





//routes declaration
app.use("/api/v1/users", userRouter);
app.use("/api/v1/comments", commentRouter);
app.use("/api/v1/videos", videoRouter);
export {app}