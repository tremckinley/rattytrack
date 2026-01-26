# CapyTrack AI

CapyTrack AI is a transparency platform for the Memphis City Council. It provides automated transcription, AI-driven analysis, and legislator tracking to make local government more accessible and accountable.

## Key Features

- **Automated Transcription**: Integrated with YouTube to pull and process meeting recordings.
- **AI-Powered Analysis**: 
  - Automated meeting summaries.
  - Agenda-based breakdown of discussions.
  - Identification of key issues and topics.
- **Legislator Tracking**: Detailed profiles for council members with activity statistics and voting records (in development).
- **Document Management**: Automated scraping of council agendas, minutes, and related documents.
- **Search & Discovery**: Full-text search across transcripts and documents.

## Tech Stack

- **Frontend**: [Next.js 15](https://nextjs.org/) (App Router), [Tailwind CSS 4](https://tailwindcss.com/), [Radix UI](https://www.radix-ui.com/).
- **Icons**: [FontAwesome](https://fontawesome.com/).
- **Backend & Database**: [Supabase](https://supabase.com/) (PostgreSQL, Auth, SSR Integration).
- **AI & Processing**: 
  - [OpenAI](https://openai.com/) for high-level summaries and analysis.
  - [Xenova Transformers](https://huggingface.co/xenova) for local machine learning tasks.
- **Automation & Scraping**: [Puppeteer](https://pptr.dev/), [Cheerio](https://cheerio.js.org/).
- **Multimedia**: [FFmpeg](https://ffmpeg.org/) for audio/video processing.

## Getting Started

### Prerequisites

- Node.js (v20+ recommended)
- FFmpeg installed on your system
- A Supabase project and OpenAI API key

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd rattytrack
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Create a `.env.local` or `.env` file with the following:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   OPENAI_API_KEY=your-openai-api-key
   # Add other required variables from .env.example
   ```

### Running the App

Start the development server:
```bash
npm run dev
```
The app will be available at [http://localhost:5000](http://localhost:5000).

## Available Scripts

- `npm run dev`: Starts the development server on port 5000.
- `npm run scrape:documents`: Scrapes the Memphis City Council website for new agendas and minutes.
- `npm run analyze:transcripts`: Runs the AI analysis pipeline on pending transcriptions.
- `npm run db:update-stats`: Updates legislator and meeting statistics in the database.
- `npm run test:analysis`: Runs a test suite for the transcript analysis logic.

