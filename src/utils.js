export function time2FrameIndex(time, frameRate, startOffset = 0) {
    const floatIndex = (time - startOffset) * frameRate;
    const integers = Math.floor(floatIndex);
    return integers + (floatIndex - integers > 0.99);
}
