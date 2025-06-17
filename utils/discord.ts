import { Glob } from "bun";
import { Client, Collection, GatewayIntentBits } from "discord.js";
import { join } from "path";
import type { Command } from "./types";

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessageReactions,
    ],
});

client.commands = new Collection<string, Command>();

const commandPath = join(process.cwd(), "commands");
const commandFiles = new Glob(`*/*.{ts,js}`);

console.debug("Loading commands...");

for await (const file of commandFiles.scan(commandPath)) {
    const { default: command } = await import(join(commandPath, file));
    if (!command) {
        console.error(`The command ${file} does not export a default.`);
        continue;
    }
    if (!("data" in command && "execute" in command)) {
        console.error(`The command ${file} is missing required properties.`);
        continue;
    }
    client.commands.set(command.data.name, command);
    console.debug(`Loaded command:`, command.data.name);
}

const eventPath = join(process.cwd(), "events");
const eventFiles = new Glob(`*.{ts,js}`);

console.debug("Loading events...");

for await (const file of eventFiles.scan(eventPath)) {
    const { default: event } = await import(join(eventPath, file));
    if (!event) {
        console.error(`The event ${file} does not export a default.`);
        continue;
    }
    if (!("name" in event && "execute" in event)) {
        console.error(`The event ${file} is missing required properties.`);
        continue;
    }
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
    console.debug(`Loaded event:`, event.name);
}

const getClient = (): Client => {
    if (!client) {
        throw new Error("Client is not initialized");
    }
    return client;
};

export { getClient };
