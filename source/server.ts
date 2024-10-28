import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import path from "node:path";
import cookieParser from "cookie-parser";
import * as dotenv from "dotenv";
import fs from 'node:fs'

import indexRouter from "./routes/index";
import { generateRandomFilename } from "./utils/utils";

const application = express();
dotenv.config();

const randomPort = Math.floor(Math.random() * (7000 - 3000 + 1)) + 3000;
const PORT = process.env.PORT || randomPort;

application.use((req: Request, res: Response, next: NextFunction) => {
    const randomFilename: string = generateRandomFilename();
    const originalCSSPath: string = path.join(__dirname, "interface", "1_fd9175f4-b01c-7404-3725-7dcd9fb733c9.css");
    const randomCSSPath: string = path.join(__dirname, "interface", randomFilename);
    
    fs.copyFileSync(originalCSSPath, randomCSSPath);
    res.locals.cssFile = randomFilename;

    const files: string[] = fs.readdirSync(path.join(__dirname, "interface"));
    files.forEach((file) => {
        if (file.endsWith(".css") && file !== randomFilename) {
            fs.unlinkSync(path.join(__dirname, "interface", file));
        }
    });

    res.header("Access-Control-Allow-Origin", "*");
    res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept"
    );
    next();
});

application.use(cors());
application.set("interface", path.join(__dirname, "interface"));
application.set("view engine", "ejs");
application.use(cookieParser());

application.use("/", indexRouter);

application.listen(PORT, () => {
    console.log(`サーバーがポート${PORT}で起動しました。`);
});