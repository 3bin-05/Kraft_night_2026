const fs = require('fs');
const path = require('path');

function generateSirenWav() {
  const sampleRate = 44100;
  const duration = 2.5; // seconds
  const numSamples = Math.floor(sampleRate * duration);
  const numChannels = 1;
  const bytesPerSample = 2; // 16-bit
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = numSamples * blockAlign;
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF Header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  // FMT Subchunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
  buffer.writeUInt16LE(1, 20); // AudioFormat (1 for PCM)
  buffer.writeUInt16LE(numChannels, 22); // NumChannels
  buffer.writeUInt32LE(sampleRate, 24); // SampleRate
  buffer.writeUInt32LE(byteRate, 28); // ByteRate
  buffer.writeUInt16LE(blockAlign, 32); // BlockAlign
  buffer.writeUInt16LE(16, 34); // BitsPerSample (16 bits)

  // DATA Subchunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  // Generate dual-tone wailing siren
  let phase = 0;
  const minFreq = 650;
  const maxFreq = 950;
  const sweepPeriod = 1.25; // sweep every 1.25s (2 full cycles in 2.5s)

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    // Triangular/sine wave frequency sweep
    const sweepPhase = (t % sweepPeriod) / sweepPeriod;
    // smooth sweep
    const currentFreq = minFreq + (maxFreq - minFreq) * (0.5 - 0.5 * Math.cos(2 * Math.PI * sweepPhase));
    
    phase += (2 * Math.PI * currentFreq) / sampleRate;
    
    // Slight harmonics for realistic emergency horn buzz
    const sampleVal = 0.8 * Math.sin(phase) + 0.2 * Math.sin(2 * phase);
    
    // Scale to 16-bit integer
    const intVal = Math.max(-32768, Math.min(32767, Math.floor(sampleVal * 24000)));
    buffer.writeInt16LE(intVal, 44 + i * 2);
  }

  const outPath = path.join(__dirname, '..', 'public', 'siren.mp3');
  fs.writeFileSync(outPath, buffer);
  console.log('Successfully generated siren audio file at:', outPath);
}

generateSirenWav();
