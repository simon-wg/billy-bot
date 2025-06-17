import { token } from "./config";
import { getClient } from "./utils/discord";

const client = getClient();

client.login(token).catch((error) => {
    console.error("Failed to login:", error);
    process.exit(1);
});
