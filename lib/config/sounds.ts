export const SOUNDS = {
    POPUP: "/ding.mp3",
} as const;

export type SoundType = keyof typeof SOUNDS;
