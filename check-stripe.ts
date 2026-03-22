import { getStripe } from './lib/stripe/config';

async function checkStripe() {
    const stripe = getStripe();
    const customerId = 'cus_UBqw0Ey9Ep9YQo';
    
    // 1. Fetch customer's subscriptions
    const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
    });
    console.log('--- SUBSCRIPTIONS ---');
    console.dir(subscriptions.data, { depth: null });
    
    // 2. Fetch recent events for this customer
    const events = await stripe.events.list({
        limit: 10,
    });
    
    console.log('\n--- RECENT EVENTS ---');
    const customerEvents = events.data.filter(e => {
        const obj = e.data.object as any;
        return obj.customer === customerId || e.type.includes('webhook');
    });
    
    for (const e of events.data) {
        console.log(`Event: ${e.type} | ID: ${e.id} | Pending Webhooks: ${e.pending_webhooks}`);
    }
}

checkStripe().catch(console.error);
