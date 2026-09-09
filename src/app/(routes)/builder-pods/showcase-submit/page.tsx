"use client";
import React, { useState, useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { motion } from "framer-motion";
import Link from "next/link";
import {
    ArrowLeft,
    Trophy,
    Github,
    ExternalLink,
    Code2,
    FileText,
    Loader2,
    CheckCircle,
    AlertCircle,
} from "lucide-react";

interface ShowcaseEvent {
    _id: string;
    name: string;
    city?: string;
    regionSnapshot: { name: string; showcaseCity: string };
    status: string;
}

export default function ShowcaseSubmitPage() {
    const { user } = usePrivy();
    const walletAddress = user?.wallet?.address ?? null;

    const [showcases, setShowcases] = useState<ShowcaseEvent[]>([]);
    const [colleges, setColleges] = useState<{ slug: string; name: string }[]>([]);
    const [projects, setProjects] = useState<{ _id: string; name: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

    const [form, setForm] = useState({
        showcaseEventId: "",
        collegeSlug: "",
        projectId: "",
        demoLink: "",
        githubRepo: "",
        contractAddress: "",
        pitchDeckUrl: "",
    });

    useEffect(() => {
        setLoading(true);
        Promise.all([
            fetch("/api/builder-pods/showcases").then((r) => r.json()),
            fetch("/api/builder-pods/register").then((r) => r.json()),
            fetch("/api/builder-pods/members/me").then((r) => r.json()),
        ])
            .then(([showcaseData, collegeData, profileData]) => {
                if (showcaseData.success) {
                    setShowcases(showcaseData.showcases.filter((s: ShowcaseEvent) => s.status !== "completed"));
                }
                if (collegeData.success) setColleges(collegeData.colleges);
                
                // Auto-select college if user is registered
                if (profileData.success && profileData.membership?.collegeId?.slug) {
                    setForm(f => ({ ...f, collegeSlug: profileData.membership.collegeId.slug }));
                }
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    // Load projects when college selected
    useEffect(() => {
        if (!form.collegeSlug || !walletAddress) {
            setProjects([]);
            return;
        }
        fetch(`/api/builder-pods/colleges/${form.collegeSlug}/projects`)
            .then((r) => r.json())
            .then((data) => {
                if (data.success) {
                    // Only show projects where user is lead or member
                    const userProjects = data.projects.filter((p: any) => 
                        p.teamLeader.toLowerCase() === walletAddress.toLowerCase() ||
                        p.teamMembers?.some((m: any) => m.walletAddress.toLowerCase() === walletAddress.toLowerCase())
                    );
                    setProjects(userProjects);
                    
                    // Auto-select if only one project
                    if (userProjects.length === 1) {
                        setForm(f => ({ ...f, projectId: userProjects[0]._id }));
                    }
                }
            })
            .catch(console.error);
    }, [form.collegeSlug, walletAddress]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!walletAddress) return;
        setSubmitting(true);
        setResult(null);

        try {
            const payload: Record<string, string> = { ...form };
            if (!payload.demoLink.trim()) delete payload.demoLink;
            if (!payload.contractAddress.trim()) delete payload.contractAddress;
            if (!payload.pitchDeckUrl.trim()) delete payload.pitchDeckUrl;

            const res = await fetch("/api/builder-pods/showcases", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (data.success) {
                setResult({ success: true, message: "🎉 Showcase submission received! Status: Pending Review" });
                setForm({
                    showcaseEventId: "",
                    collegeSlug: "",
                    projectId: "",
                    demoLink: "",
                    githubRepo: "",
                    contractAddress: "",
                    pitchDeckUrl: "",
                });
            } else {
                setResult({ success: false, message: data.error || "Submission failed" });
            }
        } catch {
            setResult({ success: false, message: "Network error. Please try again." });
        } finally {
            setSubmitting(false);
        }
    };

    const inputClass =
        "w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-robotoMono placeholder:text-white/45 focus:outline-none focus:border-blue-500/40 focus:bg-white/[0.05] transition-all";
    const labelClass =
        "flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/80 font-robotoMono mb-2";

    return (
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-10 py-6">
            <Link href="/builder-pods" className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/80 hover:text-white/80 font-robotoMono mb-6 transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" />
                Builder Pods
            </Link>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-container rounded-2xl p-6 md:p-8 max-w-2xl mx-auto">
                <div className="flex items-center gap-3 mb-1">
                    <Trophy className="w-5 h-5 text-amber-400/80" />
                    <h2 className="text-xl font-black text-white font-unbounded tracking-tight">
                        Showcase Submission
                    </h2>
                </div>
                <p className="text-xs text-white/80 font-robotoMono mb-4">
                    Submit your project for a Regional Showcase event.
                </p>

                <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 mb-8">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-[10px] sm:text-xs text-amber-200/70 font-robotoMono leading-relaxed">
                        <strong className="text-amber-400">Disclaimer:</strong> Only the <span className="text-white">Pod Lead</span> (Project Creator) is authorized to submit the project for regional showcases.
                    </p>
                </div>

                {!walletAddress ? (
                    <div className="text-center py-8">
                        <p className="text-sm text-white/80 font-robotoMono">
                            Please connect your wallet to submit.
                        </p>
                    </div>
                ) : loading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-5 h-5 animate-spin text-white/50" />
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Showcase Event */}
                        <div>
                            <label className={labelClass}><Trophy className="w-3 h-3" />Showcase Event *</label>
                            <select required value={form.showcaseEventId} onChange={(e) => setForm((f) => ({ ...f, showcaseEventId: e.target.value }))} className={inputClass}>
                                <option value="" className="bg-[#0a0d12]">Select showcase</option>
                                {showcases.map((s) => (
                                    <option key={s._id} value={s._id} className="bg-[#0a0d12]">
                                        {s.name} — {s.city || s.regionSnapshot?.showcaseCity}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* College */}
                        <div>
                            <label className={labelClass}>College *</label>
                            <select
                                required
                                value={form.collegeSlug}
                                onChange={(e) => setForm((f) => ({ ...f, collegeSlug: e.target.value, projectId: "" }))}
                                className={inputClass}
                            >
                                <option value="" className="bg-[#0a0d12]">Select college</option>
                                {colleges.map((c) => (
                                    <option key={c.slug} value={c.slug} className="bg-[#0a0d12]">{c.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Project */}
                        <div>
                            <label className={labelClass}>
                                <FileText className="w-3 h-3" />
                                Project *
                            </label>
                            <select
                                required
                                value={form.projectId}
                                onChange={(e) => setForm((f) => ({ ...f, projectId: e.target.value }))}
                                className={inputClass}
                            >
                                <option value="" className="bg-[#0a0d12]">
                                    {form.collegeSlug ? "Select project from your pod" : "Select college first"}
                                </option>
                                {projects.map((p) => (
                                    <option key={p._id} value={p._id} className="bg-[#0a0d12]">
                                        {p.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* GitHub */}
                        <div>
                            <label className={labelClass}><Github className="w-3 h-3" />GitHub Repo *</label>
                            <input type="url" required value={form.githubRepo} onChange={(e) => setForm((f) => ({ ...f, githubRepo: e.target.value }))} placeholder="https://github.com/..." className={inputClass} />
                        </div>

                        {/* Demo Link */}
                        <div>
                            <label className={labelClass}><ExternalLink className="w-3 h-3" />Demo Link</label>
                            <input type="url" value={form.demoLink} onChange={(e) => setForm((f) => ({ ...f, demoLink: e.target.value }))} placeholder="https://..." className={inputClass} />
                        </div>

                        {/* Contract */}
                        <div>
                            <label className={labelClass}><Code2 className="w-3 h-3" />Contract Address</label>
                            <input type="text" value={form.contractAddress} onChange={(e) => setForm((f) => ({ ...f, contractAddress: e.target.value }))} placeholder="0x..." className={inputClass} />
                        </div>

                        {/* Pitch Deck */}
                        <div>
                            <label className={labelClass}><FileText className="w-3 h-3" />Pitch Deck URL</label>
                            <input type="url" value={form.pitchDeckUrl} onChange={(e) => setForm((f) => ({ ...f, pitchDeckUrl: e.target.value }))} placeholder="Cloudinary or Google Slides link" className={inputClass} />
                        </div>

                        {result && (
                            <div className={`flex items-start gap-2 p-4 rounded-xl border text-sm font-robotoMono ${result.success ? "bg-green-500/5 border-green-500/20 text-green-400" : "bg-red-500/5 border-red-500/20 text-red-400"}`}>
                                {result.success ? <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" /> : <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />}
                                {result.message}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={
                                submitting ||
                                !form.showcaseEventId ||
                                !form.collegeSlug ||
                                !form.projectId ||
                                !form.githubRepo
                            }
                            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-white text-black rounded-xl text-[11px] font-bold uppercase tracking-widest font-robotoMono transition-all hover:shadow-lg hover:shadow-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            {submitting ? <><Loader2 className="w-4 h-4 animate-spin" />Submitting...</> : "Submit to Showcase"}
                        </button>
                    </form>
                )}
            </motion.div>
        </div>
    );
}
