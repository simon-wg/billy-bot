import { Glob } from "bun";
import { REST, Routes } from "discord.js";
import { join } from "path";
import { clientId, guildId, token } from "./config";

const commands = [];
const commandPath = join(process.cwd(), "commands");
const commandFiles = new Glob(`*/*.{ts,js}`);
for await (const file of commandFiles.scan(commandPath)) {
    const { default: command } = await import(join(commandPath, file));
    if (!command) {
        console.error(`The command ${file} does not export a default command.`);
        continue;
    }
    if (!("data" in command && "execute" in command)) {
        console.error(`The command ${file} is missing required properties.`);
        continue;
    }
    commands.push(command.data.toJSON());
}

const rest = new REST().setToken(token);

(async () => {
    try {
        console.debug(`Started refreshing ${commands.length} commands.`);

        for (const command of commands) {
            console.debug(`Command: ${command.name}`);
        }

        await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
            body: commands,
        });
    } catch (error) {
        console.error("Error deploying commands:", error);
    }
})();
