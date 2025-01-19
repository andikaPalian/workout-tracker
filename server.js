import express from "express";
import "dotenv/config";
import connectDb from "./config/db.js";

const app = express();
const port = process.env.PORT;
connectDb();

app.use(express.json());

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});