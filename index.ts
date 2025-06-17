import { token } from "@/config";
import { MusicManager } from "@/utils/audioplayer";
import { getClient } from "@/utils/discord";

const client = getClient();
const musicManager = new MusicManager(client);

client.login(token).catch((error) => {
    console.error("Failed to login:", error);
    process.exit(1);
});

export { musicManager };
