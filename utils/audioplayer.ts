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

let audioPlayer: AudioPlayer | null = null;

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

const getAudioPlayer = (): AudioPlayer => {
    if (!audioPlayer) {
        audioPlayer = createAudioPlayer({
            behaviors: {
                noSubscriber: NoSubscriberBehavior.Pause,
            },
        });
        audioPlayer.isPlaying = () => {
            return audioPlayer?.state.status === AudioPlayerStatus.Playing;
        };
    }
    return audioPlayer;
};

export { getAudioPlayer, getYoutubeStream };
