"use client";
import React, { useState, useMemo } from "react";
import useSWR, { mutate } from "swr";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowLeft,
    Trophy,
    Loader2,
    Check,
    Star,
    Medal,
    X,
    Calendar,
    MapPin,
    ShieldAlert,
    Search,
    Filter,
    ChevronLeft,
    ChevronRight,
    Clock,
    Award,
} from "lucide-react";

import { adminFetcher, ADMIN_SWR_OPTIONS } from "@/lib/fetchers";

const ITEMS_PER_PAGE = 10;

// --- Helpers ---

type StatusType = "pending" | "approved" | "rejected" | "finalist" | "winner";

/** Derive the "effective state" of a submission for display purposes */
function getEffectiveState(sub: any): { label: string; color: string; bgColor: string } {
    if (sub.isActive === false) return { label: "Deactivated", color: "text-red-400", bgColor: "bg-red-500/10" };
    switch (sub.status as StatusType) {
        case "winner":   return { label: "Winner",   color: "text-yellow-400", bgColor: "bg-yellow-500/10" };
        case "finalist": return { label: "Finalist", color: "text-purple-400", bgColor: "bg-purple-500/10" };
        case "approved": return { label: "Active",   color: "text-green-400",  bgColor: "bg-green-500/10"  };
        case "rejected": return { label: "Rejected", color: "text-red-400",    bgColor: "bg-red-500/10"    };
        default:         return { label: "Pending",  color: "text-yellow-400", bgColor: "bg-yellow-500/10" };
    }
}

function getStatusIcon(sub: any) {
    if (sub.isActive === false) return <ShieldAlert className="w-3.5 h-3.5 text-red-400" />;
    switch (sub.status as StatusType) {
        case "winner":   return <Medal className="w-3.5 h-3.5 text-yellow-400" />;
        case "finalist": return <Star className="w-3.5 h-3.5 text-purple-400" />;
        case "approved": return <Check className="w-3.5 h-3.5 text-green-400" />;
        case "rejected": return <X className="w-3.5 h-3.5 text-red-500" />;
        default:         return <Clock className="w-3.5 h-3.5 text-yellow-400" />;
    }
}

// --- Sub-Components ---

