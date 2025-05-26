import Koa from 'koa';
import Router from 'koa-router';
import cors from '@koa/cors';
import bodyParser from 'koa-bodyparser';  
import getOssPolicyRoute from './get-oss-policy.js';
import diagnoseRoute from './diagnose.js';  

const app = new Koa();
const router = new Router();

app.use(cors());
app.use(bodyParser()); 

router.use('/api', getOssPolicyRoute.routes(), getOssPolicyRoute.allowedMethods());
router.use('/api', diagnoseRoute.routes(), diagnoseRoute.allowedMethods());

app.use(router.routes()).use(router.allowedMethods());

const PORT = 3000;
app.listen(PORT, () => {
  console.log(` Server running at http://localhost:${PORT}`);
});
