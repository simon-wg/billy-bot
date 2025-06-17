import { getAudioPlayer, getYoutubeStream } from "@/utils/audioplayer";
import { getClient } from "@/utils/discord";
import VideoQueue from "@/utils/queue";
import {
    createAudioResource,
    entersState,
    getVoiceConnection,
    StreamType,
    VoiceConnectionStatus,
} from "@discordjs/voice";

interface DequeueEvent {
    guildId: string;
}

const execute = async ({ guildId }: DequeueEvent) => {
    const client = getClient();
    const queueEntry = VideoQueue.getQueue(guildId).dequeue();
    const video = queueEntry?.video;
    const audioPlayer = getAudioPlayer(guildId);

    if (!video) {
        console.debug(`No video to dequeue in guild ${guildId}`);
        const connection = getVoiceConnection(guildId);
        if (connection) {
            connection.destroy();
        }
        return;
    }

    const audioStream = getYoutubeStream(video.video_id);

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
        audioPlayer.once("error", (error) => {
            console.error(`Audio player error in guild ${guildId}:`, error);
            getAudioPlayer(guildId).stop();
            setTimeout(() => {
                client.emit("dequeue", { guildId });
            }, 100);
        });
    };

    try {
        const audioResource = createAudioResource(await audioStream, {
            inputType: StreamType.Arbitrary,
            inlineVolume: true,
            metadata: {
                title: video.title,
            },
        });

        audioPlayer.video = video.title.toString();

        // Handle resource errors
        audioResource.playStream.once("error", (error) => {
            console.error(
                `Error in audio resource for video ${video.title}:`,
                error,
            );
            audioPlayer.stop();
        });

        audioResource.playStream.once("end", () => {
            console.debug(
                `Audio stream ended for video ${video.title} in guild ${guildId}`,
            );
            setTimeout(() => {
                client.emit("dequeue", { guildId });
            }, 100); // Small delay to ensure cleanup
            return;
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
            client.emit("dequeue", { guildId });
        }, 1000);
        return;
    }
};

export default {
    name: "dequeue",
    execute,
};