function ActionButton({ onClick, label, icon, variant, processing }: { 
    onClick: () => void; label: string; icon: React.ReactNode; 
    variant: "green" | "red" | "purple" | "yellow" | "neutral" | "blue"; processing: boolean 
}) {
    const styles: Record<string, string> = {
        green:   "bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20",
        red:     "bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20",
        purple:  "bg-purple-500/10 text-purple-400 border-purple-500/20 hover:bg-purple-500/20",
        yellow:  "bg-yellow-500/10 text-yellow-400 border-yellow-500/20 hover:bg-yellow-500/20",
        blue:    "bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20",
        neutral: "bg-white/5 text-white/50 border-white/10 hover:bg-white/10 hover:text-white/70",
    };
    return (
        <button
            onClick={onClick}
            disabled={processing}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[9px] font-bold font-robotoMono transition-all disabled:opacity-30 ${styles[variant]}`}
        >
            {processing ? <Loader2 className="w-3 h-3 animate-spin" /> : icon}
            {label}
        </button>
    );
}

function ToggleSwitch({ isOn, onToggle, processing }: { isOn: boolean; onToggle: () => void; processing: boolean }) {
    return (
        <button 
            onClick={onToggle} 
            disabled={processing}
            className="flex items-center gap-3 group disabled:opacity-30 outline-none select-none transition-opacity"
            title={isOn ? "Deactivate submission" : "Activate submission"}
        >
            <div className={`relative w-10 h-[22px] rounded-full transition-colors duration-500 ${isOn ? 'bg-green-500/10' : 'bg-red-500/10'} border border-white/10 flex items-center px-[3px]`}>

                {/* Thumb */}
                <motion.div 
                    initial={false}
                    animate={{ 
                        x: isOn ? 18 : 0,
                        backgroundColor: isOn ? "#10b981" : "#ef4444",
                    }}
                    transition={{ type: "spring", stiffness: 450, damping: 30 }}
                    style={{ 
                        boxShadow: isOn ? "0 0 15px rgba(16, 185, 129, 0.6)" : "0 0 10px rgba(239, 68, 68, 0.4)"
                    }}
                    className="relative w-4 h-4 rounded-full border border-white/30 z-10"
                />
            </div>
            
            <div className="flex flex-col items-start leading-tight">
                <div className="flex items-center gap-1.5 min-h-[12px]">
                    <span className={`text-[8px] font-black uppercase tracking-widest font-unbounded ${isOn ? 'text-green-400' : 'text-red-400'}`}>
                        {isOn ? "Active" : "Inactive"}
                    </span>
                    {processing && <Loader2 className="w-2.5 h-2.5 animate-spin text-white/50" />}
                </div>
                {/* <span className="text-[7px] text-white/20 font-robotoMono uppercase tracking-tighter">
                    {processing ? "Updating State..." : "Submission State"}
                </span> */}
            </div>
        </button>
    );
}

function SubmissionCard({ sub, index, onUpdate, processing }: any) {
    const isPending = sub.status === "pending";
    const isRejected = sub.status === "rejected";
    const isActive = sub.isActive !== false;
    const isReviewed = sub.status !== "pending";
    const isApprovedOrBeyond = ["approved", "finalist", "winner"].includes(sub.status);
    const state = getEffectiveState(sub);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.025 }}
            className={`glass-container rounded-xl p-5 transition-all group ${!isActive ? 'opacity-60' : ''} hover:border-white/15`}
        >
            <div className="flex flex-col lg:flex-row lg:items-center gap-5">
                {/* Left: Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                        {getStatusIcon(sub)}
                        <span className="text-sm font-bold text-white font-robotoMono truncate max-w-[220px]">
                            {sub.projectSnapshot?.name}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold font-robotoMono uppercase ${state.bgColor} ${state.color}`}>
                            {state.label}
                        </span>
                        {/* Show highlight badge for finalist/winner on top of active status */}
                        {isActive && sub.status === "finalist" && (
                            <span className="px-2 py-0.5 rounded-full text-[8px] font-bold font-robotoMono uppercase bg-purple-500/10 text-purple-400">
                                ★ Finalist
                            </span>
                        )}
                        {isActive && sub.status === "winner" && (
                            <span className="px-2 py-0.5 rounded-full text-[8px] font-bold font-robotoMono uppercase bg-yellow-500/10 text-yellow-400">
                                Winner
                            </span>
                        )}
                        {sub.certificateClaimable && (
                            <span className="px-2 py-0.5 rounded-full text-[8px] font-bold font-robotoMono uppercase bg-blue-500/10 text-blue-400">
                                Certificate
                            </span>
                        )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1 gap-x-6 text-[10px] font-robotoMono text-white/40">
                        <p><span className="text-white/20 uppercase mr-1">College:</span> {sub.collegeSnapshot?.name}</p>
                        <p><span className="text-white/20 uppercase mr-1">Event:</span> {sub.showcaseEventId?.name || "Global"}</p>
                        <p><span className="text-white/20 uppercase mr-1">Submitted By:</span> {sub.submittedBy?.slice(0, 6)}...{sub.submittedBy?.slice(-4)}</p>
                        <p>
                            <span className="text-white/20 uppercase mr-1">Links:</span>
                            <a href={sub.githubRepo} target="_blank" rel="noreferrer" className="text-blue-400/60 hover:text-blue-400">GitHub</a>
                            {sub.demoLink && <> · <a href={sub.demoLink} target="_blank" rel="noreferrer" className="text-blue-400/60 hover:text-blue-400">Demo</a></>}
                        </p>
                    </div>
                </div>

                {/* Right: Actions — contextual based on status */}
                <div className="flex items-center gap-2 flex-wrap shrink-0">
                    {/* PHASE 1: Pending → Approve / Reject */}
                    {isPending && (
                        <>
                            <ActionButton
                                onClick={() => onUpdate(sub._id, { status: "approved" })}
                                label="Approve"
                                icon={<Check className="w-3 h-3" />}
                                variant="green"
                                processing={processing === sub._id}
                            />
                            <ActionButton
                                onClick={() => onUpdate(sub._id, { status: "rejected" })}
                                label="Reject"
                                icon={<X className="w-3 h-3" />}
                                variant="red"
                                processing={processing === sub._id}
                            />
                        </>
                    )}

                    {/* PHASE 2: After review → Active/Deactivate toggle */}
                    {isReviewed && (
                        <>
                            <ToggleSwitch
                                isOn={isActive}
                                onToggle={() => onUpdate(sub._id, { isActive: !isActive })}
                                processing={processing === sub._id}
                            />
                            
                            {/* PHASE 3: When active + approved → Finalist / Winner badges */}
                            {isActive && isApprovedOrBeyond && (
                                <>
                                    <div className="w-px h-4 bg-white/10 mx-1" />
                                    <ActionButton
                                        onClick={() => onUpdate(sub._id, { status: sub.status === "finalist" ? "approved" : "finalist" })}
                                        label={sub.status === "finalist" ? "Remove Finalist" : "Finalist"}
                                        icon={<Star className="w-3 h-3" />}
                                        variant={sub.status === "finalist" ? "purple" : "neutral"}
                                        processing={processing === sub._id}
                                    />
                                    <ActionButton
                                        onClick={() => onUpdate(sub._id, { status: sub.status === "winner" ? "approved" : "winner", placement: sub.status === "winner" ? null : "1st" })}
                                        label={sub.status === "winner" ? "Remove Winner" : "Winner"}
                                        icon={<Medal className="w-3 h-3" />}
                                        variant={sub.status === "winner" ? "yellow" : "neutral"}
                                        processing={processing === sub._id}
                                    />
                                    <ActionButton
                                        onClick={() => onUpdate(sub._id, { certificateClaimable: !sub.certificateClaimable })}
                                        label={sub.certificateClaimable ? "Disable Certificate" : "Enable Certificate"}
                                        icon={sub.certificateClaimable ? <X className="w-3 h-3" /> : <Award className="w-3 h-3" />}
                                        variant={sub.certificateClaimable ? "blue" : "neutral"}
                                        processing={processing === sub._id}
                                    />
                                </>
                            )}
                        </>
                    )}

                    {/* Rejected: Allow re-approve */}
                    {isRejected && (
                        <ActionButton
                            onClick={() => onUpdate(sub._id, { status: "approved" })}
                            label="Re-Approve"
                            icon={<Check className="w-3 h-3" />}
                            variant="green"
                            processing={processing === sub._id}
                        />
                    )}
                </div>
            </div>
        </motion.div>
    );
}

