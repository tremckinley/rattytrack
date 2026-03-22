// Admin YouTube Management - Deprecated Feature
// This page is retained for admin reference only.
// YouTube API video fetching has been disabled.

import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import PageContainer from '@/components/layout/PageContainer';

export default async function AdminYouTubePage() {
  return (
    <PageContainer
      title="YouTube Transcription (Legacy)"
      description="This feature is deprecated and will be reworked in a future sprint."
      actionButton={
        <Link
          href="/admin"
          className="text-capyred hover:text-rose-800 font-medium inline-block"
        >
          ← Back to Admin
        </Link>
      }
    >
      {/* Deprecation Banner */}
      <div className="border-2 border-amber-500 bg-amber-50 p-6 mb-6">
        <div className="flex items-start gap-3">
          <FontAwesomeIcon icon={faTriangleExclamation} className="text-amber-600 text-xl mt-0.5" />
          <div>
            <h3 className="font-bold text-amber-800 mb-1">Outdated Feature</h3>
            <p className="text-amber-700 text-sm">
              This YouTube video fetching pipeline is outdated and has been moved behind the admin panel. 
              The live YouTube API calls have been disabled to prevent unnecessary API costs.
              This feature will be rebuilt as part of the AI &amp; Automation sprint (Sprint 6).
            </p>
          </div>
        </div>
      </div>

      {/* Placeholder for future implementation */}
      <div className="card p-8 text-center">
        <p className="text-muted-foreground text-lg mb-2">
          No videos are currently being fetched.
        </p>
        <p className="text-sm text-muted-foreground">
          When this feature is rebuilt, it will use automated CRON jobs instead of live API calls to check for new council meeting videos.
        </p>
      </div>

      {/* Info Box */}
      <div className="mt-8 card p-6">
        <h3 className="font-semibold text-capyred mb-2">
          What This Feature Will Become
        </h3>
        <p> A space to manually upload and transcribe YouTube videos</p>
      </div>
    </PageContainer>
  );
}
