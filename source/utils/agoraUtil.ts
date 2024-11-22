import { IBot } from "../models/Bot";
import { updateAccessToken } from "./tokenUtils";
import dotenv from 'dotenv';
import { RESULT_MESSAGE } from "../routes/api/messages";
import { HttpsProxyAgent } from "https-proxy-agent";
import fetch from "node-fetch"
dotenv.config();


const proxyAgent = new HttpsProxyAgent(process.env.PROXY_URL);
interface AgoraChannelInfo {
    agora_channel: string;
    conference_call_user_uuid: string;
    agora_channel_token: string;
}
export interface AgoraInfo {
    status: string;
    agora_channel: string;
    agoraRtmToken: string;
    conference_call_user_uuid: string;
    agora_channel_token: string;
    APP_ID: string;
}

async function fetchAgoraRTMToken(conference_id: string, user: IBot): Promise<string> {
    try {
        const response = await fetch(`${process.env.YAY_HOST}/v2/calls/${conference_id}/agora_rtm_token`, {
            headers: {
                'Authorization': `Bearer ${user.access_token}`,
                'Content-Type': 'application/json',
                'User-Agent': process.env.USER_AGENT,
            },
            // agent: proxyAgent
        });

        let data = await response.json();
        console.log(data)
        if (data.error_code && data.error_code === -3) {
            console.warn(`RTM token expired. Updating token for bot ID: ${user.user_id}`);
            await updateAccessToken(user);

            // Retry fetching RTM token with updated access token
            const retryResponse = await fetch(`${process.env.YAY_HOST}/v2/calls/${conference_id}/agora_rtm_token`, {
                headers: {
                    'Authorization': `Bearer ${user.access_token}`,
                    'Content-Type': 'application/json',
                    'User-Agent': process.env.USER_AGENT,
                },
                // agent: proxyAgent
            });

            data = await retryResponse.json();

            if (data.error_code) {
                throw new Error(`Failed to fetch RTM token after update. Error code: ${data.error_code}`);
            }
        }

        return data.token;
    } catch (error) {
        console.error(`Error fetching Agora RTM token for bot ID ${user.user_id}:`, error);
        throw new Error('Failed to fetch Agora RTM token');
    }
}

async function fetchAgoraInfo(conference_call_id: string, user: IBot | null) {
    try {
        const APP_ID = process.env.AGORA_APP_ID;

        if (!user?.access_token) {
            console.warn(`No access token for bot ID: ${user?.user_id}. Updating token.`);
            await updateAccessToken(user);
        }


        const { agora_channel, conference_call_user_uuid, agora_channel_token } = await startCall(conference_call_id, user);
        const agoraRtmToken = await fetchAgoraRTMToken(conference_call_id, user);

        console.log(`${agora_channel}\n${conference_call_user_uuid}\n${agora_channel_token}`);
        return {
            status: RESULT_MESSAGE.SUCCESS.message,
            agora_channel,
            agoraRtmToken,
            conference_call_user_uuid,
            agora_channel_token,
            APP_ID,
        };
    } catch (error) {
        console.error(`Error fetching Agora info for bot ID ${user?.user_id}:`, error);
        return null;
    }
}

async function startCall(conference_call_id: string, user: IBot | null): Promise<AgoraChannelInfo> {
    try {
        const startUrl = `${process.env.YAY_HOST}/v2/calls/start_conference_call`;

        let response = await fetch(startUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${user?.access_token}`,
                'Content-Type': 'application/json',
                'User-Agent': process.env.USER_AGENT,
            },
            body: JSON.stringify({ conference_id: conference_call_id }),
            // agent: proxyAgent
        });

        let data = await response.json();

        if (data.error_code && data.error_code === -3) {
            console.warn(`Token expired for bot ID: ${user?.user_id}. Refreshing token.`);
            await updateAccessToken(user);

            response = await fetch(startUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${user?.access_token}`,
                    'Content-Type': 'application/json',
                    'User-Agent': process.env.USER_AGENT,
                },
                body: JSON.stringify({ conference_id: conference_call_id }),
                // agent: proxyAgent
            });

            data = await response.json();

            if (data.error_code) {
                throw new Error(`Failed to start call after retry. Error code: ${data.error_code}, message: ${data.message}`);
            }
        }

        return {
            agora_channel: data.conference_call.agora_channel,
            conference_call_user_uuid: data.conference_call_user_uuid,
            agora_channel_token: data.conference_call.agora_token,
        };
    } catch (error) {
        console.error('Error starting call:', error);
        throw new Error('Failed to start conference call');
    }
}

export async function participateInConferences(conference_call_id: any, bots: IBot[]) {
    const results = await Promise.all(
        bots.map(async (bot) => {
            console.log(`Processing bot ID: ${bot.user_id}`);
            const result = await fetchAgoraInfo(conference_call_id, bot);
            if (!result) {
                console.error(`Participation failed for bot ID: ${bot.user_id}`);
            } else {
                console.log(`Participation successful for bot ID: ${bot.user_id}`);
            }
            return result;
        })
    );

    return results.filter(result => result !== null);
}
