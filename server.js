import express from "express";
import "dotenv/config";
import cors from "cors";
import connectDb from "./config/db.js";
import userRoute from "./routes/user.routes.js";
import workoutRoute from "./routes/workout.routes.js";
import reportRoute from "./routes/report.routes.js";

const app = express();
const port = process.env.PORT;
connectDb();

app.use(express.json());
app.use(cors());

app.use("/api/user", userRoute);
app.use("/api/workout", workoutRoute);
app.use("/api/report", reportRoute);

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});