function EventCard({ event, onEdit, onDelete }: any) {
    return (
        <div className="glass-container rounded-2xl p-6 group">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-sm font-bold text-white font-unbounded mb-1 truncate max-w-[200px]">
                        {event.name}
                    </h3>
                    <p className="text-[10px] text-white/40 font-robotoMono">
                        {event.city} · {event.regionSnapshot?.name}
                    </p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold font-robotoMono uppercase ${
                    event.status === 'open' ? 'bg-blue-500/10 text-blue-400' :
                    event.status === 'judging' ? 'bg-yellow-500/10 text-yellow-400' :
                    event.status === 'completed' ? 'bg-green-500/10 text-green-400' : 'bg-white/5 text-white/30'
                }`}>
                    {event.status}
                </span>
            </div>
            <div className="space-y-2 mb-6 text-[10px] font-robotoMono text-white/60">
                <div className="flex items-center gap-2">
                    <Calendar className="w-3 h-3 text-white/20" />
                    {event.eventDate ? new Date(event.eventDate).toLocaleDateString() : 'Date TBD'}
                </div>
                <div className="flex items-center gap-2">
                    <MapPin className="w-3 h-3 text-white/20" />
                    {event.venue || 'Venue TBD'}
                </div>
                <div className="flex items-center gap-2">
                    <Trophy className="w-3 h-3 text-yellow-400/40" />
                    {event.prizeCurrency === 'INR' ? '₹' : '$'}{event.prizePoolUsd?.toLocaleString()} Pool
                </div>
            </div>
            <div className="flex items-center gap-2 pt-4 border-t border-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => onEdit(event)} className="flex-1 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-[9px] font-bold font-robotoMono transition-all">
                    Edit
                </button>
                <button onClick={() => onDelete(event._id)} className="px-3 py-2 rounded-lg bg-red-500/5 hover:bg-red-500/10 text-red-400/60 hover:text-red-400 text-[9px] font-bold font-robotoMono transition-all">
                    Delete
                </button>
            </div>
        </div>
    );
}

// --- Filter Pill ---
function FilterPill({ label, active, onClick, count }: { label: string; active: boolean; onClick: () => void; count?: number }) {
    return (
        <button
            onClick={onClick}
            className={`px-3 py-1.5 rounded-lg text-[9px] font-bold font-robotoMono transition-all border ${
                active 
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' 
                    : 'bg-white/5 text-white/40 border-white/5 hover:bg-white/10 hover:text-white/60'
            }`}
        >
            {label}
            {count !== undefined && (
                <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[8px] ${active ? 'bg-purple-500/30' : 'bg-white/10'}`}>
                    {count}
                </span>
            )}
        </button>
    );
}

