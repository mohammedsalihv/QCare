const from = require('node:module').createRequire('/home/salih/QCare/server/package.json');
const app = JSON.parse(require('child_process').execFileSync('pm2', ['jlist'], { encoding: 'utf8' })).find(p => p.name === 'QCare');
if (app?.pm2_env.pm_exec_path !== '/home/salih/QCare/server/index.js') throw Error('Unexpected QCare service');
from('dotenv').config({ path: require('path').join(app.pm2_env.pm_cwd, '.env'), quiet: true });
process.env.MONGO_URL = app.pm2_env.MONGO_URL || process.env.MONGO_URL;
const mongoose = from('mongoose');
(async()=>{
 await mongoose.connect(process.env.MONGO_URL);
 const User=from('./models/users'), Audit=from('./models/ClinicalAudit');
 const account=await User.findOne({username:'portal.superadmin'}).select('_id username role status isActive');
 console.log(JSON.stringify({ account: account?.toObject(), auditsByStatus: await Audit.aggregate([{$group:{_id:'$status',count:{$sum:1}}}]), pendingRequests: await Audit.countDocuments({status:'pending-approval'}) }));
 await mongoose.disconnect();
})().catch(async e=>{ console.error(e.message); await mongoose.disconnect(); process.exitCode=1; });
