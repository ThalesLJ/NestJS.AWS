import { Injectable } from '@nestjs/common';
import * as ffmpeg from 'fluent-ffmpeg';
import * as os from 'os';
import * as path from 'path';

ffmpeg.setFfmpegPath(
  'home/ubuntu/release/node_modules/@ffmpeg-installer/ffmpeg',
);
ffmpeg.setFfprobePath(
  'home/ubuntu/release/node_modules/@ffprobe-installer/ffprobe',
);

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  async mixAudio(): Promise<string> {
    try {
      const outputFilePath = await this.mergeAndDownloadAudio(
        'https://checklist-recordings.s3.amazonaws.com/packages-2024-10-22/20241022145138_01JATAFXQ6WVD5XMDW35XN9WZM_2c13cab1-efc8-47e0-9943-c885036f94f4.webm',
        'https://checklist-recordings.s3.amazonaws.com/packages-2024-10-22/20241022145209_01JATAFXQ6WVD5XMDW35XN9WZM_272240fe-0d18-4fb7-8f34-0d5dcca7812e.webm',
      );

      return outputFilePath;
    } catch (error) {
      return `Error: ${error}`;
    }
  }

  private async mergeAndDownloadAudio(
    url1: string,
    url2: string,
  ): Promise<string> {
    const outputFilePath = path.join(os.tmpdir(), 'output.webm');
    return new Promise((resolve, reject) => {
      ffmpeg()
        .input(url1)
        .input(url2)
        .on('error', (err) => {
          console.error('Erro ao mesclar áudios:', err);
          reject(err);
        })
        .on('end', () => {
          console.log('Áudios mesclados com sucesso');
          resolve(outputFilePath);
        })
        .mergeToFile(outputFilePath);
    });
  }
}
