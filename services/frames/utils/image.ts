import satori from 'satori';
import fs from 'node:fs';
import { join } from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import twemoji from 'twemoji';

const robotoFont = fs.readFileSync(join(process.cwd(), '/assets/fonts/roboto/Roboto-Regular.ttf'));
const robotoFontBold = fs.readFileSync(join(process.cwd(), '/assets/fonts/roboto/Roboto-Bold.ttf'));
const robotoFontItalic = fs.readFileSync(
  join(process.cwd(), '/assets/fonts/roboto/Roboto-Italic.ttf')
);

async function htmlToImage(html: React.ReactNode, ratio: 'landscape' | 'portrait') {
  const width = 1080;
  const height = ratio === 'landscape' ? width / 1.91 : width;
  const svg = await satori(html, {
    width,
    height,
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
    ],
    loadAdditionalAsset: async (code: string, segment: string) => {
      if (code === 'emoji') {
        const emojiUrl = `https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/${twemoji.convert.toCodePoint(
          segment
        )}.svg`;
        const emojiSvg = await (await fetch(emojiUrl)).text();
        return `data:image/svg+xml;base64,${Buffer.from(emojiSvg).toString('base64')}`;
      }

      return segment;
    }
  });

  return new Resvg(svg, {
    fitTo: {
      mode: 'original'
    }
  })
    .render()
    .asPng();

  //return await sharp(Buffer.from(svg)).png().toBuffer();
}

function assetImageSrc(path: string) {
  return `data:image/png;base64,${fs.readFileSync(join(process.cwd(), path), {
    encoding: 'base64'
  })}`;
}

export { htmlToImage, assetImageSrc };
