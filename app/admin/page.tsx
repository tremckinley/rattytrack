import { createClient } from "@/lib/utils/supabase/server";
import AutomationCenter from "@/components/admin/AutomationCenter";
import TranscriptionHub from "@/components/admin/TranscriptionHub";
import UserManagement from "@/components/admin/UserManagement";
import BannerManager from "@/components/admin/BannerManager";
import HelpModal from "@/components/admin/HelpModal";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShieldHalved, faBolt, faBullhorn, faFileAlt, faUsers, faClipboardCheck, faHistory } from '@fortawesome/free-solid-svg-icons';
import SystemHealth from '@/components/admin/SystemHealth';
import AuditLogViewer from '@/components/admin/AuditLogViewer';
import Link from 'next/link';

export default async function AdminPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-rose-950 text-white rounded-xl shadow-lg">
                            <FontAwesomeIcon icon={faShieldHalved} className="text-3xl" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 border-none">Admin Dashboard</h1>
                            <p className="text-gray-500">Welcome, {user?.email}</p>
                        </div>
                    </div>
                    <div className="flex items-center">
                        <HelpModal />
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Controls - 2/3 width */}
                    <div className="lg:col-span-2 space-y-8">
                        <section>
                            <div className="flex items-center gap-2 mb-4 text-rose-950">
                                <FontAwesomeIcon icon={faBolt} className="text-xl" />
                                <h2 className="text-xl font-bold border-none">Automation Center</h2>
                            </div>
                            <AutomationCenter />
                        </section>

                        <section>
                            <div className="flex items-center gap-2 mb-4 text-rose-950">
                                <FontAwesomeIcon icon={faUsers} className="text-xl" />
                                <h2 className="text-xl font-bold border-none">User Management</h2>
                            </div>
                            <UserManagement />
                        </section>

                        <section>
                            <div className="flex items-center gap-2 mb-4 text-rose-950">
                                <FontAwesomeIcon icon={faFileAlt} className="text-xl" />
                                <h2 className="text-xl font-bold border-none">Transcription Hub</h2>
                            </div>
                            <TranscriptionHub />
                        </section>

                        <section>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2 text-rose-950">
                                    <FontAwesomeIcon icon={faClipboardCheck} className="text-xl" />
                                    <h2 className="text-xl font-bold border-none">Data QA</h2>
                                </div>
                                <Link
                                    href="/admin/qa"
                                    className="text-sm text-capyred hover:underline font-bold"
                                >
                                    Open QA Queue →
                                </Link>
                            </div>
                            <p className="text-sm text-gray-500 bg-white rounded-xl shadow-md border border-gray-100 p-6">
                                Review and correct transcribed data, reassign speakers, and approve AI-generated summaries.
                            </p>
                        </section>

                        <section>
                            <div className="flex items-center gap-2 mb-4 text-rose-950">
                                <FontAwesomeIcon icon={faHistory} className="text-xl" />
                                <h2 className="text-xl font-bold border-none">Audit Log</h2>
                            </div>
                            <AuditLogViewer />
                        </section>
                    </div>

                    {/* Sidebar - 1/3 width */}
                    <div className="space-y-6">
                        <div>
                            <div className="flex items-center gap-2 mb-4 text-rose-950">
                                <FontAwesomeIcon icon={faBullhorn} className="text-xl" />
                                <h2 className="text-xl font-bold border-none">Announcement Banner</h2>
                            </div>
                            <BannerManager />
                        </div>
                        <SystemHealth />
                    </div>
                </div>
            </div>
        </div>
    );
}
