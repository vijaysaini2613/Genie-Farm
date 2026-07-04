const queries = [
  { name: 'Ashiana Aangan', q: 'Ashiana Aangan' },
  { name: 'Cosmos Greens', q: 'Cosmos Greens' },
  { name: 'Ashiana Advik', q: 'Ashiana Advik' },
  { name: 'Ashiana Tarang', q: 'Ashiana Tarang' },
  { name: 'Terra Castle', q: 'Terra Castle' },
  { name: 'Satyam Green', q: 'Satyam Green' },
  { name: 'Ashiana Town', q: 'Ashiana Town' }
];

async function main() {
  for (const item of queries) {
    try {
      // Search broader query
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(item.q)}&format=json&limit=5&countrycodes=in`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'GenieFarmCoordsFetcher/2.0' }
      });
      if (!res.ok) {
        console.log(`${item.name}: error status ${res.status}`);
        continue;
      }
      const data = await res.json();
      console.log(`\n--- RESULTS FOR: ${item.name} ---`);
      if (data && data.length > 0) {
        data.forEach(r => {
          console.log(`  lat=${r.lat}, lon=${r.lon}, display_name="${r.display_name}"`);
        });
      } else {
        // Try searching with sector/area
        console.log(`  No exact matches found.`);
      }
      await new Promise(r => setTimeout(r, 1200));
    } catch (e) {
      console.error(e);
    }
  }
}

main();
