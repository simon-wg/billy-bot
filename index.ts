import { token } from "@/config";
import type { Command } from "@/utils/types.ts";
import { Glob } from "bun";
import { Client, Collection, GatewayIntentBits } from "discord.js";

const client = new Client({
    intents: [GatewayIntentBits.Guilds],
});

client.commands = new Collection<string, Command>();

const commandFiles = new Glob(`*/*.{ts,js}`);

console.debug("Loading commands...");

for await (const file of commandFiles.scan("./commands")) {
    const { default: command } = await import(`./commands/${file}`);
    if (!command) {
        console.error(
            `The command at ./commands/${file} does not export a default.`,
        );
        continue;
    }
    if (!("data" in command && "execute" in command)) {
        console.error(
            `The command at ./commands/${file} is missing required properties.`,
        );
        continue;
    }
    client.commands.set(command.data.name, command);
    console.debug(`Loaded command:`, command.data.name);
}

const eventFiles = new Glob(`*.{ts,js}`);

console.debug("Loading events...");

for await (const file of eventFiles.scan("./events")) {
    const { default: event } = await import(`./events/${file}`);
    if (!event) {
        console.error(
            `The event at ./events/${file} does not export a default.`,
        );
        continue;
    }
    if (!("name" in event && "execute" in event)) {
        console.error(
            `The event at ./events/${file} is missing required properties.`,
        );
        continue;
    }
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
    console.debug(`Loaded event:`, event.name);
}

client.login(token).catch((error) => {
    console.error("Failed to login:", error);
    process.exit(1); // Exit the process if login fails
});
