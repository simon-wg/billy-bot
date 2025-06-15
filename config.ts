const requiredEnv = (key: string): string => {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Environment variable ${key} is required but not set.`);
    }
    return value;
};

const token = requiredEnv("DISCORD_BOT_TOKEN");
const clientId = requiredEnv("CLIENT_ID");
const guildId = requiredEnv("GUILD_ID");
const cookie = requiredEnv("YOUTUBE_COOKIE");

export { clientId, cookie, guildId, token };
