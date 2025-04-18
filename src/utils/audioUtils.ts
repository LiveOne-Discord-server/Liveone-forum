
export const convertToWav = async (audioBlob: Blob): Promise<Blob> => {
  // Convert to wav using Web Audio API
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const arrayBuffer = await audioBlob.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  
  const numberOfChannels = audioBuffer.numberOfChannels;
  const length = audioBuffer.length;
  const sampleRate = audioBuffer.sampleRate;
  
  // Create a new AudioBuffer with the same data
  const wavBuffer = audioContext.createBuffer(numberOfChannels, length, sampleRate);
  
  // Copy the audio data to the new buffer
  for (let channel = 0; channel < numberOfChannels; channel++) {
    const nowBuffering = wavBuffer.getChannelData(channel);
    const channelData = audioBuffer.getChannelData(channel);
    for (let i = 0; i < length; i++) {
      nowBuffering[i] = channelData[i];
    }
  }
  
  // Convert the buffer to WAV format
  return new Promise((resolve) => {
    const offlineContext = new OfflineAudioContext(
      numberOfChannels,
      length,
      sampleRate
    );
    
    const source = offlineContext.createBufferSource();
    source.buffer = wavBuffer;
    source.connect(offlineContext.destination);
    source.start(0);
    
    offlineContext.startRendering().then(renderedBuffer => {
      const wav = bufferToWave(renderedBuffer, renderedBuffer.length);
      resolve(wav);
    });
  });
};

// Helper function to convert AudioBuffer to WAV Blob
function bufferToWave(abuffer: AudioBuffer, len: number): Blob {
  const numOfChan = abuffer.numberOfChannels;
  const length = len * numOfChan * 2 + 44;
  const buffer = new ArrayBuffer(length);
  const view = new DataView(buffer);

  // Write WAV header
  writeUTFBytes(view, 0, 'RIFF');
  view.setUint32(4, length - 8, true);
  writeUTFBytes(view, 8, 'WAVE');
  writeUTFBytes(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numOfChan, true);
  view.setUint32(24, abuffer.sampleRate, true);
  view.setUint32(28, abuffer.sampleRate * 2 * numOfChan, true);
  view.setUint16(32, numOfChan * 2, true);
  view.setUint16(34, 16, true); // 16-bit
  writeUTFBytes(view, 36, 'data');
  view.setUint32(40, len * numOfChan * 2, true);

  // Write audio data
  for (let i = 0; i < abuffer.numberOfChannels; i++) {
    const channel = abuffer.getChannelData(i);
    const output = new Int16Array(channel.length);
    
    for (let j = 0; j < channel.length; j++) {
      const s = Math.max(-1, Math.min(1, channel[j]));
      output[j] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    
    const offset = 44 + i * 2;
    const channelData = new Uint8Array(output.buffer);
    for (let j = 0; j < channelData.length; j++) {
      view.setUint8(offset + j, channelData[j]);
    }
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

function writeUTFBytes(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
