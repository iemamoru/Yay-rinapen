import mongoose, { Document, Schema } from "mongoose";
import dotenv from 'dotenv'

dotenv.config();
mongoose.connect(process.env.DB_URI);

interface IBot extends Document {
    user_id: string;
    email: string;
    password: string;
    access_token: string;
    uuid: string;
}

const userSchema = new Schema({
    user_id: { type: String, required: true },
    email: { type: String, required: true },
    password: {  type: String, required: true },
    access_token: { type: String, required: true, Encrypt: true },
    uuid: { type: String, required: true },
});

const BotModel = mongoose.model<IBot>("Bot", userSchema);

export { IBot, BotModel };