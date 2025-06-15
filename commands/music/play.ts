import { audioPlayer } from "@/utils/audioplayer";
import VideoQueue from "@/utils/queue";
import type { Command } from "@/utils/types";
import { AudioPlayerStatus, joinVoiceChannel } from "@discordjs/voice";
import {
    ChatInputCommandInteraction,
    MessageFlags,
    SlashCommandBuilder,
} from "discord.js";
import { Innertube, YT, YTNodes } from "youtubei.js";

const execute = async (interaction: ChatInputCommandInteraction) => {
    if (!interaction.guild || !interaction.guildId) {
        await interaction.reply({
            content: "This command can only be used in a server.",
            flags: [MessageFlags.Ephemeral],
        });
        return;
    }

    const query = interaction.options.getString("query", true);
    const innertube = await Innertube.create();
    const searchResult: Promise<YT.Search> = innertube.search(query, {
        type: "video",
    });
    const videos = await searchResult.then((result) => result.videos);
    const firstVideo: YTNodes.Video | undefined = videos.firstOfType(
        YTNodes.Video,
    );
    if (!firstVideo) {
        await interaction.reply("No videos found for the given query.");
        return;
    }

    const queue = VideoQueue.getQueue(interaction.guildId);
    queue.add(firstVideo, 0);

    const currentlyPlaying =
        audioPlayer.state.status === AudioPlayerStatus.Playing;

    const response = currentlyPlaying
        ? `**${firstVideo.title}** is now playing.`
        : `**${firstVideo.title}** has been added to the queue.`;

    const user = interaction.user;

    const guildMember = await interaction.guild.members.fetch(user.id);
    const voiceChannel = guildMember?.voice.channel;

    if (!voiceChannel) {
        await interaction.reply({
            content: "You must be in a voice channel to play music.",
            flags: [MessageFlags.Ephemeral],
        });
        return;
    }

    await joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: interaction.guildId,
        adapterCreator: interaction.guild.voiceAdapterCreator,
    });

    if (queue.length() === 1) {
        // Dispatch dequeue event to start playing the video
        await interaction.client.emit("dequeue", {
            client: interaction.client,
            guildId: interaction.guildId,
        });

        await interaction.reply({
            content: response,
            flags: [MessageFlags.Ephemeral],
        });
    }
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
        ),
    execute,
} satisfies Command;
