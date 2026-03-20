const fs = require('fs');
const path = require('path');

const mappings = [
  ['components/MeetingAttendeesSection', 'components/meetings/MeetingAttendeesSection'],
  ['components/MeetingDocumentsSection', 'components/meetings/MeetingDocumentsSection'],
  ['components/MeetingHeader', 'components/meetings/MeetingHeader'],
  ['components/MeetingSummary', 'components/meetings/MeetingSummary'],
  ['components/MeetingSummaryWrapper', 'components/meetings/MeetingSummaryWrapper'],
  ['components/MeetingVideoSection', 'components/meetings/MeetingVideoSection'],
  ['components/MeetingsFilter', 'components/meetings/MeetingsFilter'],
  ['components/AgendaTimeline', 'components/meetings/AgendaTimeline'],

  ['components/TranscribeButton', 'components/transcripts/TranscribeButton'],
  ['components/TranscriptPlayer', 'components/transcripts/TranscriptPlayer'],
  ['components/VideoTranscriber', 'components/transcripts/VideoTranscriber'],
  ['components/SavedTranscripts', 'components/transcripts/SavedTranscripts'],
  ['components/SpeakerMapper', 'components/transcripts/SpeakerMapper'],
  ['components/SpeakerMapperWrapper', 'components/transcripts/SpeakerMapperWrapper'],

  ['components/AttendanceHeatmap', 'components/charts/AttendanceHeatmap'],
  ['components/IssueBarChart', 'components/charts/IssueBarChart'],
  ['components/IssueSpeakingDashboard', 'components/charts/IssueSpeakingDashboard'],

  ['components/NavBar', 'components/layout/NavBar'],
  ['components/SearchBar', 'components/layout/SearchBar'],
  ['components/UserMenu', 'components/layout/UserMenu'],
  ['components/userIcon', 'components/layout/UserIcon'],
  ['components/UserIcon', 'components/layout/UserIcon'],

  ['components/TotalCard', 'components/dashboard/TotalCard'],
  ['components/VotingRecordsCard', 'components/dashboard/VotingRecordsCard'],
  ['components/VotingSummary', 'components/dashboard/VotingSummary'],
  ['components/QuotesList', 'components/dashboard/QuotesList'],
  ['components/statementCard', 'components/dashboard/StatementCard'],
  ['components/StatementCard', 'components/dashboard/StatementCard'],

  ['lib/styleUtils', 'lib/utils/styleUtils']
];

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let originalContent = content;

      for (const [oldPath, newPath] of mappings) {
        // Handle standard alias imports
        content = content.split(`@/${oldPath}`).join(`@/${newPath}`);
        // Handle common relative imports that might appear in app/ directory
        content = content.split(`../${oldPath}`).join(`../${newPath}`);
        content = content.split(`../../${oldPath}`).join(`../../${newPath}`);
        content = content.split(`./${oldPath}`).join(`./${newPath}`);
      }

      // Also fix StatementCard.tsx and UserIcon.tsx internally
      if (file === 'StatementCard.tsx') {
        content = content.replace(/function statementCard/g, 'function StatementCard');
      }
      if (file === 'UserIcon.tsx') {
        content = content.replace(/function userIcon/g, 'function UserIcon');
      }

      if (content !== originalContent) {
        console.log(`Updated imports in: ${fullPath}`);
        fs.writeFileSync(fullPath, content, 'utf8');
      }
    }
  }
}

processDirectory(path.join(__dirname, '../app'));
processDirectory(path.join(__dirname, '../components'));
processDirectory(path.join(__dirname, '../lib'));

console.log('Migration complete.');
