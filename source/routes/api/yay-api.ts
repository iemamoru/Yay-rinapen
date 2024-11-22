import { Request, Response, Router } from "express";
import dotenv from 'dotenv';
import { BotModel, IBot } from "../../models/Bot";
import { updateAccessToken } from "../../utils/tokenUtils";
import { ERROR_MESSAGE, RESULT_MESSAGE } from "./messages";
import fetch from 'node-fetch'
import { HttpsProxyAgent } from "https-proxy-agent";
const router = Router();
const proxyAgent = new HttpsProxyAgent(process.env.PROXY_URL);
dotenv.config();

router.get('/v1/posts/active_call', async (req: Request, res: Response) => {
        try {
            const { user_id } = req.query;
            if (!user_id) {
                res.status(RESULT_MESSAGE.ERROR.code).json({
                    result: RESULT_MESSAGE.ERROR.code,
                    message: ERROR_MESSAGE.VALIDATION.userIdIsRequired.message,
                    error_code: ERROR_MESSAGE.VALIDATION.userIdIsRequired.code,
                });
            }

            const getActiveCallUserApiUrl: string = `${process.env.YAY_HOST}/v1/posts/active_call?user_id=${user_id}`;
            const randomBotIdResponse = await fetch(`${process.env.HOST || "http://localhost:3000"}/api/bot-api/random_bot_id`);
            const randomBotIdData = await randomBotIdResponse.json();
            const bot_id: string = randomBotIdData.bot.id;

            const firstBot: IBot = await BotModel.findOne({ user_id: bot_id });
            if (!firstBot) {
                res.status(ERROR_MESSAGE.NOT_FOUND.botNotFound.code).json({
                    result: RESULT_MESSAGE.ERROR.message,
                    message: ERROR_MESSAGE.NOT_FOUND.botNotFound.message,
                    error_code: ERROR_MESSAGE.NOT_FOUND.botNotFound.code,
                });
            }

            const headers = {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${firstBot.access_token}`,
                "User-Agent": process.env.USER_AGENT,
            };

            const fetchYayActiveCallData = async (token: string) => {
                const response = await fetch(getActiveCallUserApiUrl, {
                    headers: {
                        ...headers,
                        Authorization: `Bearer ${token}`,
                    },
                    agent: proxyAgent
                    
                });
                return response.json();
            };

            let yayActiveCallData = await fetchYayActiveCallData(firstBot.access_token);

            if (yayActiveCallData.error_code === -3) {
                await updateAccessToken(firstBot);
                const reBot: IBot = await BotModel.findOne({ user_id: bot_id });
                yayActiveCallData = await fetchYayActiveCallData(reBot.access_token);
            }

            if (yayActiveCallData && yayActiveCallData.post?.conference_call) {
                res.json({
                    result: RESULT_MESSAGE.SUCCESS.message,
                    conference_call: yayActiveCallData.post.conference_call,
                });
            } else {
                res.status(ERROR_MESSAGE.NOT_FOUND.conferenceCallNotFound.code).json({
                    result: RESULT_MESSAGE.ERROR.message,
                    message: ERROR_MESSAGE.NOT_FOUND.conferenceCallNotFound.message,
                    error_code: ERROR_MESSAGE.NOT_FOUND.conferenceCallNotFound.code,
                });
            }
        } catch (error) {
            res.status(500).json({
                result: RESULT_MESSAGE.ERROR.message,
                message: error.message || "Internal server error",
            });
        }
});

router.get("/v2/calls/conferences/:conference_id",  async (req: Request, res: Response) =>{
        try {
            const { conference_id } = req.params;

            if (!conference_id) {
                res.status(400).json({
                    result: RESULT_MESSAGE.ERROR.code,
                    message: ERROR_MESSAGE.VALIDATION.conferenceIdIsRequired.message,
                    error_code: ERROR_MESSAGE.VALIDATION.conferenceIdIsRequired.code,
                });
            }

            const getConferenceCallIdApiUrl: string = `${process.env.YAY_HOST}/v2/calls/conferences/${conference_id}`;
            const randomBotIdResponse = await fetch(`${process.env.HOST || "http://localhost:3000"}/api/bot-api/random_bot_id`);
            const randomBotIdData = await randomBotIdResponse.json();

            const bot_id: string = randomBotIdData.bot.id;
            let bot: IBot = await BotModel.findOne({ user_id: bot_id });

            if (!bot) {
                res.status(404).json({
                    result: RESULT_MESSAGE.ERROR.code,
                    message: ERROR_MESSAGE.NOT_FOUND.botNotFound.message,
                    error_code: ERROR_MESSAGE.NOT_FOUND.botNotFound.code,
                });
            }

            const fetchConferenceCallData = async (token: string) => {
                const headers = {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                    "User-Agent": process.env.USER_AGENT,
                };
                const response = await fetch(getConferenceCallIdApiUrl, { headers });
                return response.json();
            };

            let conferenceCallIdData = await fetchConferenceCallData(bot.access_token);

            if (conferenceCallIdData.error_code === -3) {
                await updateAccessToken(bot);
                bot = await BotModel.findOne({ user_id: bot_id });

                if (!bot) {
                    res.status(500).json({
                        result: RESULT_MESSAGE.ERROR.message,
                        message: ERROR_MESSAGE.AUTHORIZATION.tokenUpdateFailed.message,
                        error_code: ERROR_MESSAGE.AUTHORIZATION.tokenUpdateFailed.code,
                    });
                }

                conferenceCallIdData = await fetchConferenceCallData(bot.access_token);
                console.log(conferenceCallIdData)
            }

            if (conferenceCallIdData && conferenceCallIdData.id) {
                res.json({
                    result: RESULT_MESSAGE.SUCCESS.message,
                    data: conferenceCallIdData,
                });
            } else {
                res.status(404).json({
                    result: RESULT_MESSAGE.ERROR.message,
                    message: ERROR_MESSAGE.NOT_FOUND.conferenceCallNotFound.message,
                    error_code: ERROR_MESSAGE.NOT_FOUND.conferenceCallNotFound.code,
                });
            }
        } catch (error) {
            console.error("Error fetching conference call:", error);
            res.status(500).json({
                result: RESULT_MESSAGE.ERROR.message,
                message: "An internal error occurred.",
                error: error.message || error,
            });
        }
});

router.get("/v2/posts/:post_id", async (req: Request, res: Response) => {
        try {
            const { post_id } = req.params;

            if (!post_id) {
                res.status(400).json({
                    result: RESULT_MESSAGE.ERROR.code,
                    message: ERROR_MESSAGE.VALIDATION.postIdIsRequired.message,
                    error_code: ERROR_MESSAGE.VALIDATION.postIdIsRequired.code,
                });
            }

            const getBotIdUrl = `${process.env.HOST || "http://localhost:3000"}/api/bot-api/random_bot_id`;
            const botIdResponse = await fetch(getBotIdUrl);
            const botIdData = await botIdResponse.json();
            const bot_id = botIdData.bot.id;

            let bot = await BotModel.findOne({ user_id: bot_id });
            if (!bot) {
                res.status(404).json({
                    result: RESULT_MESSAGE.ERROR.code,
                    message: ERROR_MESSAGE.NOT_FOUND.botNotFound.message,
                    error_code: ERROR_MESSAGE.NOT_FOUND.botNotFound.code,
                });
            }

            const getPostData = async (token: string) => {
                const url = `${process.env.YAY_HOST}/v2/posts/${post_id}`;
                const headers = {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                    "User-Agent": process.env.USER_AGENT,
                };
                const response = await fetch(url, { headers });
                return response.json();
            };

            let postData = await getPostData(bot.access_token);

            if (postData.error_code === -3) {
                await updateAccessToken(bot);
                bot = await BotModel.findOne({ user_id: bot_id });

                if (!bot) {
                    res.status(500).json({
                        result: RESULT_MESSAGE.ERROR.message,
                        message: ERROR_MESSAGE.AUTHORIZATION.tokenUpdateFailed.message,
                        error_code: ERROR_MESSAGE.AUTHORIZATION.tokenUpdateFailed.code,
                    });
                }

                postData = await getPostData(bot.access_token);
            }

            if (postData && postData.id) {
                res.json({
                    result: RESULT_MESSAGE.SUCCESS.message,
                    data: postData,
                });
            } else {
                res.status(404).json({
                    result: RESULT_MESSAGE.ERROR.message,
                    message: ERROR_MESSAGE.NOT_FOUND.postNotFound.message,
                    error_code: ERROR_MESSAGE.NOT_FOUND.postNotFound.code,
                });
            }
        } catch (error) {
            console.error("Error fetching post data:", error);
            res.status(500).json({
                result: RESULT_MESSAGE.ERROR.message,
                message: "An internal error occurred.",
                error: error.message || error,
            });
        }
});


export default router;
