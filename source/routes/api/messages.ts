export const RESULT_MESSAGE = {
    SUCCESS: {
        message: "success",
        code: 201,
    },
    ERROR: {
        message: "error",
        code: 401,
    },
};

export const ERROR_MESSAGE = {
    VALIDATION: {
        userIdIsRequired: {
            code: 1001,
            message: "user_id is required.",
        },
        postIdIsRequired: {
            code: 1002,
            message: "post_id is required.",
        },
        conferenceIdIsRequired: {
            code: 1003,
            message: "conference_id is required.",
        },
        invalidQueryParams: {
            code: 1004,
            message: "Invalid query parameters.",
        },
    },
    NOT_FOUND: {
        botNotFound: {
            code: 2001,
            message: "Bot not found.",
        },
        conferenceCallNotFound: {
            code: 2002,
            message: "Conference call not found.",
        },
        postNotFound: {
            code: 2003,
            message: "Post not found.",
        },
        userNotFound: (bot_id: string) => ({
            code: 2004,
            message: `User with botId ${bot_id} not found.`,
        }),
    },
    AUTHORIZATION: {
        tokenUpdateFailed: {
            code: 3001,
            message: "Token update failed.",
        },
    },
    SERVER: {
        fetchAgoraFailed: {
            code: 4001,
            message: "Failed to fetch Agora Info.",
        },
    },
};
