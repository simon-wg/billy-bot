import type { Event } from "@/utils/types";
import { Client, Events } from "discord.js";

export default {
    name: Events.ClientReady,
    once: true,
    execute(client: Client) {
        console.debug(`Ready! Logged in as ${client.user?.tag}`);
    },
} satisfies Event;
