import { createClient } from "@/lib/utils/supabase/server";
import AutomationCenter from "@/components/admin/AutomationCenter";
import TranscriptionHub from "@/components/admin/TranscriptionHub";
import HelpModal from "@/components/admin/HelpModal";
import { Shield, Zap, FileText, Settings } from "lucide-react";

export default async function AdminPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-rose-950 text-white rounded-xl shadow-lg">
                            <Shield size={32} />
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
                                <Zap size={20} className="fill-current" />
                                <h2 className="text-xl font-bold border-none">Automation Center</h2>
                            </div>
                            <AutomationCenter />
                        </section>

                        <section>
                            <div className="flex items-center gap-2 mb-4 text-rose-950">
                                <FileText size={20} className="fill-current" />
                                <h2 className="text-xl font-bold border-none">Transcription Hub</h2>
                            </div>
                            <TranscriptionHub />
                        </section>
                    </div>

                    {/* Sidebar - 1/3 width */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 border-none">
                                <Settings size={18} />
                                System Status
                            </h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                                    <span className="text-sm text-gray-600">Database</span>
                                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full">Connected</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                                    <span className="text-sm text-gray-600">AI Services</span>
                                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full">Operational</span>
                                </div>
                                <div className="flex justify-between items-center py-2">
                                    <span className="text-sm text-gray-600">Storage</span>
                                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full">Available</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-rose-950 rounded-xl shadow-lg p-6 text-white">
                            <h3 className="font-bold mb-2 border-none">Admin Notice</h3>
                            <p className="text-sm text-rose-100 leading-relaxed">
                                Scripts executed here interact directly with production data and external APIs.
                                Please ensure you have verified any changes before running batch updates.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
