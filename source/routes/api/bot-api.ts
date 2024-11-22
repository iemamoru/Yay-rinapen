import router from "..";
import { Request, Response } from "express";
import { getRandomBotId, isBotActive } from "../../utils/botUtils";
import { ERROR_MESSAGE, RESULT_MESSAGE } from "./messages";
import { BotModel } from "../../models/Bot";


router.get("/random_bot_id", async (req: Request, res: Response) => {
    try {
        const randomBotId = await getRandomBotId();

            
        res.status(200).json({
            result: RESULT_MESSAGE.SUCCESS,
            bot: { id: randomBotId },
        });
    } catch (error) {
        console.error("Error fetching random bot ID:", error);

        res.status(500).json({
            result: RESULT_MESSAGE.ERROR,
            message: error.message || "An internal error occurred.",
        });
    }
});


router.get("/:bot_id/status", async (req: Request, res: Response) => {
    try {
        const bot_id = req.params.bot_id;

        const bot = await BotModel.findOne({ user_id: bot_id });
        if (!bot) {
            res.status(404).json({
                status: RESULT_MESSAGE.ERROR,
                message: ERROR_MESSAGE.NOT_FOUND.botNotFound.message,
                error_code: ERROR_MESSAGE.NOT_FOUND.botNotFound.code,
            });
        }

        const isActive = await isBotActive(bot_id);

        res.status(200).json({
            status: "success",
            bot: {
                id: bot_id,
                isActive,
            },
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error("Error fetching bot status:", error);

        res.status(500).json({
            status: "error",
            message: "Failed to fetch bot status",
            error: error.message || "An unexpected error occurred",
            timestamp: new Date().toISOString(),
        });
    }
});


export default router;