import { musicManager } from "@/index";
import { setMessage } from "@/utils/messages";
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
        const interactionReply = interaction.reply({
            content: "This command can only be used in a server.",
            flags: [MessageFlags.Ephemeral, MessageFlags.SuppressNotifications],
        });
        setMessage(interaction.user.id, await interactionReply);
        return;
    }

    const audioPlayer = musicManager.getMusicPlayer(guildId);
    if (!audioPlayer.isPlaying()) {
        const interactionReply = interaction.reply({
            content: "No music is currently playing.",
            flags: [MessageFlags.Ephemeral, MessageFlags.SuppressNotifications],
        });
        setMessage(interaction.user.id, await interactionReply);
        return;
    }

    const interactionReply = interaction.reply({
        content: "Skipped the current song.",
        flags: [MessageFlags.Ephemeral, MessageFlags.SuppressNotifications],
    });

    interaction.client.emit("dequeue", {
        guildId: guildId,
    });

    setMessage(interaction.user.id, await interactionReply);
};

export default {
    data: new SlashCommandBuilder()
        .setName("skip")
        .setDescription("Skips the currently playing song.")
        .setContexts(InteractionContextType.Guild),
    execute,
} satisfies Command;
