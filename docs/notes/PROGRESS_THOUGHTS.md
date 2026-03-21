# Thoughts on CapyTrack’s progress:

### General thoughts

We have gotten far and have made a product that does not exist anywhere else, but it is not complete. I am working on the heart of this project by myself with the help of powerful AI agents, but I am not a skilled AI developer myself, nor do I have all of the time in the world to take this on. I need to focus on what is important and get this thing tackled.

Most of this is being sidelined by the fact that we have 0 dollars going into production. I have not been willing to run AI agents out of pocket for this until it’s ready.

### Issue 1 \- AI Capabilities

There is a lot happening through scripting and logic that will likely have to be done with AI agents in the future if we expect to scale this project. Most of the scraping for documents and meetings might be more effective using an AI agent that runs periodically. I could check for an existing transcript, voting records, etc. and if none exists then we could use AI to transcribe ourselves. 

Besides doing the web scraping, AI needs to be trained to better understand legislator voices and unique situations within videos (intermissions, Youtube commercials, cross-talk, etc.). 

There are likely tools out there that exist and can do these things well.

### Issue 2 \- Paid Users

I want to be sure this is set up right and that our site is secure enough to start taking payments. I don’t fully understand what it looks like to start taking paid users and I want to be using the best backend and hosting environment to do so. The site does not currently have a paywall or a website for interested users. I would likely make the marketing website in a totally different environment. I am not sure how most SaaS products are built, perhaps [Next.js](http://Next.js) isn’t right for us, but I believe it could be at least for now.

### Issue 3 \- Cleaner UI setup

I want pages and components to be better organized. This app needs more page templates that can be reused to preserve a single style across the entire app. 

### The Next Level

This site and some of the processes are certainly in “MVP mode”. I want to make sure I am prepared to understand what a production-ready version of this app would look like for whenever it is time to start building it. How do the following need to be set up?

1. Backend simplicity  
   1. ORM  
   2. Optimal database structure (relational vs non-relational) \- major change to app.  
   3. Cost-effective hosting and storage  
        
2. Admin users versus paid customers  
   1. Will they even be using the same site or will the “back-office” be something totally separate and AI-driven first? 

