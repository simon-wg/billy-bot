import type { InteractionResponse } from "discord.js";

const userMessages = new Map<string, InteractionResponse<boolean>>();

const setMessage = (userId: string, message: InteractionResponse<boolean>) => {
    if (userMessages.has(userId)) {
        userMessages.get(userId)?.delete();
    }
    userMessages.set(userId, message);
};

export { setMessage };
