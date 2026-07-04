async function main() {
  const lat = 28.190778;
  const lon = 76.849575;
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'GenieFarmCoordsFetcher/1.0' }
    });
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (e) {
    console.error(e);
  }
}
main();
