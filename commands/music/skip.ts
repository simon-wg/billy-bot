import { getMusicManager } from "@/utils/audioplayer";
import type { Command } from "@/utils/types";
import {
    InteractionContextType,
    MessageFlags,
    SlashCommandBuilder,
    type ChatInputCommandInteraction,
} from "discord.js";

const execute = async (interaction: ChatInputCommandInteraction) => {
    const guildId = interaction.guildId;
    if (!guildId) {
        interaction.reply({
            content: "This command can only be used in a server.",
            flags: [MessageFlags.Ephemeral, MessageFlags.SuppressNotifications],
        });
        return;
    }

    const musicPlayer = getMusicManager().getMusicPlayer(guildId);
    if (!musicPlayer.isPlaying()) {
        interaction.reply({
            content: "No music is currently playing.",
            flags: [MessageFlags.Ephemeral, MessageFlags.SuppressNotifications],
        });
        return;
    }

    interaction.reply({
        content: "Skipped the current song.",
    });

    interaction.client.emit("dequeue", {
        guildId: guildId,
    });
};

export default {
    data: new SlashCommandBuilder()
        .setName("skip")
        .setDescription("Skips the currently playing song.")
        .setContexts(InteractionContextType.Guild),
    execute,
} satisfies Command;
