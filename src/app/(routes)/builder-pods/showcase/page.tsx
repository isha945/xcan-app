"use client";
import React, { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { motion } from "framer-motion";
import {
    ArrowLeft,
    Trophy,
    MapPin,
    Calendar,
    ExternalLink,
    Clock,
    CheckCircle2,
    FileText,
    ArrowRight,
    MonitorPlay,
    Download,
    Loader2,
    ShieldCheck,
} from "lucide-react";
import {
    formatPrizeAmount,
    formatShowcaseDate,
    getPrizeCurrency,
    getPrizePoolTotal,
} from "@/lib/builder-pods/showcase-details";

const fetcher = (url: string) =>
    fetch(url, { credentials: "include" }).then((r) => r.json());

const PATRAM_ORIGIN = "https://patram.lampros.tech";

/** Keep the stored certificate path/query, always open it on Patram. */
function toPatramCertificateUrl(storedUrl: string): string {
    try {
        const parsed = new URL(storedUrl, PATRAM_ORIGIN);
        return `${PATRAM_ORIGIN}${parsed.pathname}${parsed.search}${parsed.hash}`;
    } catch {
        return PATRAM_ORIGIN;
    }
}

function DownloadCertificateButton({ submissionId }: { submissionId: string }) {
    const [downloading, setDownloading] = useState(false);

    const handleDownload = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (downloading) return;
        setDownloading(true);
        try {
            const res = await fetch(
                `/api/builder-pods/showcases/${submissionId}/certificate`,
                { credentials: "include" },
            );
            if (!res.ok) {
                const data = await res.json().catch(() => null);
                alert(data?.error || "Unable to download certificate");
                return;
            }
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const disposition = res.headers.get("Content-Disposition");
            const match = disposition?.match(/filename="?([^"]+)"?/);
            const a = document.createElement("a");
            a.href = url;
            a.download = match?.[1] || "showcase-certificate.png";
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
        } catch {
            alert("Network error. Please try again.");
        } finally {
            setDownloading(false);
        }
    };

    return (
        <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="inline-flex items-center gap-1.5 self-start px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-[10px] font-bold font-robotoMono uppercase tracking-wider transition-all disabled:opacity-40"
        >
            {downloading ? (
                <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
                <Download className="w-3 h-3" />
            )}
            {downloading ? "Preparing..." : "Download Certificate"}
        </button>
    );
}

