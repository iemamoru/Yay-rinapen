import express, { Request, Response } from "express";
import * as dotenv from "dotenv";

dotenv.config();

const router = express.Router();
const Index: string | undefined = process.env.IndexFileName;

router.get("/", (req: Request, res: Response) => {
    if (Index) res.render(Index);
});

router.get('/conference/:conference_call_id/user/:userUUID', async (req: Request, res: Response) => {
    const { conference_call_id, userUUID } = req.params;

    try {
        // const conferenceData = await getConferenceData(conference_call_id);
        // const userData = await getUserData(userUUID);

        // if (!conferenceData || !userData) {
        //     res.status(404).json({
        //         status: 'error',
        //         message: 'Conference or user not found.',
        //     });
        // }

        res.status(200).json({
            status: 'success',
            // conference: conferenceData,
            // user: userData,
        });
    } catch (error) {
        console.error('Error handling conference user route:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error.',
        });
    }
});


export default router;
