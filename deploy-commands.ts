import { Glob } from "bun";
import { REST, Routes } from "discord.js";
import { clientId, token } from "./config";

const commands = [];
const commandFiles = new Glob(`*/*.{ts,js}`);
for await (const file of commandFiles.scan("./commands")) {
    const { default: command } = await import(`./commands/${file}`);
    if (!("data" in command && "execute" in command)) {
        console.error(
            `The command at ./commands/${file} is missing required properties.`,
        );
        continue;
    }
    commands.push(command.data.toJSON());
}

const rest = new REST().setToken(token);

(async () => {
    try {
        console.debug(`Started refreshing ${commands.length} commands.`);

        await rest.put(Routes.applicationCommands(clientId), {
            body: commands,
        });
    } catch (error) {
        console.error("Error deploying commands:", error);
    }
})();
