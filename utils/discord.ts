import { Client, Collection, GatewayIntentBits } from "discord.js";
import { readdirSync } from "fs";
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
const commandFolders = readdirSync(commandPath);

const eventPath = join(process.cwd(), "events");
const eventFiles = readdirSync(eventPath).filter((file) =>
    file.endsWith(".ts"),
);

for (const folder of commandFolders) {
    const commandsFiles = readdirSync(join(commandPath, folder)).filter(
        (file) => file.endsWith(".ts"),
    );
    for (const file of commandsFiles) {
        const filepath = join(commandPath, folder, file);
        const { default: command } = await import(filepath);
        if (!command) {
            console.error(`The command ${file} does not export a default.`);
            continue;
        }
        if (!("data" in command && "execute" in command)) {
            console.error(
                `The command ${file} is missing required properties.`,
            );
            continue;
        }
        client.commands.set(command.data.name, command);
        console.debug(`Loaded command:`, command.data.name);
    }
}

for (const file of eventFiles) {
    const filepath = join(eventPath, file);
    const { default: event } = await import(filepath);
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
    return client;
};

export { getClient };
