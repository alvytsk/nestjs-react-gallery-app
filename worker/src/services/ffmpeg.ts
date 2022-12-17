import ffmpeg, { FfprobeData } from 'fluent-ffmpeg';

export default class FfmpegService {
  constructor() {}

  probeFile(stream: any) {
    ffmpeg.ffprobe(stream, (err: any, data: FfprobeData) => {
      console.log(data.streams);
    });
  }
}
