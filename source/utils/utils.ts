import  crypto from "crypto";

export function generateRandomFilename() {
    const size: number = 8;
    return crypto.randomBytes(size).toString("hex") + ".css";
}