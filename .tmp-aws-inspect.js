const fs = require('fs');
const text = fs.readFileSync('src/config/awsIotCredentials.ts', 'utf8');
function extract(pattern) {
  const match = text.match(pattern);
  if (!match) throw new Error('missing value');
  return match[1];
}
const rootCA = extract(/rootCA:\s*`([\s\S]*?)`/);
const deviceCert = extract(/deviceCert:\s*`([\s\S]*?)`/);
const privateKey = extract(/privateKey:\s*`([\s\S]*?)`/);
console.log('rootCA starts', rootCA.trim().startsWith('-----BEGIN CERTIFICATE-----'));
console.log('rootCA length', rootCA.length);
console.log('deviceCert starts', deviceCert.trim().startsWith('-----BEGIN CERTIFICATE-----'));
console.log('deviceCert length', deviceCert.length);
console.log('privateKey starts', privateKey.trim().startsWith('-----BEGIN'));
console.log('privateKey length', privateKey.length);
console.log('rootCA head', JSON.stringify(rootCA.slice(0, 80)));
console.log('deviceCert head', JSON.stringify(deviceCert.slice(0, 80)));
console.log('privateKey head', JSON.stringify(privateKey.slice(0, 80)));
