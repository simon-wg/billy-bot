import { getAudioPlayer } from "@/utils/audioplayer";
import { setMessage } from "@/utils/messages";
import VideoQueue from "@/utils/queue";
import type { Command } from "@/utils/types";
import { searchYouTube, validYoutubeUrl, videoFromUrl } from "@/utils/youtube";
import { joinVoiceChannel } from "@discordjs/voice";
import {
    ChatInputCommandInteraction,
    InteractionContextType,
    MessageFlags,
    SlashCommandBuilder,
} from "discord.js";

const execute = async (interaction: ChatInputCommandInteraction) => {
    const user = interaction.user;
    const guildMember = interaction.guild!.members.cache.get(user.id);
    const voiceChannel = guildMember?.voice.channel;

    if (!voiceChannel) {
        const interactionReply = interaction.reply({
            content: "You must be in a voice channel to play music.",
            flags: [MessageFlags.Ephemeral, MessageFlags.SuppressNotifications],
        });
        setMessage(user.id, await interactionReply);
        return;
    }

    joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: interaction.guildId!,
        adapterCreator: interaction.guild!.voiceAdapterCreator,
    });

    const query = interaction.options.getString("query", true);

    const video = validYoutubeUrl(query)
        ? await videoFromUrl(query)
        : await searchYouTube(query);

    if (!video) {
        const interactionReply = interaction.reply(
            "No videos found for the given query.",
        );
        setMessage(interaction.user.id, await interactionReply);
        return;
    }

    if (!interaction.guildId || !interaction.guild) {
        console.error(
            "Guild ID or guild object is missing in the interaction.",
        );
        const interactionReply = interaction.reply({
            content: "An error occurred while processing your request.",
            flags: [MessageFlags.Ephemeral, MessageFlags.SuppressNotifications],
        });
        setMessage(interaction.user.id, await interactionReply);
        return;
    }

    const queue = VideoQueue.getQueue(interaction.guildId);
    queue.add(video, 0);

    const isPlaying: boolean = getAudioPlayer(interaction.guildId).isPlaying();

    const response = !isPlaying
        ? `**${video.title}** is now playing.`
        : `**${video.title}** has been added to the queue.`;

    if (!isPlaying) {
        // Dispatch dequeue event to start playing the video
        console.debug(
            `Dispatching dequeue event for guild ${interaction.guildId}`,
        );
        interaction.client.emit("dequeue", {
            guildId: interaction.guildId,
        });
    }
    const interactionReply = interaction.reply({
        content: response,
        flags: [MessageFlags.Ephemeral, MessageFlags.SuppressNotifications],
    });

    // Removes the previous message if it exists
    setMessage(interaction.user.id, await interactionReply);
};

export default {
    data: new SlashCommandBuilder()
        .setName("play")
        .setDescription("Plays a song from YouTube")
        .addStringOption((option) =>
            option
                .setName("query")
                .setDescription("The song to play")
                .setRequired(true),
        )
        .setContexts([InteractionContextType.Guild]),
    execute,
} satisfies Command;
