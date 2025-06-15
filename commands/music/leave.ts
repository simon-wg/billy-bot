import { serverOnlyGuard } from "@/utils/guards";
import { setMessage } from "@/utils/messages";
import VideoQueue from "@/utils/queue";
import type { Command } from "@/utils/types";
import { getVoiceConnection } from "@discordjs/voice";
import {
    ChatInputCommandInteraction,
    MessageFlags,
    SlashCommandBuilder,
} from "discord.js";

const execute = async (interaction: ChatInputCommandInteraction) => {
    if (!(await serverOnlyGuard(interaction))) {
        return;
    }

    const queue = VideoQueue.getQueue(interaction.guildId!);
    queue.clear();

    const connection = getVoiceConnection(interaction.guildId!);

    if (connection) {
        connection.destroy();
    }

    const interactionReply = await interaction.reply({
        content: "The music queue has been cleared.",
        flags: [MessageFlags.Ephemeral],
    });

    // Removes the previous message if it exists
    setMessage(interaction.user.id, interactionReply);
};

export default {
    data: new SlashCommandBuilder()
        .setName("leave")
        .setDescription("Clears the music queue and leaves the voice channel."),
    execute,
} satisfies Command;
