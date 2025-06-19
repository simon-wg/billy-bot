import { getMusicManager } from "@/utils/audioplayer";
import VideoQueue from "@/utils/queue";
import {
    createAudioResource,
    getVoiceConnection,
    StreamType,
} from "@discordjs/voice";

interface DequeueEvent {
    guildId: string;
}

const execute = async ({ guildId }: DequeueEvent) => {
    const queueEntry = VideoQueue.getQueue(guildId).dequeue();
    const videoInfo = queueEntry?.video.basic_info;
    const musicPlayer = getMusicManager().getMusicPlayer(guildId);

    if (!videoInfo) {
        console.debug(`No video to dequeue in guild ${guildId}`);
        const connection = getVoiceConnection(guildId);
        if (connection) {
            connection.destroy();
        }
        return;
    }
    if (!videoInfo.id) {
        console.error(`Video ID is missing for video: ${videoInfo.title}`);
        const connection = getVoiceConnection(guildId);
        if (connection) {
            connection.destroy();
        }
        return;
    }
    if (!videoInfo.title) {
        console.error(`Video title is missing for video ID: ${videoInfo.id}`);
        const connection = getVoiceConnection(guildId);
        if (connection) {
            connection.destroy();
        }
        return;
    }

    const audioStream = getMusicManager()
        .getYoutubeStream(videoInfo.id)
        .then(
            (result) => {
                return result;
            },
            (error) => {
                console.error(
                    `Failed to get audio stream for video ${videoInfo.id}:`,
                    error,
                );
                return null;
            },
        );

    const resolvedAudioStream = await audioStream;

    if (!resolvedAudioStream) {
        return execute({ guildId });
    }

    musicPlayer.video = videoInfo.title.toString();

    console.debug(`Dequeued video: ${videoInfo.title} from guild ${guildId}`);

    const audioResource = createAudioResource(resolvedAudioStream, {
        inputType: StreamType.Arbitrary,
        inlineVolume: true,
        metadata: {
            title: videoInfo.title,
        },
    });

    musicPlayer.play(audioResource);
};

export default {
    name: "dequeue",
    execute,
};
