import { Innertube, YT, YTNodes } from "youtubei.js";

const innertube = await Innertube.create();

export const searchYouTube = async (
    query: string,
    results: number = 1,
): Promise<YT.VideoInfo[] | undefined | null> => {
    try {
        const searchResult = await innertube.search(query, { type: "video" });
        const videoIds = searchResult.videos
            .filter((video) => video instanceof YTNodes.Video)
            .slice(0, results)
            .map((video) => video.video_id);
        if (!videoIds) {
            console.debug("No video found for the given query.");
            return null;
        }
        const videos = await Promise.all(
            videoIds.map((videoId) => innertube.getBasicInfo(videoId)),
        );
        return videos;
    } catch (error) {
        console.error("Error searching YouTube:", error);
        return null;
    }
};

export const videoFromUrl = async (
    query: string,
): Promise<YT.VideoInfo[] | null | undefined> => {
    const url = new URL(query)!;
    const videoId = url.searchParams.get("v")!;
    try {
        const videoInfo = innertube.getBasicInfo(videoId).then((info) => {
            return [info];
        });
        return videoInfo;
    } catch (error) {
        console.error("Error fetching video from URL:", error);
        return null;
    }
};

export const validYoutubeUrl = (query: string): boolean => {
    try {
        const url = new URL(query);
        if (
            url.hostname !== "www.youtube.com" &&
            url.hostname !== "youtube.com" &&
            url.hostname !== "youtu.be"
        ) {
            return false;
        }
        if (
            !url.pathname.startsWith("/watch") &&
            !url.pathname.startsWith("/shorts") &&
            !url.pathname.startsWith("/playlist")
        ) {
            return false;
        }
        if (url.searchParams.get("v") === null) {
            return false;
        }
    } catch {
        return false;
    }
    return true;
};
