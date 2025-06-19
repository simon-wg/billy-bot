import { Events, MessageFlags, type Interaction } from "discord.js";

export default {
    name: Events.InteractionCreate,
    async execute(interaction: Interaction) {
        if (interaction.isChatInputCommand()) {
            console.debug(`Interaction received: ${interaction.commandName}`);

            const command = interaction.client.commands.get(
                interaction.commandName,
            );

            if (!command) {
                console.error(
                    `No command matching ${interaction.commandName} was found.`,
                );
                return;
            }

            try {
                await command.execute(interaction);
                console.debug(`Executed command: ${interaction.commandName}`);
            } catch (error) {
                console.error(
                    `Error executing command ${interaction.commandName}:`,
                    error,
                );
                if (interaction.replied || interaction.deferred) {
                    interaction.reply({
                        content:
                            "There was an error while executing this command!",
                        flags: [
                            MessageFlags.Ephemeral,
                            MessageFlags.SuppressEmbeds,
                        ],
                    });
                } else {
                    interaction.reply({
                        content:
                            "There was an error while executing this command!",
                        flags: [
                            MessageFlags.Ephemeral,
                            MessageFlags.SuppressEmbeds,
                        ],
                    });
                }
            }
        } else if (interaction.isAutocomplete()) {
            console.debug(
                `Autocomplete interaction received: ${interaction.commandName}`,
            );
            const command = interaction.client.commands.get(
                interaction.commandName,
            );
            try {
                await command.autocomplete(interaction);
            } catch (error) {
                console.error(
                    `Error executing autocomplete for command ${interaction.commandName}:`,
                    error,
                );
            }
        }
    },
};