export default function ShowcasePage() {
    const { data, isLoading } = useSWR(
        "/api/builder-pods/showcases",
        fetcher
    );
    const apiShowcases = data?.showcases ?? [];
    const submissions = data?.userSubmissions ?? [];

    return (
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-10 py-6">
            <Link href="/builder-pods" className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/80 hover:text-white/80 font-robotoMono mb-6 transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" />
                Builder Pods
            </Link>

            {!isLoading && submissions.length > 0 && (
                <div className="mb-12">
                    <div className="flex items-center gap-3 mb-4">
                        <FileText className="w-4 h-4 text-blue-400/70" />
                        <h2 className="text-lg font-bold text-white font-unbounded tracking-tight">
                            Your Submissions
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {submissions.map((sub: any) => {
                            const showcase = apiShowcases.find((s: any) => String(s._id) === String(sub.showcaseEventId));
                            const href = showcase?.slug
                                ? `/builder-pods/showcase/${showcase.slug}`
                                : null;
                            const card = (
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="glass-container border-blue-500/10 rounded-2xl p-4 flex flex-col gap-3 h-full hover:border-white/15 transition-all"
                                >
                                    {href ? (
                                        <Link href={href} className="flex flex-col gap-3">
                                            <div className="flex justify-between items-start">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-[10px] font-bold text-blue-400 font-robotoMono uppercase tracking-wider">
                                                        {showcase?.name || "Showcase Request"}
                                                    </span>
                                                    <h3 className="text-sm font-bold text-white font-robotoMono truncate max-w-[200px]">
                                                        {sub.projectSnapshot.name}
                                                    </h3>
                                                </div>
                                                <div className={`px-2 py-1 rounded-lg flex items-center gap-1.5 text-[9px] font-bold font-robotoMono uppercase bg-white/5 ${sub.status === 'approved' ? 'text-green-400' :
                                                        sub.status === 'rejected' ? 'text-red-400' :
                                                            'text-yellow-400'
                                                    }`}>
                                                    {sub.status === 'pending' && <Clock className="w-3 h-3" />}
                                                    {sub.status === 'approved' && <CheckCircle2 className="w-3 h-3" />}
                                                    {sub.status === 'pending' ? 'Pending Approval' : sub.status}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 text-[10px] text-white/40 font-robotoMono">
                                                <div className="flex items-center gap-1">
                                                    <MapPin className="w-3 h-3" />
                                                    {showcase?.city || showcase?.regionSnapshot?.showcaseCity || "Location TBD"}
                                                </div>
                                            </div>
                                        </Link>
                                    ) : (
                                        <>
                                            <div className="flex justify-between items-start">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-[10px] font-bold text-blue-400 font-robotoMono uppercase tracking-wider">
                                                        {showcase?.name || "Showcase Request"}
                                                    </span>
                                                    <h3 className="text-sm font-bold text-white font-robotoMono truncate max-w-[200px]">
                                                        {sub.projectSnapshot.name}
                                                    </h3>
                                                </div>
                                                <div className={`px-2 py-1 rounded-lg flex items-center gap-1.5 text-[9px] font-bold font-robotoMono uppercase bg-white/5 ${sub.status === 'approved' ? 'text-green-400' :
                                                        sub.status === 'rejected' ? 'text-red-400' :
                                                            'text-yellow-400'
                                                    }`}>
                                                    {sub.status === 'pending' && <Clock className="w-3 h-3" />}
                                                    {sub.status === 'approved' && <CheckCircle2 className="w-3 h-3" />}
                                                    {sub.status === 'pending' ? 'Pending Approval' : sub.status}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 text-[10px] text-white/40 font-robotoMono">
                                                <div className="flex items-center gap-1">
                                                    <MapPin className="w-3 h-3" />
                                                    {showcase?.city || showcase?.regionSnapshot?.showcaseCity || "Location TBD"}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                    {(sub.patramCertificateUrl || sub.certificateClaimable) && (
                                        <div className="flex flex-wrap items-center gap-2">
                                            {sub.patramCertificateUrl && (
                                                <a
                                                    href={toPatramCertificateUrl(sub.patramCertificateUrl)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="inline-flex items-center gap-1.5 self-start px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[10px] font-bold font-robotoMono uppercase tracking-wider transition-all"
                                                >
                                                    <ShieldCheck className="w-3 h-3" />
                                                    On-chain Certificate
                                                </a>
                                            )}
                                        </div>
                                    )}
                                </motion.div>
                            );

                            return <div key={sub._id}>{card}</div>;
                        })}
                    </div>
                </div>
            )}

            <div className="flex items-center gap-3 mb-8">
                <Trophy className="w-5 h-5 text-yellow-400/70" />
                <h1 className="text-2xl font-black text-white font-unbounded tracking-tight">
                    Regional Showcases
                </h1>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="glass-container rounded-2xl p-6 animate-pulse">
                            <div className="h-5 w-40 bg-white/5 rounded-lg mb-3" />
                            <div className="h-4 w-24 bg-white/5 rounded-lg" />
                        </div>
                    ))}
                </div>
            ) : apiShowcases.length === 0 ? (
                <div className="glass-container rounded-2xl p-12 text-center">
                    <Trophy className="w-8 h-8 text-white/40 mx-auto mb-3" />
                    <p className="text-sm text-white/80 font-robotoMono">No showcases yet</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {apiShowcases.map((showcase: any, index: number) => (
                        <motion.div
                            key={showcase._id || showcase.slug}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                        >
                            <Link
                                href={`/builder-pods/showcase/${showcase.slug}`}
                                className="glass-container rounded-2xl p-6 hover:border-white/15 transition-all group block h-full"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                    {showcase.subtitle && (
                                        <p className="text-[9px] font-bold uppercase tracking-wider text-yellow-400/80 font-robotoMono mb-1.5">
                                            {showcase.subtitle}
                                        </p>
                                    )}
                                        <h3 className="text-sm font-bold text-white font-robotoMono mb-1.5 group-hover:text-blue-300 transition-colors">
                                            {showcase.name}
                                        </h3>
                                        <div className="flex items-center gap-1.5 text-[10px] text-white/50 font-robotoMono">
                                            <MapPin className="w-3 h-3" />
                                            {showcase.city}
                                        </div>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold font-robotoMono ${showcase.status === 'completed'
                                        ? 'bg-green-500/10 text-green-400'
                                        : showcase.status === 'open' || showcase.status === 'live'
                                            ? 'bg-blue-500/10 text-blue-400'
                                            : 'bg-white/5 text-white/50'
                                        }`}>
                                        {showcase.status}
                                    </span>
                                </div>

                                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] text-white/45 font-robotoMono mb-4">
                                    {showcase.date && (
                                    <div className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {formatShowcaseDate(showcase.date)}
                                    </div>
                                    )}
                                    {showcase.time && (
                                    <div className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {showcase.time}
                                    </div>
                                    )}
                                    {showcase.format && (
                                    <div className="flex items-center gap-1">
                                        <MonitorPlay className="w-3 h-3" />
                                        {showcase.format}
                                    </div>
                                    )}
                                    {showcase.prizePool && getPrizePoolTotal(showcase.prizePool) > 0 && (
                                        <div className="flex items-center gap-1">
                                            <Trophy className="w-3 h-3 text-yellow-400/60" />
                                            {formatPrizeAmount(getPrizePoolTotal(showcase.prizePool), getPrizeCurrency(showcase.prizePool))} prize
                                        </div>
                                    )}
                                </div>

                                <div className="inline-flex items-center gap-1.5 text-blue-400 text-[10px] font-bold font-robotoMono group-hover:gap-2.5 transition-all">
                                    View details
                                    <ArrowRight className="w-3 h-3" />
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            )}

            {!isLoading && apiShowcases.some((s: any) => s.status === 'open') && (
                <div className="mt-8">
                    <Link
                        href="/builder-pods/showcase-submit"
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-[10px] font-bold font-robotoMono transition-all"
                    >
                        <ExternalLink className="w-3 h-3" />
                        Submit Entry
                    </Link>
                </div>
            )}
        </div>
    );
}
