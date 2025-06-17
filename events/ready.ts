import { getClient } from "@/utils/discord";
import type { Event } from "@/utils/types";
import { Events } from "discord.js";

export default {
    name: Events.ClientReady,
    once: true,
    execute() {
        const client = getClient();
        console.debug(`Ready! Logged in as ${client.user?.tag}`);
        for (const server of client.guilds.cache.values()) {
            console.debug(`Connected to server: ${server.name} (${server.id})`);
        }
    },
} satisfies Event;
