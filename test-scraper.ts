
import { parseAgendaHtml, DocumentType } from './lib/data/agenda-scraper';
import fs from 'fs';

async function test() {
    const url = 'https://memphistn.gov/city-council-meeting-agenda/';
    console.log('Fetching', url);
    const response = await fetch(url);
    const html = await response.text();

    const docs = parseAgendaHtml(html);

    // Filter for Jan 27, 2026
    const targetDate = new Date(2026, 0, 27);
    const jan27Docs = docs.filter(d => {
        if (!d.meetingDate) return false;
        return d.meetingDate.getFullYear() === 2026 &&
            d.meetingDate.getMonth() === 0 &&
            d.meetingDate.getDate() === 27;
    });

    console.log(`Found ${jan27Docs.length} documents for Jan 27, 2026:`);
    jan27Docs.forEach(d => {
        console.log(`- [${d.documentType}] ${d.title} (${d.url})`);
    });

    fs.writeFileSync('scraped-jan27.json', JSON.stringify(jan27Docs, null, 2));
}

test();
