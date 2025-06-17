import { getAudioPlayer } from "@/utils/audioplayer";
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

    const audioPlayer = getAudioPlayer(guildId);
    if (!audioPlayer.isPlaying()) {
        const interactionReply = interaction.reply({
            content: "No music is currently playing.",
            flags: [MessageFlags.Ephemeral, MessageFlags.SuppressNotifications],
        });
        setMessage(interaction.user.id, await interactionReply);
        return;
    }

    audioPlayer.stop();
    const interactionReply = interaction.reply({
        content: "Skipped the current song.",
        flags: [MessageFlags.Ephemeral, MessageFlags.SuppressNotifications],
    });

    setMessage(interaction.user.id, await interactionReply);

    interaction.client.emit("dequeue", { guildId });
};

export default {
    data: new SlashCommandBuilder()
        .setName("skip")
        .setDescription("Skips the currently playing song.")
        .setContexts(InteractionContextType.Guild),
    execute,
} satisfies Command;
