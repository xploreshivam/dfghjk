// Base64 decoding function
export const decode = (base64: string): Uint8Array => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
};

/**
 * Converts raw PCM audio data to a WAV file Blob.
 * The Gemini Text-to-Speech API returns audio as raw PCM data (16-bit, 24kHz, single-channel).
 * @param pcmData The raw PCM audio data.
 * @param sampleRate The sample rate of the audio (e.g., 24000).
 * @param numChannels The number of audio channels (e.g., 1).
 * @returns A Blob representing the WAV file.
 */
export const pcmToWav = (pcmData: Uint8Array, sampleRate: number, numChannels: number): Blob => {
    const bitsPerSample = 16; // 16-bit PCM is standard for this TTS
    const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
    const blockAlign = numChannels * (bitsPerSample / 8);
    const dataSize = pcmData.length;
    
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    // RIFF header (4 bytes: 'RIFF')
    writeString(view, 0, 'RIFF');
    // File size (4 bytes)
    view.setUint32(4, 36 + dataSize, true);
    // Format (4 bytes: 'WAVE')
    writeString(view, 8, 'WAVE');

    // fmt chunk (4 bytes: 'fmt ')
    writeString(view, 12, 'fmt ');
    // Chunk size (4 bytes: 16 for PCM)
    view.setUint32(16, 16, true);
    // Audio format (2 bytes: 1 for PCM)
    view.setUint16(20, 1, true);
    // Number of channels (2 bytes)
    view.setUint16(22, numChannels, true);
    // Sample rate (4 bytes)
    view.setUint32(24, sampleRate, true);
    // Byte rate (4 bytes: SampleRate * NumChannels * BitsPerSample/8)
    view.setUint32(28, byteRate, true);
    // Block align (2 bytes: NumChannels * BitsPerSample/8)
    view.setUint16(32, blockAlign, true);
    // Bits per sample (2 bytes)
    view.setUint16(34, bitsPerSample, true);

    // data chunk (4 bytes: 'data')
    writeString(view, 36, 'data');
    // Sub-chunk size (4 bytes: NumSamples * NumChannels * BitsPerSample/8)
    view.setUint32(40, dataSize, true);

    // PCM data
    new Uint8Array(buffer, 44).set(pcmData);

    return new Blob([view], { type: 'audio/wav' });
};
