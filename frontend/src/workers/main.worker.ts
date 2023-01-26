import { faststart } from '@fyreware/moov-faststart';
import { Buffer } from 'buffer';

export type WorkerInDTO = {
  file: File;
  url: string;
};

export type WorkerOutDTO = {
  fixed: boolean;
  url: string;
  buffer: Buffer | null;
  type?: string;
  name?: string;
};

const isFaststartEnabled = (chunk: Buffer): boolean => {
  if (chunk && chunk.length) {
    for (const [i, b] of chunk.entries()) {
      if (b === 109) {
        if (chunk[i + 1] === 111 && chunk[i + 2] === 111 && chunk[i + 3] === 118) return true;
      }
    }
  }

  return false;
};

self.onmessage = async (
  e: MessageEvent<WorkerInDTO>
): Promise<MessageEvent<WorkerOutDTO> | void> => {
  const {
    data: { file, url }
  } = e;

  //   console.log(file.size);
  const fb = Buffer.from(await file.arrayBuffer());

  console.group('File %s', file.name);
  console.log('Faststart enabled:', isFaststartEnabled(fb.slice(0, 32)));

  if (isFaststartEnabled(fb.slice(0, 32))) {
    self.postMessage({
      fixed: false,
      url,
      buffer: null
    });
  } else {
    console.log('Fixing faststart...');
    const faststartedMp4 = faststart(fb);
    console.log('Faststart enabled:', isFaststartEnabled(faststartedMp4.slice(0, 32)));

    self.postMessage({
      fixed: true,
      url,
      type: file.type,
      name: file.name,
      buffer: faststartedMp4
    });
  }

  console.groupEnd();
};

export {};
