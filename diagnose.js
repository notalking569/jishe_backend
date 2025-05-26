import Router from 'koa-router'
import OSS from 'ali-oss'
import dotenv from 'dotenv'
import axios from 'axios'
import * as jimp from 'jimp'   

dotenv.config()


const router = new Router()

router.post('/diagnose', async (ctx) => {
  const { text } = ctx.request.body
  console.log('收到诊断请求:', text)

  if (!text) {
    ctx.status = 400
    ctx.body = { error: 'Missing text' }
    return
  }
 
  if (text.includes('oss-cn-beijing.aliyuncs.com')) {
    const imageUrl = text.match(/https?:\/\/[^\s]+/g)?.[0] || ''

    try {
    
      const imageBuffer = await axios.get(imageUrl, {
        responseType: 'arraybuffer'
      }).then(res => res.data)

  
      const image = await jimp.read(imageBuffer)

      let rSum = 0, gSum = 0, bSum = 0, count = 0

      image.scan(0, 0, image.bitmap.width, image.bitmap.height, (x, y, idx) => {
        rSum += image.bitmap.data[idx + 0]
        gSum += image.bitmap.data[idx + 1]
        bSum += image.bitmap.data[idx + 2]
        count++
      })

      const r = Math.round(rSum / count)
      const g = Math.round(gSum / count)
      const b = Math.round(bSum / count)

      let colorDiagnosis = '舌象正常'
      if (r > 200 && g < 100 && b < 100) colorDiagnosis = '舌红：提示内热偏'
      else if (r < 150 && g < 150 && b > 150) colorDiagnosis = '舌紫：提示血瘀寒滞'
      else if (r > 200 && g > 200 && b > 200) colorDiagnosis = '舌白：提示寒湿偏'
      else if (r > 200 && g > 180 && b < 100) colorDiagnosis = '黄苔：提示湿热偏'

      ctx.body = {
        reply: `🧾 已分析舌象图片（${imageUrl}）主色为 RGB(${r},${g},${b})�?${colorDiagnosis}。`
      }
      return

    } catch (err) {
      console.error('图片分析失败', err)
      ctx.body = {
        reply: `收到您的图片${imageUrl}），但图像分析失败，请重新上传清晰图像。`
      }
      return
    }
  }
 
  const client = new OSS({
    region: process.env.OSS_REGION,
    accessKeyId: process.env.OSS_KEY_ID,
    accessKeySecret: process.env.OSS_KEY_SECRET,
    bucket: process.env.OSS_BUCKET
  })

  const filename = `diagnosis-${Date.now()}.txt`

  try {
    const result = await client.put(filename, Buffer.from(text, 'utf-8'))
    console.log('上传成功', result.url)

    const response = await axios.post(
      process.env.ALIYUN_API_ENDPOINT,
      {
        model: process.env.ALIYUN_MODEL_NAME,
        input: { prompt: `请根据以下症状给出中医建议：${text}` }
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.ALIYUN_ACCESS_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    )

    const reply = response.data.output.text

    ctx.body = {
      reply,
      ossUrl: result.url
    }

  } catch (err) {
    console.error('诊断失败:', err)
    ctx.status = 500
    ctx.body = { error: '服务器处理失' }
  }
})

export default router
