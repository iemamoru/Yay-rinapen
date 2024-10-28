import express, { Request, Response } from "express";
import * as dotenv from "dotenv";

dotenv.config();

const router = express.Router();
const Index: string | undefined = process.env.IndexFileName;

router.get("/", (req: Request, res: Response) => {
    if (Index) res.render(Index);
});

export default router;
