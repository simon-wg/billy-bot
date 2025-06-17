import { token } from "@/config";
import { getClient } from "@/utils/discord";
import { generateDependencyReport } from "@discordjs/voice";

console.log(generateDependencyReport());

const client = getClient();

client.login(token).catch((error) => {
    console.error("Failed to login:", error);
    process.exit(1);
});
