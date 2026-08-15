import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();
app.use(express.static("public"));


//basic config
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({extended:true,limit:"16kb"}))
app.use(express.static("public"))


app.use(cookieParser());




//cors config
app.use(cors({
    origin: process.env.CORS_ORIGIN?.split(",") || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    
}));


//import the routes

import healthCheckRouter from "./routes/healthcheck.routes.js";
import authRouter from "./routes/auth.routes.js";
import projectRouter from "./routes/project.routes.js";
app.use("/api/v1/healthcheck", healthCheckRouter);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/projects", projectRouter);




// 1. Import the task router
import taskRouter from "./routes/task.routes.js";


// 2. Register the route
app.use("/api/v1/tasks", taskRouter);
export default app;