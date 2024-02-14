import satori from 'satori';
import sharp from 'sharp';
import fs from 'node:fs';
import { join } from 'node:path';

const robotoFont = fs.readFileSync(join(process.cwd(), '/public/fonts/roboto/Roboto-Regular.ttf'));

export async function htmlToImage(html: React.ReactNode, ratio: 'landscape' | 'portrait') {
  const svg = await satori(html, {
    width: 1080,
    height: ratio === 'landscape' ? 566 : 1080,
    fonts: [
      {
        name: 'Roboto-Regular',
        data: robotoFont,
        style: 'normal'
      }
    ]
  });
  return await sharp(Buffer.from(svg)).png().toBuffer();
}
