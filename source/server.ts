import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import path from "node:path";
import cookieParser from "cookie-parser";
import * as dotenv from "dotenv";
import fs from "node:fs";

import indexRouter from "./routes/index";
import yayApiRouter from "./routes/api/yay-api";
import botApiRouter from "./routes/api/bot-api";
import agoraApiRouter from './routes/api/agora-api';

import { generateRandomFilename } from "./utils/utils";

const app = express();
dotenv.config();

const randomPort = Math.floor(Math.random() * (7000 - 3000 + 1)) + 3000;
const PORT = process.env.PORT || 3000/*randomPort*/;

let randomFilename: string = generateRandomFilename();
// const originalCSSPath: string = path.join(__dirname, "css", "styles.css");
// const randomCSSPath: string = path.join(__dirname, "views", randomFilename);

// if (!fs.existsSync(randomCSSPath)) {
//     fs.copyFileSync(originalCSSPath, randomCSSPath);
// }

// const files: string[] = fs.readdirSync(path.join(__dirname, "views"));
// files.forEach((file) => {
//     if (file.endsWith(".css") && file !== randomFilename) {
//         fs.unlinkSync(path.join(__dirname, "views", file));
//     }
// });

// app.use((req: Request, res: Response, next: NextFunction) => {
//     res.locals.cssFile = randomFilename;
//     next();
// });

app.use(cors());
app.use(express.static(path.join(__dirname, "views")));
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(cookieParser());

app.use("/", indexRouter);
app.use("/yay-api", yayApiRouter);
app.use("/api/bot-api", botApiRouter);
app.use("/api/agora-api", agoraApiRouter);

app.listen(PORT, () => {
    console.log(`サーバーがポート${PORT}で起動しました。 \nhttp://localhost:${PORT}`);
});
