import { cookie } from "@/config";
import { getClient } from "@/utils/discord";
import {
    AudioPlayer,
    AudioPlayerError,
    AudioPlayerStatus,
    createAudioPlayer,
    NoSubscriberBehavior,
} from "@discordjs/voice";
import { Client } from "discord.js";
import { Readable } from "node:stream";
import { ClientType, Innertube, UniversalCache } from "youtubei.js";

const innertube: Innertube = await Innertube.create({
    client_type: ClientType.TV,
    cache: new UniversalCache(true, "./.cache"),
    cookie: cookie,
    fetch: Bun.fetch,
});
const audioPlayers: Map<string, AudioPlayer> = new Map();
let client: Client;

const setupAudioPlayers = () => {
    client = getClient();
};

const getYoutubeStream = async (videoId: string): Promise<Readable> => {
    if (!innertube) {
        throw new Error("Innertube is not initialized");
    }
    const video = await innertube.download(videoId);

    const videoStream = Readable.fromWeb(video, {
        highWaterMark: 1024 * 1024, // 1MB buffer size
    });

    return videoStream;
};

const getAudioPlayer = (guildId: string): AudioPlayer => {
    if (!client) {
        throw new Error("Client is not initialized");
    }
    if (!audioPlayers.get(guildId)) {
        const audioPlayer = createAudioPlayer({
            behaviors: {
                noSubscriber: NoSubscriberBehavior.Pause,
            },
        });
        audioPlayers.set(guildId, audioPlayer);
        if (!audioPlayer) {
            throw new Error("Failed to create audio player");
        }
        audioPlayer.isPlaying = () => {
            return audioPlayer?.state.status === AudioPlayerStatus.Playing;
        };
        audioPlayer.isIdle = () => {
            return audioPlayer?.state.status === AudioPlayerStatus.Idle;
        };
        audioPlayer.isPaused = () => {
            return audioPlayer?.state.status === AudioPlayerStatus.Paused;
        };
        audioPlayer.currentVideo = () => {
            if (audioPlayer?.video) {
                return audioPlayer.video;
            }
            return null;
        };
        audioPlayer.on(AudioPlayerStatus.Playing, () => {
            console.debug(
                `Audio player is now playing: ${audioPlayer?.currentVideo()}`,
            );
        });
        audioPlayer.on(AudioPlayerStatus.Idle, () => {
            console.debug(
                `Audio player is now idle in guild ${guildId}. Dispatching dequeue event.`,
            );
            client.emit("dequeue", { guildId });
        });
        audioPlayer.on("error", (error) => {
            if (error instanceof AudioPlayerError) {
                console.error(
                    `Audio player error in guild ${guildId}: ${error.message}`,
                );
            } else {
                console.error(
                    `Unexpected error in audio player for guild ${guildId}:`,
                    error,
                );
            }
            client.emit("dequeue", { guildId });
        });
    }
    return audioPlayers.get(guildId)!;
};

export { getAudioPlayer, getYoutubeStream, setupAudioPlayers };