// --- Main Component ---

export default function AdminShowcasesPage() {
    const [activeTab, setActiveTab] = useState<"submissions" | "events">("submissions");
    const [processing, setProcessing] = useState<string | null>(null);
    const [eventModal, setEventModal] = useState<{ isOpen: boolean; event: any }>({ isOpen: false, event: null });

    // Search, filter, pagination state
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [currentPage, setCurrentPage] = useState(1);

    // API Hooks
    const { data: subData, isLoading: subsLoading, error: subsError, mutate: boundMutate } = useSWR("/api/admin/builder-pods/showcases", adminFetcher, ADMIN_SWR_OPTIONS);
    const { data: eventData } = useSWR("/api/admin/builder-pods/events", adminFetcher, ADMIN_SWR_OPTIONS);

    const allSubmissions: any[] = subData?.submissions ?? [];
    const events = eventData?.events ?? [];
    const regions = eventData?.regions ?? [];

    // --- Derived: counts for filter pills ---
    const statusCounts = useMemo(() => {
        const counts: Record<string, number> = { all: allSubmissions.length, pending: 0, active: 0, rejected: 0, deactivated: 0, finalist: 0, winner: 0 };
        allSubmissions.forEach((s: any) => {
            if (s.isActive === false) { counts.deactivated++; return; }
            if (s.status === "pending") counts.pending++;
            else if (s.status === "rejected") counts.rejected++;
            else if (s.status === "finalist") { counts.active++; counts.finalist++; }
            else if (s.status === "winner") { counts.active++; counts.winner++; }
            else if (s.status === "approved") counts.active++;
        });
        return counts;
    }, [allSubmissions]);

    // --- Derived: filtered + searched + paginated ---
    const filteredSubmissions = useMemo(() => {
        let list = [...allSubmissions];

        // Filter
        if (statusFilter !== "all") {
            list = list.filter((s: any) => {
                switch (statusFilter) {
                    case "pending": return s.status === "pending" && s.isActive !== false;
                    case "active": return ["approved", "finalist", "winner"].includes(s.status) && s.isActive !== false;
                    case "rejected": return s.status === "rejected";
                    case "deactivated": return s.isActive === false;
                    case "finalist": return s.status === "finalist" && s.isActive !== false;
                    case "winner": return s.status === "winner" && s.isActive !== false;
                    default: return true;
                }
            });
        }

        // Search
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            list = list.filter((s: any) =>
                s.projectSnapshot?.name?.toLowerCase().includes(q) ||
                s.collegeSnapshot?.name?.toLowerCase().includes(q) ||
                s.submittedBy?.toLowerCase().includes(q) ||
                s.showcaseEventId?.name?.toLowerCase().includes(q)
            );
        }

        return list;
    }, [allSubmissions, statusFilter, searchQuery]);

    const totalPages = Math.max(1, Math.ceil(filteredSubmissions.length / ITEMS_PER_PAGE));
    const paginatedSubmissions = filteredSubmissions.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    // Reset page when filter/search changes
    const handleFilterChange = (filter: string) => {
        setStatusFilter(filter);
        setCurrentPage(1);
    };
    const handleSearchChange = (value: string) => {
        setSearchQuery(value);
        setCurrentPage(1);
    };

    // Handlers
    const handleSubmissionUpdate = async (submissionId: string, payload: any) => {
        setProcessing(submissionId);

        // Optimistic Update: Create a new data object with the updated submission
        const optimisticData = subData ? {
            ...subData,
            submissions: subData.submissions.map((s: any) => 
                s._id === submissionId ? { ...s, ...payload } : s
            )
        } : null;

        try {
            // Apply optimistic data without re-validating yet
            if (optimisticData) {
                await boundMutate(optimisticData, false);
            }

            const res = await fetch("/api/admin/builder-pods/showcases", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ submissionId, ...payload }),
            });
            const data = await res.json();
            
            if (res.ok && data.success) {
                // Success: Update the local cache with the fully populated object returned from server
                if (subData && data.submission) {
                    const finalData = {
                        ...subData,
                        submissions: subData.submissions.map((s: any) => 
                            s._id === submissionId ? data.submission : s
                        )
                    };
                    await boundMutate(finalData, false);
                } else {
                    await boundMutate();
                }
            } else {
                alert(`Error: ${data.error || 'Failed to update submission'}`);
                // Revert to original data on failure
                await boundMutate();
            }
        } catch (err) {
            console.error(err);
            alert("Network error, please try again.");
            // Revert on error
            await boundMutate();
        } finally {
            setProcessing(null);
        }
    };

    const handleEventSave = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.currentTarget).entries());

        setProcessing("event-save");
        try {
            const isEditing = !!eventModal.event;
            const url = isEditing ? `/api/admin/builder-pods/events/${eventModal.event._id}` : "/api/admin/builder-pods/events";
            const res = await fetch(url, {
                method: isEditing ? "PATCH" : "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(data),
            });
            if (res.ok) {
                mutate("/api/admin/builder-pods/events");
                setEventModal({ isOpen: false, event: null });
            }
        } finally {
            setProcessing(null);
        }
    };

    const handleDeleteEvent = async (id: string) => {
        if (!confirm("Are you sure? This will delete the event and all its associated submissions.")) return;
        try {
            const res = await fetch(`/api/admin/builder-pods/events/${id}`, { method: "DELETE", credentials: "include" });
            if (res.ok) mutate("/api/admin/builder-pods/events");
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-10 py-6">
            {/* Header */}
            <header className="mb-8">
                <Link href="/admin/builder-pods" className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/60 hover:text-white/80 font-robotoMono mb-6 transition-colors">
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Admin Dashboard
                </Link>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Trophy className="w-5 h-5 text-purple-400/70" />
                        <h1 className="text-2xl font-black text-white font-unbounded tracking-tight">Showcase Management</h1>
                    </div>

                    <div className="flex p-1 bg-white/5 rounded-xl border border-white/10 self-start">
                        {["submissions", "events"].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab as any)}
                                className={`px-4 py-1.5 rounded-lg text-[10px] font-bold font-robotoMono transition-all capitalize ${activeTab === tab ? 'bg-purple-500 text-white shadow-lg' : 'text-white/40 hover:text-white/70'}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            {/* Content Area */}
            <main>
                {activeTab === "submissions" ? (
                    <div className="space-y-5">
                        {/* Search + Filter Bar */}
                        <div className="glass-container rounded-2xl p-4 space-y-4">
                            {/* Search */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                                <input
                                    type="text"
                                    placeholder="Search by project, college, wallet, or event..."
                                    value={searchQuery}
                                    onChange={(e) => handleSearchChange(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-purple-500/50 transition-all font-robotoMono"
                                />
                                {searchQuery && (
                                    <button 
                                        onClick={() => handleSearchChange("")}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>

                            {/* Filter Pills */}
                            <div className="flex items-center gap-2 flex-wrap">
                                <Filter className="w-3.5 h-3.5 text-white/20 mr-1" />
                                {[
                                    { key: "all", label: "All" },
                                    { key: "pending", label: "Pending" },
                                    { key: "active", label: "Active" },
                                    { key: "rejected", label: "Rejected" },
                                    { key: "deactivated", label: "Deactivated" },
                                    { key: "finalist", label: "Finalists" },
                                    { key: "winner", label: "Winners" },
                                ].map(f => (
                                    <FilterPill
                                        key={f.key}
                                        label={f.label}
                                        active={statusFilter === f.key}
                                        onClick={() => handleFilterChange(f.key)}
                                        count={statusCounts[f.key]}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Submissions List */}
                        {subsError ? (
                            <div className="glass-container rounded-2xl p-12 text-center">
                                <Trophy className="w-8 h-8 text-amber-400/50 mx-auto mb-3" />
                                <p className="text-sm text-amber-300 font-robotoMono">
                                    {(subsError as any)?.status === 401
                                        ? "Session expired. Please refresh or re-authenticate."
                                        : "Unable to load submissions right now."}
                                </p>
                                <button
                                    onClick={() => boundMutate()}
                                    className="mt-4 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] text-white/60 font-robotoMono transition-all"
                                >
                                    Retry
                                </button>
                            </div>
                        ) : subsLoading ? (
                            <div className="space-y-2">
                                {[1, 2, 3].map(i => <div key={i} className="glass-container h-24 animate-pulse rounded-xl" />)}
                            </div>
                        ) : filteredSubmissions.length === 0 ? (
                            <div className="glass-container rounded-2xl p-12 text-center text-sm text-white/40 font-robotoMono">
                                {searchQuery || statusFilter !== "all"
                                    ? "No submissions match your filters"
                                    : "No submissions found"}
                            </div>
                        ) : (
                            <>
                                <div className="space-y-3">
                                    {paginatedSubmissions.map((sub: any, idx: number) => (
                                        <SubmissionCard
                                            key={sub._id}
                                            sub={sub}
                                            index={idx}
                                            processing={processing}
                                            onUpdate={handleSubmissionUpdate}
                                        />
                                    ))}
                                </div>

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="flex items-center justify-between glass-container rounded-xl px-4 py-3">
                                        <p className="text-[10px] text-white/30 font-robotoMono">
                                            Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredSubmissions.length)} of {filteredSubmissions.length}
                                        </p>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                disabled={currentPage === 1}
                                                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                                            >
                                                <ChevronLeft className="w-3.5 h-3.5" />
                                            </button>
                                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                                .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                                                .map((page, idx, arr) => (
                                                    <React.Fragment key={page}>
                                                        {idx > 0 && arr[idx - 1] !== page - 1 && (
                                                            <span className="text-[9px] text-white/20 px-1">…</span>
                                                        )}
                                                        <button
                                                            onClick={() => setCurrentPage(page)}
                                                            className={`w-7 h-7 rounded-lg text-[10px] font-bold font-robotoMono transition-all ${
                                                                currentPage === page
                                                                    ? 'bg-purple-500 text-white shadow-md'
                                                                    : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/70'
                                                            }`}
                                                        >
                                                            {page}
                                                        </button>
                                                    </React.Fragment>
                                                ))
                                            }
                                            <button
                                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                                disabled={currentPage === totalPages}
                                                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                                            >
                                                <ChevronRight className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                ) : (
                    /* Events Tab */
                    <div className="space-y-6">
                        <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/10">
                            <p className="text-xs text-white/40 font-robotoMono">Manage Regional Showcase Events</p>
                            <button
                                onClick={() => setEventModal({ isOpen: true, event: null })}
                                className="px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-600 text-white text-[10px] font-bold font-unbounded transition-all"
                            >
                                Create Event
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {events.map((event: any) => (
                                <EventCard
                                    key={event._id}
                                    event={event}
                                    onEdit={(ev: any) => setEventModal({ isOpen: true, event: ev })}
                                    onDelete={handleDeleteEvent}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </main>

            {/* Event Modal Overlay */}
            <AnimatePresence>
                {eventModal.isOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="glass-container w-full max-w-lg p-8 rounded-3xl max-h-[90vh] overflow-y-auto"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-lg font-black text-white font-unbounded">
                                    {eventModal.event ? "Edit Showcase" : "Create Showcase"}
                                </h2>
                                <button onClick={() => setEventModal({ isOpen: false, event: null })} className="text-white/40 hover:text-white">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleEventSave} className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-white/40 uppercase mb-1.5 ml-1">Event Name</label>
                                    <input name="name" defaultValue={eventModal.event?.name} required placeholder="e.g. Maharashtra Regional" className="form-input-styled" />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="block text-[10px] font-bold text-white/40 uppercase ml-1">Region</label>
                                        <select name="regionId" defaultValue={eventModal.event?.regionId} required className="form-input-styled appearance-none">
                                            <option value="">Select Region</option>
                                            {regions.map((r: any) => <option key={r._id} value={r._id}>{r.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="block text-[10px] font-bold text-white/40 uppercase ml-1">City</label>
                                        <input name="city" defaultValue={eventModal.event?.city} required placeholder="Mumbai" className="form-input-styled" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-white/40 uppercase mb-1.5 ml-1">Subtitle</label>
                                    <input name="subtitle" defaultValue={eventModal.event?.subtitle || ""} placeholder="e.g. 3rd State-Level Showcase" className="form-input-styled" />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="block text-[10px] font-bold text-white/40 uppercase ml-1">Event Date</label>
                                        <input name="eventDate" type="date" defaultValue={eventModal.event?.eventDate ? new Date(eventModal.event.eventDate).toISOString().split('T')[0] : ''} className="form-input-styled" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="block text-[10px] font-bold text-white/40 uppercase ml-1">Time</label>
                                        <input name="eventTime" defaultValue={eventModal.event?.eventTime || ""} placeholder="6:00 PM – 8:00 PM IST" className="form-input-styled" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="block text-[10px] font-bold text-white/40 uppercase ml-1">Prize Pool</label>
                                        <input name="prizePoolUsd" type="number" defaultValue={eventModal.event?.prizePoolUsd || 0} className="form-input-styled" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="block text-[10px] font-bold text-white/40 uppercase ml-1">Currency</label>
                                        <select name="prizeCurrency" defaultValue={eventModal.event?.prizeCurrency || 'USD'} className="form-input-styled appearance-none">
                                            <option value="USD">USD ($)</option>
                                            <option value="INR">INR (₹)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="block text-[10px] font-bold text-white/40 uppercase ml-1">Format</label>
                                        <select name="format" defaultValue={eventModal.event?.format || 'Virtual'} className="form-input-styled appearance-none">
                                            <option value="Virtual">Virtual</option>
                                            <option value="In person">In person</option>
                                            <option value="Hybrid">Hybrid</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="block text-[10px] font-bold text-white/40 uppercase ml-1">Status</label>
                                        <select name="status" defaultValue={eventModal.event?.status || 'upcoming'} className="form-input-styled appearance-none">
                                            <option value="upcoming">Upcoming</option>
                                            <option value="open">Open (Submissions Active)</option>
                                            <option value="judging">Judging Phase</option>
                                            <option value="completed">Completed</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-white/40 uppercase mb-1.5 ml-1">Join Link</label>
                                    <input name="joinLink" defaultValue={eventModal.event?.joinLink || ""} placeholder="https://meet.google.com/..." className="form-input-styled" />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-white/40 uppercase mb-1.5 ml-1">Poster URL</label>
                                    <input name="poster" defaultValue={eventModal.event?.poster || ""} placeholder="/images/showcase-flyers/poster.png" className="form-input-styled" />
                                </div>

                                <button
                                    type="submit"
                                    disabled={processing === 'event-save'}
                                    className="w-full py-3 bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white font-black text-xs font-unbounded rounded-xl transition-all shadow-lg shadow-purple-500/20 mt-4"
                                >
                                    {processing === 'event-save' ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Save Showcase Event"}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style jsx global>{`
                .form-input-styled {
                    width: 100%;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 0.75rem;
                    padding: 0.625rem 1rem;
                    font-size: 0.875rem;
                    color: white;
                    font-family: 'Roboto Mono', monospace;
                    transition: all 0.2s;
                }
                .form-input-styled:focus {
                    outline: none;
                    border-color: #a855f7;
                    background: rgba(255, 255, 255, 0.08);
                }
            `}</style>
        </div>
    );
}
