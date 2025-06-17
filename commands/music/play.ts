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
    const audioPlayer = getAudioPlayer(interaction.guildId!);
    const user = interaction.user;
    const queue = VideoQueue.getQueue(interaction.guildId!);

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

    const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: interaction.guildId!,
        adapterCreator: interaction.guild!.voiceAdapterCreator,
    });

    connection.subscribe(audioPlayer);

    const query = interaction.options.getString("query", true);

    const videoInfo = validYoutubeUrl(query)
        ? await videoFromUrl(query)
        : await searchYouTube(query);

    if (!videoInfo) {
        const interactionReply = interaction.reply({
            content: "No video found for the given query.",
            flags: [MessageFlags.Ephemeral, MessageFlags.SuppressNotifications],
        });
        setMessage(user.id, await interactionReply);
        return;
    }
    queue.add(videoInfo, 0);

    const isPlaying: boolean = audioPlayer.isPlaying();
    const response = !isPlaying
        ? `**${videoInfo.basic_info.title}** is now playing.`
        : `**${videoInfo.basic_info.title}** has been added to the queue.`;

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
