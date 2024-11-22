import { IBot } from "../models/Bot";
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

export async function updateAccessToken(user: IBot | null): Promise<void> {
    try {
        if (!user) {
            throw new Error('User is null or undefined');
        }

        if (!user.uuid) {
            user.uuid = uuidv4();
            await user.save();
        }

        const loginResponse = await fetch(`${process.env.YAY_HOST}/v3/users/login_with_email`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                "User-Agent":   process.env.USER_AGENT
            },
            body: JSON.stringify({
                api_key: process.env.API_KEY,
                uuid: user.uuid,
                password: user.password,
                email: user.email
            })
        });

        
        if (!loginResponse.ok) {
            const loginData = await loginResponse.json();
            console.log(loginData)
            throw new Error('Failed to login and get new access token');
        }

        const loginData = await loginResponse.json();

        if (!user.user_id) {
            user.user_id = loginData.user_id;
        }

        user.access_token = loginData.access_token;
        await user.save();

        console.log('Access token updated successfully');
    } catch (error) {
        console.error('Error updating access token:', error);
        throw new Error('Failed to update access token');
    }
}