import { Injectable } from '@nestjs/common';
import { path as ffmpegPath } from '@ffmpeg-installer/ffmpeg';
import { path as ffprobePath } from '@ffprobe-installer/ffprobe';
import * as ffmpeg from 'fluent-ffmpeg';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import axios from 'axios';
import { promisify } from 'util';

const writeFileAsync = promisify(fs.writeFile);
const unlinkAsync = promisify(fs.unlink);

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

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
      // Garantir que o erro seja convertido para string
      if (error instanceof Error) {
        return `Error: ${error.message}`;
      } else {
        return `Error: ${String(error)}`;
      }
    }
  }

  private async downloadFile(url: string): Promise<string> {
    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'arraybuffer',
    });

    const tempFilePath = path.join(os.tmpdir(), `input-${Date.now()}.webm`);
    await writeFileAsync(tempFilePath, Buffer.from(response.data));
    return tempFilePath;
  }

  private async mergeAndDownloadAudio(
    url1: string,
    url2: string,
  ): Promise<string> {
    let tempFile1: string | null = null;
    let tempFile2: string | null = null;

    try {
      console.log('Baixando arquivos de áudio...');
      [tempFile1, tempFile2] = await Promise.all([
        this.downloadFile(url1),
        this.downloadFile(url2),
      ]);
      console.log('Arquivos baixados com sucesso');

      const outputFilePath = path.join(
        os.tmpdir(),
        `output-${Date.now()}.webm`,
      );

      return new Promise<string>((resolve, reject) => {
        console.log('Iniciando processo de mesclagem...');
        ffmpeg()
          .input(tempFile1)
          .input(tempFile2)
          .on('error', (err) => {
            console.error('Erro ao mesclar áudios:', err);
            reject(err);
          })
          .on('end', () => {
            console.log('Áudios mesclados com sucesso');
            resolve(outputFilePath);
          })
          .on('progress', (progress) => {
            console.log(`Processando: ${progress.percent}% concluído`);
          })
          .mergeToFile(outputFilePath);
      }).finally(async () => {
        // Limpar arquivos temporários
        if (tempFile1) {
          try {
            await unlinkAsync(tempFile1);
          } catch (error) {
            console.warn('Erro ao deletar arquivo temporário 1:', error);
          }
        }
        if (tempFile2) {
          try {
            await unlinkAsync(tempFile2);
          } catch (error) {
            console.warn('Erro ao deletar arquivo temporário 2:', error);
          }
        }
      });
    } catch (error) {
      // Garantir que os arquivos temporários sejam deletados em caso de erro
      if (tempFile1) {
        try {
          await unlinkAsync(tempFile1);
        } catch {}
      }
      if (tempFile2) {
        try {
          await unlinkAsync(tempFile2);
        } catch {}
      }
      throw error;
    }
  }
}
