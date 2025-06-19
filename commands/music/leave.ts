import { getMusicManager } from "@/utils/audioplayer";
import VideoQueue from "@/utils/queue";
import type { Command } from "@/utils/types";
import { getVoiceConnection } from "@discordjs/voice";
import {
    ChatInputCommandInteraction,
    InteractionContextType,
    SlashCommandBuilder,
} from "discord.js";

const execute = async (interaction: ChatInputCommandInteraction) => {
    const queue = VideoQueue.getQueue(interaction.guildId!);
    queue.clear();

    const musicPlayer = getMusicManager().getMusicPlayer(interaction.guildId!);
    musicPlayer.stop();

    const connection = getVoiceConnection(interaction.guildId!);

    if (connection) {
        connection.destroy();
    }

    await interaction.reply({
        content: "The music queue has been cleared.",
    });
};

export default {
    data: new SlashCommandBuilder()
        .setName("leave")
        .setDescription("Clears the music queue and leaves the voice channel.")
        .setContexts([InteractionContextType.Guild]),
    execute,
} satisfies Command;
