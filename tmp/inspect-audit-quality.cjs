const fs=require('fs'),cp=require('child_process');
process.stdout.write(cp.execFileSync('ssh',['-o','BatchMode=yes','-o','ConnectTimeout=8','192.168.1.160','node -'],{input:fs.readFileSync('tmp/inspect-audit-quality-remote.cjs','utf8'),encoding:'utf8',windowsHide:true,timeout:30000}));
