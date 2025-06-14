import { Events, MessageFlags, type Interaction } from "discord.js";

export default {
    name: Events.InteractionCreate,
    async execute(interaction: Interaction) {
        if (!interaction.isChatInputCommand()) return;
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
                await interaction.followUp({
                    content: "There was an error while executing this command!",
                    flags: MessageFlags.Ephemeral,
                });
            } else {
                await interaction.reply({
                    content: "There was an error while executing this command!",
                    flags: MessageFlags.Ephemeral,
                });
            }
        }
    },
};
