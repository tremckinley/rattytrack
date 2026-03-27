const cheerio = require('cheerio');

async function test() {
  const html = await fetch('https://memphis.granicus.com/ViewPublisher.php?view_id=6').then(r => r.text());
  const $ = cheerio.load(html);
  
  const results = [];
  $('a[href*="MediaPlayer.php"]').each((i, el) => {
    const text = $(el).text().trim() || $(el).attr('title') || 'No Title';
    const href = $(el).attr('href');
    results.push({ text, href });
  });
  console.log(JSON.stringify(results.slice(0, 10), null, 2));
}

test();
