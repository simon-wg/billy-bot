import { token } from "@/config";
import { getClient } from "@/utils/discord";
import { initializeAudioPlayer } from "./utils/audioplayer";

const client = getClient();
initializeAudioPlayer(client);

client.login(token).catch((error) => {
    console.error("Failed to login:", error);
    process.exit(1);
});
