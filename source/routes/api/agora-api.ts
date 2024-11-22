import { Request, Response } from "express";
import router from "..";
import { ERROR_MESSAGE, RESULT_MESSAGE } from "./messages";
import { BotModel, IBot } from "../../models/Bot";
import { participateInConferences } from "../../utils/agoraUtil";

router.get('/agora_info', async (req: Request, res: Response) => {
    const { bot_id, conference_call_id } = req.query;

    // Validate query parameters
    if (typeof bot_id !== 'string' || typeof conference_call_id !== 'string') {
        const error = ERROR_MESSAGE.VALIDATION.invalidQueryParams.message;
        res
            .status(ERROR_MESSAGE.VALIDATION.invalidQueryParams.code || 400)
            .json({ result: RESULT_MESSAGE.ERROR, message: error });
    }

    try {
        // Fetch bot from the database
        const bot: IBot | null = await BotModel.findOne({ user_id: bot_id });
        if (!bot) {
            const error = ERROR_MESSAGE.NOT_FOUND.botNotFound.message;
            res
                .status(ERROR_MESSAGE.NOT_FOUND.botNotFound.code || 404)
                .json({ result: RESULT_MESSAGE.ERROR.message, message: error });
        }

        // Wrap single bot in an array
        const agoraInfoArray = await participateInConferences(conference_call_id, [bot]);
        if (agoraInfoArray.length > 0) {
            const agoraInfo = agoraInfoArray[0]; // Access the first element in the array
        
            console.log(agoraInfo);
        
            // Respond with Agora information
            res.json({
                agora_channel: agoraInfo.agora_channel,
                agoraRtmToken: agoraInfo.agoraRtmToken,
                conference_call_user_uuid: agoraInfo.conference_call_user_uuid,
                agora_channel_token: agoraInfo.agora_channel_token,
                APP_ID: agoraInfo.APP_ID
            });
        } else {
            // Handle the case where no valid info is returned
            res.status(500).json({ error: 'Failed to retrieve Agora information.' });
        }
    } catch (error) {
        console.error(`Error fetching Agora info for botId ${bot_id}:`, error);
        const fetchError = ERROR_MESSAGE.SERVER.fetchAgoraFailed.message;
        res
            .status(ERROR_MESSAGE.SERVER.fetchAgoraFailed.code || 500)
            .json({ result: RESULT_MESSAGE.ERROR, message: fetchError });
    }
});

export default router;
