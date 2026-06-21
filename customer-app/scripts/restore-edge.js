const fs = require('fs');
const path = require('path');

const routePath = path.resolve(__dirname, '../src/app/api/db/route.ts');

if (fs.existsSync(routePath)) {
  let content = fs.readFileSync(routePath, 'utf-8');
  if (content.includes("export const runtime = 'edge';")) {
    content = content.replace(/\s*export const runtime = 'edge';\s*/g, '\n\n');
    content = content.replace(/\n{3,}/g, '\n\n');
    fs.writeFileSync(routePath, content, 'utf-8');
    console.log('Successfully removed Edge runtime flag after build.');
  } else {
    console.log('Edge runtime flag was not present.');
  }
} else {
  console.error('Error: route.ts file not found at:', routePath);
}
