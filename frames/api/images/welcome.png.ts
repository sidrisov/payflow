import { htmlToImage } from '../../server/utils/image';
import { test } from '../../server/components/test';

import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const image = await htmlToImage(test('Payflow'), 'landscape');

    // Set the response content type to PNG and send the image
    res.setHeader('Content-Type', 'image/png');
    res.status(200).send(image);
  } catch (error) {
    // Handle any errors
    console.error('Error generating image:', error);
    res.status(500).send('Error generating image');
  }
}
