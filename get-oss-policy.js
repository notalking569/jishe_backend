import Router from 'koa-router';
import OSS from 'ali-oss';
import dotenv from 'dotenv';

dotenv.config();

const router = new Router();

router.get('/get-oss-policy', async (ctx) => {
const client = new OSS({
  region: 'oss-cn-beijing',
  accessKeyId: process.env.OSS_KEY_ID,
  accessKeySecret: process.env.OSS_KEY_SECRET,
  bucket: 'shirley-big-event',
  secure: true
});




const filename = `tongue-images/${Date.now()}-${Math.random().toString(36).slice(2)}.png`;

const signedUrl = client.signatureUrl(filename, {
  method: 'PUT',
  expires: 300,
  headers: {
    'Content-Type': 'image/png'
  },
  protocol: 'https'
});

// 打印签名前的字符串
const canonicalString = `PUT\n\nimage/png\n${Math.floor(Date.now() / 1000) + 300}\n/${process.env.OSS_BUCKET}/${filename}`;
console.log('👉 本地 StringToSign:', canonicalString);

  ctx.status = 200;
  ctx.set('Content-Type', 'application/json');
  ctx.body = JSON.stringify({
    uploadUrl: signedUrl,
    key: filename
  });
});

export default router;
