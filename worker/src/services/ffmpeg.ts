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

// const { stdout } = await execa(process.env.FFPROBE_PATH || 'ffprobe', [
//   '-print_format',
//   'json',
//   '-show_error',
//   '-show_format',
//   '-show_streams',
//   ...opts,
//   input
// ]);

// const probe = JSON.parse(stdout);

// if (probe.streams && probe.streams.length) {
//   const stream = probe.streams.find((stream) => stream.codec_type === 'video') || probe.streams[0];

//   probe.duration = Math.round(stream.duration * 1000);
//   probe.width = stream.width;
//   probe.height = stream.height;

//   const fpsFraction = stream.avg_frame_rate.split('/');
//   probe.fps = fpsFraction[0] / fpsFraction[1];
// } else {
//   probe.duration = undefined;
//   probe.width = undefined;
//   probe.height = undefined;
// }
