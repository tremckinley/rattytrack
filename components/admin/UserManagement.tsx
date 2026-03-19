"use client";

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faSearch, faUser as faUserIcon, faEnvelope, faShieldHalved,
    faCheckCircle, faTimesCircle, faPenToSquare,
    faEllipsisVertical, faSpinner, faFloppyDisk, faXmark,
    faCalendar, faRightToBracket, faUserPlus, faBan
} from '@fortawesome/free-solid-svg-icons';
import { User } from "@/types/User";

export default function UserManagement() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [editingUser, setEditingUser] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<User>>({});
    const [saving, setSaving] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [modalError, setModalError] = useState<string | null>(null);
    const [newUserForm, setNewUserForm] = useState({
        email: "",
        first_name: "",
        last_name: "",
        username: "",
        role: "user" as const,
        email_verified: false
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async (query?: string) => {
        setLoading(true);
        try {
            const url = query ? `/api/admin/users?query=${encodeURIComponent(query)}` : "/api/admin/users";
            const res = await fetch(url);
            const data = await res.json();
            if (data.users) {
                setUsers(data.users);
            }
        } catch (error) {
            console.error("Failed to fetch users:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchUsers(searchQuery);
    };

    const startEditing = (user: User) => {
        setEditingUser(user.id);
        setEditForm({
            first_name: user.first_name,
            last_name: user.last_name,
            username: user.username,
            role: user.role,
            is_active: user.is_active,
            email_verified: user.email_verified
        });
    };

    const cancelEditing = () => {
        setEditingUser(null);
        setEditForm({});
    };

    const saveUser = async (id: string) => {
        setSaving(true);
        try {
            const res = await fetch("/api/admin/users", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, ...editForm }),
            });
            if (res.ok) {
                await fetchUsers(searchQuery);
                cancelEditing();
            }
        } catch (error) {
            console.error("Failed to save user:", error);
        } finally {
            setSaving(false);
        }
    };

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setModalError(null);
        try {
            const res = await fetch("/api/admin/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newUserForm),
            });
            const result = await res.json();

            if (res.ok) {
                await fetchUsers(searchQuery);
                closeAddModal();
            } else {
                setModalError(result.error || "Failed to create user");
            }
        } catch (error: any) {
            console.error("Failed to add user:", error);
            setModalError("An unexpected error occurred");
        } finally {
            setSaving(false);
        }
    };

    const closeAddModal = () => {
        setShowAddModal(false);
        setModalError(null);
        setNewUserForm({
            email: "",
            first_name: "",
            last_name: "",
            username: "",
            role: "user",
            email_verified: false
        });
    };

    const toggleStatus = async (user: User) => {
        setSaving(true);
        try {
            const res = await fetch("/api/admin/users", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: user.id, is_active: !user.is_active }),
            });
            if (res.ok) {
                await fetchUsers(searchQuery);
            }
        } catch (error) {
            console.error("Failed to toggle status:", error);
        } finally {
            setSaving(false);
        }
    };

    const toggleVerification = async (user: User) => {
        try {
            const res = await fetch("/api/admin/users", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: user.id, email_verified: !user.email_verified }),
            });
            if (res.ok) {
                await fetchUsers(searchQuery);
            }
        } catch (error) {
            console.error("Failed to toggle verification:", error);
        }
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return "Never";
        return new Date(dateString).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-bold text-gray-900 border-none whitespace-nowrap">User Management</h2>
                    <button
                        onClick={() => {
                            setModalError(null);
                            setShowAddModal(true);
                        }}
                        className="flex items-center gap-2 px-3 py-1.5 bg-rose-950 text-white rounded-lg text-xs font-bold hover:bg-rose-900 transition-colors"
                    >
                        <FontAwesomeIcon icon={faUserPlus} className="text-sm" />
                        Add User
                    </button>
                </div>

                <form onSubmit={handleSearch} className="relative w-full lg:w-96">
                    <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all text-black"
                    />
                </form>
            </div>

            {/* Add User Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="bg-rose-950 p-6 text-white flex justify-between items-center">
                            <h3 className="text-xl font-bold border-none">Add New User</h3>
                            <button onClick={closeAddModal} className="hover:bg-white/10 p-1 rounded-full transition-colors">
                                <FontAwesomeIcon icon={faXmark} className="text-2xl" />
                            </button>
                        </div>
                        <form onSubmit={handleAddUser} className="p-6 space-y-4">
                            {modalError && (
                                <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm flex items-center gap-2">
                                    <FontAwesomeIcon icon={faTimesCircle} className="text-base" />
                                    {modalError}
                                </div>
                            )}
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase flex justify-between">
                                    Email Address
                                    <span className="text-rose-600 font-bold">*</span>
                                </label>
                                <input
                                    required
                                    type="email"
                                    value={newUserForm.email}
                                    onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-500 text-black"
                                    placeholder="user@example.com"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase">First Name</label>
                                    <input
                                        type="text"
                                        value={newUserForm.first_name}
                                        onChange={(e) => setNewUserForm({ ...newUserForm, first_name: e.target.value })}
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 text-black"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Last Name</label>
                                    <input
                                        type="text"
                                        value={newUserForm.last_name}
                                        onChange={(e) => setNewUserForm({ ...newUserForm, last_name: e.target.value })}
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 text-black"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase">Username</label>
                                <input
                                    type="text"
                                    value={newUserForm.username}
                                    onChange={(e) => setNewUserForm({ ...newUserForm, username: e.target.value })}
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 text-black"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4 items-end">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Initial Role</label>
                                    <select
                                        value={newUserForm.role}
                                        onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value as any })}
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 text-black"
                                    >
                                        <option value="user">User</option>
                                        <option value="moderator">Moderator</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                                <div className="flex items-center gap-2 h-10">
                                    <input
                                        type="checkbox"
                                        id="verified-checkbox"
                                        checked={newUserForm.email_verified}
                                        onChange={(e) => setNewUserForm({ ...newUserForm, email_verified: e.target.checked })}
                                        className="w-4 h-4 accent-rose-600"
                                    />
                                    <label htmlFor="verified-checkbox" className="text-sm text-gray-700 cursor-pointer">Assume Verified</label>
                                </div>
                            </div>
                            <div className="pt-4">
                                <button
                                    disabled={saving}
                                    type="submit"
                                    className="w-full py-3 bg-rose-950 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-rose-900 transition-colors shadow-lg disabled:opacity-50"
                                >
                                    {saving ? <FontAwesomeIcon icon={faSpinner} className="animate-spin text-xl" /> : <FontAwesomeIcon icon={faUserPlus} className="text-xl" />}
                                    {saving ? "Creating User..." : "Create User"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-600 text-xs font-bold uppercase tracking-wider">
                        <tr>
                            <th className="px-6 py-4">User</th>
                            <th className="px-6 py-4">Role</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Last Login</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                     <FontAwesomeIcon icon={faSpinner} className="animate-spin text-2xl mx-auto mb-2" />
                                    Loading users...
                                </td>
                            </tr>
                        ) : users.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                    No users found matching your search.
                                </td>
                            </tr>
                        ) : (
                            users.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                                                {user.first_name ? user.first_name[0] : user.email[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-900">
                                                    {user.first_name} {user.last_name}
                                                    {user.username && <span className="ml-2 text-xs font-normal text-gray-500">@{user.username}</span>}
                                                </div>
                                                <div className="text-xs text-gray-500 flex items-center gap-1">
                                                     <FontAwesomeIcon icon={faEnvelope} className="text-xs" />
                                                    {user.email}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {editingUser === user.id ? (
                                            <select
                                                value={editForm.role}
                                                onChange={(e) => setEditForm({ ...editForm, role: e.target.value as any })}
                                                className="text-sm bg-white border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-rose-500 text-black"
                                            >
                                                <option value="user">User</option>
                                                <option value="moderator">Moderator</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                        ) : (
                                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                                                user.role === 'moderator' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-gray-100 text-gray-700'
                                                }`}>
                                                {user.role}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2">
                                                {user.is_active ? (
                                                    <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                                                         <FontAwesomeIcon icon={faCheckCircle} className="text-xs" /> Active
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1 text-xs text-red-600 font-medium">
                                                         <FontAwesomeIcon icon={faTimesCircle} className="text-xs" /> Inactive
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {user.email_verified ? (
                                                    <span className="text-[10px] bg-green-50 text-green-700 px-1.5 py-0.5 rounded border border-green-100">
                                                        Verified
                                                    </span>
                                                ) : (
                                                    <button
                                                        onClick={() => toggleVerification(user)}
                                                        className="text-[10px] bg-yellow-50 text-yellow-700 px-1.5 py-0.5 rounded border border-yellow-100 hover:bg-yellow-100 transition-colors"
                                                    >
                                                        Not Verified
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-xs text-gray-600 flex items-center gap-1">
                                             <FontAwesomeIcon icon={faRightToBracket} className="text-xs" />
                                            {formatDate(user.last_login_at)}
                                        </div>
                                        <div className="text-[10px] text-gray-400 flex items-center gap-1 mt-1">
                                             <FontAwesomeIcon icon={faCalendar} className="text-[10px]" />
                                            Joined {formatDate(user.created_at)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {editingUser === user.id ? (
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => saveUser(user.id)}
                                                    disabled={saving}
                                                    className="p-1.5 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                                                    title="Save"
                                                >
                                                     {saving ? <FontAwesomeIcon icon={faSpinner} className="animate-spin text-base" /> : <FontAwesomeIcon icon={faFloppyDisk} className="text-base" />}
                                                </button>
                                                <button
                                                    onClick={cancelEditing}
                                                    className="p-1.5 bg-gray-200 text-gray-600 rounded hover:bg-gray-300"
                                                    title="Cancel"
                                                >
                                                     <FontAwesomeIcon icon={faXmark} className="text-base" />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => toggleStatus(user)}
                                                    className={`p-2 rounded-lg transition-all ${user.is_active
                                                        ? 'text-red-400 hover:text-red-600 hover:bg-red-50'
                                                        : 'text-green-400 hover:text-green-600 hover:bg-green-50'}`}
                                                    title={user.is_active ? "Suspend User" : "Activate User"}
                                                >
                                                     <FontAwesomeIcon icon={faBan} className="text-lg" />
                                                </button>
                                                <button
                                                    onClick={() => startEditing(user)}
                                                    className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                                    title="Edit User"
                                                >
                                                     <FontAwesomeIcon icon={faPenToSquare} className="text-lg" />
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
