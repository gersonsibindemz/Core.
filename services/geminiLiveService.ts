import { GoogleGenAI, Modality, LiveServerMessage, Blob } from '@google/genai';
import { VoiceSessionCallbacks } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Audio Encoding/Decoding Helpers (as per guidelines) ---
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

function createBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}


export async function createVoiceSession(
  sourceLang: string,
  targetLang: string,
  callbacks: VoiceSessionCallbacks
) {
  callbacks.onStateChange('connecting');

  // --- Audio Contexts & State ---
  // Fix: Cast window to `any` to support `webkitAudioContext` for older browsers.
  const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
  // Fix: Cast window to `any` to support `webkitAudioContext` for older browsers.
  const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  const outputNode = outputAudioContext.createGain();
  outputNode.connect(outputAudioContext.destination);
  const sources = new Set<AudioBufferSourceNode>();
  let nextStartTime = 0;
  
  let currentInputTranscription = '';
  let currentOutputTranscription = '';

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

  const systemInstruction = `You are a real-time, low-latency translator. The user will speak in ${sourceLang}, and you must immediately respond by translating their speech into ${targetLang}. Do not add any conversational filler, confirmation, or introductory text. Just provide the direct, spoken translation of what the user said.`;

  const sessionPromise = ai.live.connect({
    model: 'gemini-2.5-flash-native-audio-preview-09-2025',
    callbacks: {
      onopen: () => {
        callbacks.onStateChange('listening');
        const source = inputAudioContext.createMediaStreamSource(stream);
        const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
        
        scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
          const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
          const pcmBlob = createBlob(inputData);
          sessionPromise.then((session) => {
            session.sendRealtimeInput({ media: pcmBlob });
          });
        };
        source.connect(scriptProcessor);
        scriptProcessor.connect(inputAudioContext.destination);
      },
      onmessage: async (message: LiveServerMessage) => {
        // Handle audio output
        const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData.data;
        if (base64Audio) {
          callbacks.onStateChange('speaking');
          nextStartTime = Math.max(nextStartTime, outputAudioContext.currentTime);
          const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContext, 24000, 1);
          const source = outputAudioContext.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(outputNode);
          source.addEventListener('ended', () => {
            sources.delete(source);
            if (sources.size === 0) {
               callbacks.onStateChange('listening');
            }
          });
          source.start(nextStartTime);
          nextStartTime += audioBuffer.duration;
          sources.add(source);
        }

        // Handle transcriptions
        if (message.serverContent?.outputTranscription) {
          currentOutputTranscription += message.serverContent.outputTranscription.text;
        } else if (message.serverContent?.inputTranscription) {
          currentInputTranscription += message.serverContent.inputTranscription.text;
        }

        callbacks.onTranscriptionUpdate({
          userInput: currentInputTranscription,
          modelOutput: currentOutputTranscription,
          isFinal: !!message.serverContent?.turnComplete,
        });

        if (message.serverContent?.turnComplete) {
          currentInputTranscription = '';
          currentOutputTranscription = '';
        }

        if (message.serverContent?.interrupted) {
            for (const source of sources.values()) {
              source.stop();
            }
            sources.clear();
            nextStartTime = 0;
            callbacks.onStateChange('listening');
        }
      },
      onerror: (e: ErrorEvent) => {
        console.error('Live session error:', e);
        callbacks.onError(new Error(e.message));
        callbacks.onStateChange('error');
      },
      onclose: () => {
        callbacks.onStateChange('closed');
      },
    },
    config: {
      responseModalities: [Modality.AUDIO],
      inputAudioTranscription: {},
      outputAudioTranscription: {},
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
      },
      systemInstruction: systemInstruction,
    },
  });

  return {
    stop: async () => {
      stream.getTracks().forEach(track => track.stop());
      await inputAudioContext.close();
      await outputAudioContext.close();
      
      const session = await sessionPromise;
      session.close();
      callbacks.onStateChange('closed');
    },
  };
}