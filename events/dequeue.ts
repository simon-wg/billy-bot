import { getAudioPlayer, getYoutubeStream } from "@/utils/audioplayer";
import VideoQueue from "@/utils/queue";
import {
    AudioPlayerStatus,
    createAudioResource,
    entersState,
    getVoiceConnection,
    StreamType,
    VoiceConnectionStatus,
} from "@discordjs/voice";
import { type Client } from "discord.js";

interface DequeueEvent {
    client: Client;
    guildId: string;
}

const execute = async ({ client, guildId }: DequeueEvent) => {
    const queueEntry = VideoQueue.getQueue(guildId).dequeue();
    const video = queueEntry?.video;
    const audioPlayer = getAudioPlayer();

    if (!video) {
        console.debug(`No video to dequeue in guild ${guildId}`);
        const connection = getVoiceConnection(guildId);
        if (connection) {
            connection.destroy();
        }
        return;
    }

    console.debug(`Dequeued video: ${video.title} from guild ${guildId}`);

    const connection = getVoiceConnection(guildId);
    if (!connection) {
        console.error(`No voice connection found for guild ${guildId}`);
        return;
    }

    try {
        // Wait for connection to be ready with proper timeout
        if (connection.state.status !== VoiceConnectionStatus.Ready) {
            console.debug(
                `Voice connection not ready in guild ${guildId}, waiting for ready state.`,
            );
            await entersState(connection, VoiceConnectionStatus.Ready, 15_000);
        }
    } catch (error) {
        console.error(
            `Voice connection failed to become ready in guild ${guildId}:`,
            error,
        );

        connection.destroy();
        return;
    }

    const setupPlayerHandlers = () => {
        audioPlayer.on(AudioPlayerStatus.Playing, () => {
            console.debug(`Now playing: ${video.title} in guild ${guildId}`);
        });

        audioPlayer.on(AudioPlayerStatus.Idle, () => {
            console.debug(
                `Finished playing: ${video.title} in guild ${guildId}`,
            );

            setTimeout(() => {
                client.emit("dequeue", { client, guildId });
            }, 100); // Small delay to ensure cleanup
        });

        audioPlayer.on(AudioPlayerStatus.AutoPaused, () => {
            console.debug(`Auto-paused: ${video.title} in guild ${guildId}`);
        });

        audioPlayer.on("error", (error) => {
            console.error(`Audio player error in guild ${guildId}:`, error);
            getAudioPlayer().stop();
            setTimeout(() => {
                client.emit("dequeue", { client, guildId });
            }, 100);
        });
    };

    try {
        const audioStream = await getYoutubeStream(video.video_id);

        const audioResource = createAudioResource(audioStream, {
            inputType: StreamType.Arbitrary,
            inlineVolume: false,
            metadata: {
                title: video.title,
            },
        });

        // Handle resource errors
        audioResource.playStream.on("error", (error) => {
            console.error(
                `Error in audio resource for video ${video.title}:`,
                error,
            );
            audioPlayer.stop();
        });

        audioResource.playStream.on("close", () => {
            console.debug(
                `Audio stream closed for video ${video.title} in guild ${guildId}`,
            );
        });

        audioResource.playStream.on("end", () => {
            console.debug(
                `Audio stream ended for video ${video.title} in guild ${guildId}`,
            );
        });

        // Subscribe to the connection
        const subscription = connection.subscribe(audioPlayer);

        if (!subscription) {
            console.error(
                `Failed to subscribe to audio player in guild ${guildId}`,
            );
            return;
        }

        // Set up handlers and start playing
        setupPlayerHandlers();
        audioPlayer.play(audioResource);
    } catch (error) {
        console.error(
            `Error while processing video ${video.title} in guild ${guildId}:`,
            error,
        );
        // Ensure we continue to the next song even on error
        setTimeout(() => {
            client.emit("dequeue", { client, guildId });
        }, 1000);
    }
};

export default {
    name: "dequeue",
    execute,
};
