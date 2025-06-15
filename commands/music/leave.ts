import VideoQueue from "@/utils/queue";
import type { Command } from "@/utils/types";
import { getVoiceConnection } from "@discordjs/voice";
import {
    ChatInputCommandInteraction,
    MessageFlags,
    SlashCommandBuilder,
} from "discord.js";

const execute = async (interaction: ChatInputCommandInteraction) => {
    if (!interaction.guild || !interaction.guildId) {
        await interaction.reply({
            content: "This command can only be used in a server.",
            flags: [MessageFlags.Ephemeral],
        });
        return;
    }

    const queue = VideoQueue.getQueue(interaction.guildId);
    queue.clear();

    const connection = getVoiceConnection(interaction.guildId);

    if (connection) {
        connection.destroy();
    }

    await interaction.reply({
        content: "The music queue has been cleared.",
        flags: [MessageFlags.Ephemeral],
    });
};

export default {
    data: new SlashCommandBuilder()
        .setName("leave")
        .setDescription("Clears the music queue and leaves the voice channel."),
    execute,
} satisfies Command;
