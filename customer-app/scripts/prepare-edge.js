const fs = require('fs');
const path = require('path');

const routePath = path.resolve(__dirname, '../src/app/api/db/route.ts');

if (fs.existsSync(routePath)) {
  let content = fs.readFileSync(routePath, 'utf-8');
  if (!content.includes("export const runtime = 'edge';")) {
    content = content.replace(
      "import { createClient } from '@supabase/supabase-js';",
      "import { createClient } from '@supabase/supabase-js';\n\nexport const runtime = 'edge';"
    );
    fs.writeFileSync(routePath, content, 'utf-8');
    console.log('Successfully injected Edge runtime flag for Cloudflare build.');
  } else {
    console.log('Edge runtime flag is already present.');
  }
} else {
  console.error('Error: route.ts file not found at:', routePath);
}
