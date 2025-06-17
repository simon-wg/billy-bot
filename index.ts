import { token } from "@/config";
import { setupAudioPlayers } from "@/utils/audioplayer";
import { getClient } from "@/utils/discord";

const client = getClient();

setupAudioPlayers();

client.login(token).catch((error) => {
    console.error("Failed to login:", error);
    process.exit(1);
});
