import { cookie } from "@/config";
import {
    AudioPlayer,
    AudioPlayerStatus,
    createAudioPlayer,
    NoSubscriberBehavior,
} from "@discordjs/voice";
import { Readable } from "node:stream";
import { ClientType, Innertube, UniversalCache } from "youtubei.js";

let innertubeInstance: Innertube | null = null;

const audioPlayers: Map<string, AudioPlayer> = new Map();

const getYoutubeStream = async (videoId: string): Promise<Readable> => {
    const fetchFunction = Bun.fetch;

    if (!innertubeInstance) {
        innertubeInstance = await Innertube.create({
            client_type: ClientType.TV,
            cache: new UniversalCache(true, "./.cache"),
            cookie: cookie,
            fetch: fetchFunction,
        });
    }

    const video = await innertubeInstance.download(videoId);

    const videoStream = Readable.fromWeb(video, {
        highWaterMark: 1024 * 512, // 1MB buffer size
    });

    return videoStream;
};

const getAudioPlayer = (guildId: string): AudioPlayer => {
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
    }
    return audioPlayers.get(guildId)!;
};

export { getAudioPlayer, getYoutubeStream };
