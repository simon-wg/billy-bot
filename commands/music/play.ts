import { getMusicManager } from "@/utils/audioplayer";
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
    const musicPlayer = getMusicManager().getMusicPlayer(interaction.guildId!);
    const user = interaction.user;
    const queue = VideoQueue.getQueue(interaction.guildId!);

    const guildMember = interaction.guild!.members.cache.get(user.id);

    const voiceChannel = guildMember?.voice.channel;

    if (!voiceChannel) {
        interaction.reply({
            content: "You must be in a voice channel to play music.",
            flags: [MessageFlags.Ephemeral, MessageFlags.SuppressNotifications],
        });
        return;
    }

    interaction.deferReply();

    const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: interaction.guildId!,
        adapterCreator: interaction.guild!.voiceAdapterCreator,
    });

    connection.subscribe(musicPlayer);
    const query = interaction.options.getString("query", true);

    const videoInfo = validYoutubeUrl(query)
        ? await videoFromUrl(query)
        : await searchYouTube(query);

    if (!videoInfo) {
        interaction.editReply({
            content: "No video found for the given query.",
        });
        return;
    }

    queue.add(videoInfo, 0);

    const isPlaying: boolean = musicPlayer.isPlaying();
    const response = !isPlaying
        ? `Playing **${videoInfo.basic_info.title}**`
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
    interaction.editReply({
        content: response,
    });
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
