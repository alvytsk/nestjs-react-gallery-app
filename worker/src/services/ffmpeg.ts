import ffmpeg, { FfprobeData } from 'fluent-ffmpeg';

export default class FfmpegService {
  constructor() {}

  probeFile(stream: any) {
    return new Promise((resolve, reject) => {
      return ffmpeg.ffprobe(stream, (err: any, data: FfprobeData) => {
        if (err) {
          return reject(err);
        }
        // console.log(data.streams);

        const { duration, size } = data.format;

        return resolve({
          size,
          durationInSeconds: Math.floor(Number(duration))
        });
      });
    });
  }
}
