import Innertube, { YTNodes } from "youtubei.js";

const innertube = await Innertube.create();

export const searchYouTube = async (
    query: string,
): Promise<YTNodes.Video | undefined | null> => {
    try {
        const searchResult = await innertube.search(query, { type: "video" });
        const firstVideo = searchResult.videos.firstOfType(YTNodes.Video);
        return firstVideo;
    } catch (error) {
        console.error("Error searching YouTube:", error);
        return null;
    }
};

export const videoFromUrl = async (
    query: string,
): Promise<YTNodes.Video | undefined | null> => {
    const url = new URL(query)!;
    const videoId = url.searchParams.get("v")!;
    return searchYouTube(videoId);
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
