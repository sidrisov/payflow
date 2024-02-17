import satori from 'satori';
import sharp from 'sharp';
import fs from 'node:fs';
import { join } from 'node:path';

const robotoFont = fs.readFileSync(join(process.cwd(), '/assets/fonts/roboto/Roboto-Regular.ttf'));
const robotoFontBold = fs.readFileSync(join(process.cwd(), '/assets/fonts/roboto/Roboto-Bold.ttf'));
const robotoFontItalic = fs.readFileSync(
  join(process.cwd(), '/assets/fonts/roboto/Roboto-Italic.ttf')
);

async function htmlToImage(html: React.ReactNode, ratio: 'landscape' | 'portrait') {
  const svg = await satori(html, {
    width: 1080,
    height: ratio === 'landscape' ? 566 : 1080,
    fonts: [
      {
        name: 'Roboto',
        data: robotoFont,
        style: 'normal',
        weight: 400
      },
      {
        name: 'Roboto',
        data: robotoFontBold,
        style: 'normal',
        weight: 700
      },
      {
        name: 'Roboto',
        data: robotoFontItalic,
        style: 'italic',
        weight: 400
      }
    ]
  });
  return await sharp(Buffer.from(svg)).png().toBuffer();
}

export { htmlToImage };
