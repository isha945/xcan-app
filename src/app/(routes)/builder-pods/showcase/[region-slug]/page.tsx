"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Trophy,
  MapPin,
  Calendar,
  Clock,
  MonitorPlay,
  Users,
  ExternalLink,
  CheckCircle2,
  Target,
  Github,
  Code2,
  FileText,
  Loader2,
  Layers,
  X,
  User,
} from "lucide-react";
import {
  formatPrizeAmount,
  formatShowcaseDate,
  getPrizeAmount,
  getPrizeCurrency,
  getPrizePoolTotal,
  type PublicShowcase,
} from "@/lib/builder-pods/showcase-details";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const statusStyles: Record<string, string> = {
  upcoming: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  open: "bg-green-500/10 text-green-400 border-green-500/20",
  live: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  judging: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  completed: "bg-white/5 text-white/60 border-white/10",
};

const submissionStatusStyles: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  approved: "bg-green-500/10 text-green-400 border-green-500/20",
  finalist: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  winner: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  special_mention: "bg-blue-500/10 text-blue-400 border-blue-500/20",
};

export default function ShowcaseDetailPage() {
  const params = useParams();
  const regionSlug = params["region-slug"] as string;

  const { data, isLoading } = useSWR("/api/builder-pods/showcases", fetcher);
  const showcase: PublicShowcase | undefined = data?.showcases?.find(
    (s: PublicShowcase) => s.slug === regionSlug
  );

  const { data: submissionsData, isLoading: submissionsLoading } = useSWR(
    showcase ? `/api/builder-pods/showcases/${showcase.slug}/submissions` : null,
    fetcher,
  );
  const submissions = submissionsData?.submissions ?? [];
  const [selected, setSelected] = useState<any | null>(null);

  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);

  if (isLoading) {
    return (
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-10 py-6">
        <Link
          href="/builder-pods/showcase"
          className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/80 hover:text-white font-robotoMono mb-6 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          All Showcases
        </Link>
        <div className="space-y-4">
          <div className="h-8 w-64 bg-white/5 rounded-lg animate-pulse" />
          <div className="h-4 w-48 bg-white/5 rounded-lg animate-pulse" />
          <div className="h-72 bg-white/5 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!showcase) {
    return (
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-10 py-6">
        <Link
          href="/builder-pods/showcase"
          className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/80 hover:text-white font-robotoMono mb-6 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          All Showcases
        </Link>
        <div className="glass-container rounded-2xl p-12 text-center">
          <Trophy className="w-8 h-8 text-white/40 mx-auto mb-3" />
          <p className="text-sm text-white/80 font-robotoMono mb-2">
            Showcase not found
          </p>
          <p className="text-[11px] text-white/45 font-robotoMono">
            No event details are configured for “{regionSlug}”.
          </p>
        </div>
      </div>
    );
  }

  const hasJoinLink = Boolean(showcase.joinLink?.trim());

  return (
    <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-10 py-6">
      <Link
        href="/builder-pods/showcase"
        className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/80 hover:text-white font-robotoMono mb-6 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        All Showcases
      </Link>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mb-8"
      >
        <div className="flex flex-wrap items-center gap-3 mb-3">
          {showcase.subtitle && (
          <span className="px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider font-robotoMono bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
            {showcase.subtitle}
          </span>
          )}
          <span
            className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider font-robotoMono border ${statusStyles[showcase.status] || statusStyles.upcoming}`}
          >
            {showcase.status}
          </span>
        </div>

        <h1 className="text-2xl md:text-3xl font-black text-white font-unbounded tracking-tight mb-2">
          {showcase.name}
        </h1>
        {showcase.tagline && (
        <p className="text-xs md:text-sm text-white/55 font-robotoMono max-w-3xl leading-relaxed mb-4">
          {showcase.tagline}
        </p>
        )}

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] text-white/60 font-robotoMono">
          {showcase.city && (
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-blue-400/70" />
            {showcase.city}
          </span>
          )}
          {showcase.date && (
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-blue-400/70" />
            {formatShowcaseDate(showcase.date)}{showcase.day ? ` · ${showcase.day}` : ""}
          </span>
          )}
          {showcase.time && (
          <span className="inline-flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-blue-400/70" />
            {showcase.time}
          </span>
          )}
          {showcase.format && (
          <span className="inline-flex items-center gap-1.5">
            <MonitorPlay className="w-3.5 h-3.5 text-blue-400/70" />
            {showcase.format}
          </span>
          )}
          {showcase.podsPresenting > 0 && (
          <span className="inline-flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-blue-400/70" />
            {showcase.podsPresenting} pods presenting
          </span>
          )}
        </div>
      </motion.div>

      <div className={`grid grid-cols-1 ${showcase.poster ? "xl:grid-cols-[1.15fr_0.85fr]" : ""} gap-6 mb-8 items-start`}>
        {showcase.poster ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="rounded-2xl overflow-hidden border border-white/10 leading-none"
        >
          <Image
            src={showcase.poster}
            alt={`${showcase.name} poster`}
            width={1200}
            height={1500}
            className="w-full h-auto block"
            priority
            sizes="(max-width: 1280px) 100vw, 55vw"
          />
        </motion.div>
        ) : null}

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="space-y-4"
        >
          <div className="glass-container rounded-2xl p-5 md:p-6 border border-blue-500/15">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/50 font-robotoMono mb-4">
              Date & Time
            </h2>
            <div className="grid grid-cols-2 gap-3 mb-5">
              <FactCard
                icon={Calendar}
                label="Date"
                value={formatShowcaseDate(showcase.date)}
              />
              <FactCard icon={Clock} label="Day" value={showcase.day || "TBD"} />
              <FactCard icon={Clock} label="Time" value={showcase.time || "TBD"} />
              <FactCard
                icon={MonitorPlay}
                label="Format"
                value={showcase.format}
              />
            </div>

            {hasJoinLink ? (
              <a
                href={showcase.joinLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 text-blue-100 text-md font-bold font-robotoMono transition-all border border-blue-500/20"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                {showcase.joinLinkLabel || "Join Showcase"}
              </a>
            ) : (
              <div className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/5 text-white/45 text-xs font-bold font-robotoMono border border-white/10">
                Join link will be shared soon
              </div>
            )}
          </div>

          {showcase.prizePool && getPrizePoolTotal(showcase.prizePool) > 0 && (
          <div className="glass-container rounded-2xl p-5 md:p-6 border border-yellow-500/15">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-4 h-4 text-yellow-400/80" />
              <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-yellow-400/80 font-robotoMono">
                Prize Pool · {formatPrizeAmount(getPrizePoolTotal(showcase.prizePool), getPrizeCurrency(showcase.prizePool))}
              </h2>
            </div>
            <div className="space-y-2">
              {(showcase.prizePool.breakdown || []).map((prize) => (
                <div
                  key={prize.place}
                  className="flex items-center justify-between rounded-xl bg-white/[0.03] border border-white/5 px-3 py-2.5"
                >
                  <span className="text-[11px] text-white/70 font-robotoMono">
                    {prize.place}
                  </span>
                  <span className="text-sm font-black text-yellow-400/90 font-unbounded">
                    {formatPrizeAmount(getPrizeAmount(prize), getPrizeCurrency(showcase.prizePool))}
                  </span>
                </div>
              ))}
            </div>
          </div>
          )}

          <div className="glass-container rounded-2xl p-5 md:p-6">
            <p className="text-[10px] text-white/45 font-robotoMono uppercase tracking-wider mb-2">
              Presented by
            </p>
            <p className="text-sm font-bold text-white font-robotoMono mb-3">
              {showcase.presentedBy}
            </p>
            <p className="text-[10px] text-white/45 font-robotoMono uppercase tracking-wider mb-2">
              In partnership with
            </p>
            <p className="text-xs text-white/75 font-robotoMono">
              {showcase.partners.join(" · ")}
            </p>
          </div>
        </motion.div>
      </div>

      {/* Submitted Projects */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.12 }}
        className="mb-10"
      >
        <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Layers className="w-4 h-4 text-blue-400/80" />
              <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/50 font-robotoMono">
                Submitted Projects
              </h2>
            </div>
            <p className="text-sm text-white/70 font-robotoMono">
              Projects entered for the {showcase.city} showcase
            </p>
          </div>
          {!submissionsLoading && (
            <span className="px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider font-robotoMono bg-blue-500/10 text-blue-300 border border-blue-500/20">
              {submissions.length}{" "}
              {submissions.length === 1 ? "project" : "projects"}
            </span>
          )}
        </div>

        {submissionsLoading ? (
          <div className="glass-container rounded-2xl p-10 flex items-center justify-center gap-2 text-white/50">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-xs font-robotoMono">Loading projects…</span>
          </div>
        ) : submissions.length === 0 ? (
          <div className="glass-container rounded-2xl p-10 text-center border border-dashed border-white/10">
            <FileText className="w-7 h-7 text-white/30 mx-auto mb-3" />
            <p className="text-sm text-white/60 font-robotoMono mb-1">
              No projects submitted yet
            </p>
            <p className="text-[11px] text-white/35 font-robotoMono">
              Entries will appear here once pods submit to this showcase.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {submissions.map((sub: any, index: number) => (
              <motion.article
                key={sub._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.3,
                  delay: Math.min(index * 0.04, 0.3),
                }}
                role="button"
                tabIndex={0}
                onClick={() => setSelected(sub)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelected(sub);
                  }
                }}
                className="glass-container rounded-2xl p-5 border border-white/5 hover:border-blue-500/25 transition-all flex flex-col gap-4 text-left cursor-pointer"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-blue-400/80 font-robotoMono mb-1.5 truncate">
                      {sub.collegeSnapshot?.podName ||
                        sub.collegeSnapshot?.name ||
                        "Builder Pod"}
                    </p>
                    <h3 className="text-sm font-bold text-white font-robotoMono leading-snug line-clamp-2">
                      {sub.projectSnapshot?.name || "Untitled Project"}
                    </h3>
                  </div>
                  <span
                    className={`shrink-0 px-2 py-0.5 rounded-full text-[8px] font-bold font-robotoMono uppercase border ${
                      submissionStatusStyles[sub.status] ||
                      submissionStatusStyles.pending
                    }`}
                  >
                    {String(sub.status || "pending").replaceAll("_", " ")}
                  </span>
                </div>

                {sub.projectSnapshot?.problemStatement ? (
                  <p className="text-[11px] text-white/45 font-robotoMono leading-relaxed line-clamp-3">
                    {sub.projectSnapshot.problemStatement}
                  </p>
                ) : (
                  <p className="text-[11px] text-white/30 font-robotoMono italic">
                    {sub.collegeSnapshot?.name}
                  </p>
                )}

                <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
                  {sub.githubRepo && (
                    <a
                      href={sub.githubRepo}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-bold text-white/70 hover:text-white font-robotoMono transition-all border border-white/10"
                    >
                      <Github className="w-3 h-3" />
                      GitHub
                    </a>
                  )}
                  {sub.demoLink && (
                    <a
                      href={sub.demoLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-[10px] font-bold text-blue-300 font-robotoMono transition-all border border-blue-500/15"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Demo
                    </a>
                  )}
                  {sub.contractAddress && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 text-[10px] font-bold text-white/40 font-robotoMono border border-white/10 truncate max-w-[140px]">
                      <Code2 className="w-3 h-3 shrink-0" />
                      {sub.contractAddress.slice(0, 6)}…
                      {sub.contractAddress.slice(-4)}
                    </span>
                  )}
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </motion.section>

      {/* Colleges */}
      {showcase.colleges?.length > 0 && (
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.15 }}
        className="mb-8"
      >
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-4 h-4 text-blue-400/70" />
          <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/50 font-robotoMono">
            Colleges Joining ({showcase.colleges.length})
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {showcase.colleges.map((college, index) => {
            const card = (
              <div className="glass-container rounded-2xl p-4 h-full hover:border-blue-500/25 transition-all">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="text-base font-black text-white font-unbounded tracking-tight">
                    {college.shortName}
                  </h3>
                  <span className="shrink-0 px-2 py-0.5 rounded-full text-[9px] font-bold font-robotoMono uppercase bg-blue-500/10 text-blue-400 border border-blue-500/15">
                    Pod {index + 1}
                  </span>
                </div>
                <p className="text-[11px] text-white/55 font-robotoMono mb-2 line-clamp-2">
                  {college.name}
                </p>
                <div className="flex items-center gap-1.5 text-[10px] text-white/45 font-robotoMono">
                  <MapPin className="w-3 h-3" />
                  {college.city}
                </div>
              </div>
            );

            if (college.collegeSlug) {
              return (
                <Link
                  key={college.shortName}
                  href={`/builder-pods/${college.collegeSlug}`}
                  className="block"
                >
                  {card}
                </Link>
              );
            }

            return <div key={college.shortName}>{card}</div>;
          })}
        </div>
      </motion.section>
      )}

      {/* Outcomes */}
      {showcase.outcomes?.length > 0 && (
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.2 }}
        className="mb-8"
      >
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-4 h-4 text-green-400/70" />
          <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/50 font-robotoMono">
            Outcomes
          </h2>
        </div>
        <div className="glass-container rounded-2xl p-5 md:p-6 space-y-3 max-w-3xl">
          {showcase.outcomes.map((outcome) => (
            <div key={outcome} className="flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-green-400/70 shrink-0 mt-0.5" />
              <p className="text-[12px] text-white/70 font-robotoMono leading-relaxed">
                {outcome}
              </p>
            </div>
          ))}
        </div>
      </motion.section>
      )}

      {showcase.description && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.35, delay: 0.25 }}
          className="text-[11px] text-white/40 font-robotoMono leading-relaxed max-w-3xl"
        >
          {showcase.description}
        </motion.p>
      )}

      <AnimatePresence>
        {selected && (
          <ProjectDetailModal
            submission={selected}
            onClose={() => setSelected(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function getTeamMembers(submission: any) {
  const members = submission?.projectId?.teamMembers;
  if (Array.isArray(members) && members.length > 0) return members;
  return [];
}

function ProjectDetailModal({
  submission,
  onClose,
}: {
  submission: any;
  onClose: () => void;
}) {
  const project = submission.projectId || {};
  const name =
    submission.projectSnapshot?.name || project.name || "Untitled Project";
  const problem =
    submission.projectSnapshot?.problemStatement ||
    project.problemStatement ||
    "";
  const podName =
    submission.collegeSnapshot?.podName ||
    submission.collegeSnapshot?.name ||
    "Builder Pod";
  const collegeName = submission.collegeSnapshot?.name;
  const github = submission.githubRepo || project.githubRepo;
  const demo = submission.demoLink || project.demoLink;
  const contract = submission.contractAddress || project.contractAddress;
  const pitchDeck = submission.pitchDeckUrl;
  const techStack: string[] = Array.isArray(project.techStack)
    ? project.techStack
    : [];
  const team = getTeamMembers(submission);
  const statusLabel = String(submission.status || "pending").replaceAll(
    "_",
    " ",
  );

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={name}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.97 }}
        transition={{ duration: 0.22 }}
        className="glass-container w-full max-w-xl max-h-[88vh] overflow-y-auto rounded-2xl p-6 md:p-7 border border-white/10"
      >
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="min-w-0">
            <p className="text-[9px] font-bold uppercase tracking-wider text-blue-400/80 font-robotoMono mb-1.5">
              {podName}
            </p>
            <h3 className="text-lg font-black text-white font-unbounded tracking-tight leading-snug">
              {name}
            </h3>
            {collegeName && collegeName !== podName && (
              <p className="mt-1.5 text-[11px] text-white/45 font-robotoMono">
                {collegeName}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span
              className={`px-2 py-0.5 rounded-full text-[8px] font-bold font-robotoMono uppercase border ${
                submissionStatusStyles[submission.status] ||
                submissionStatusStyles.pending
              }`}
            >
              {statusLabel}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4 text-white/50" />
            </button>
          </div>
        </div>

        {problem ? (
          <div className="mb-5">
            <p className="text-[9px] font-bold uppercase tracking-widest text-white/35 font-robotoMono mb-2">
              About
            </p>
            <p className="text-[13px] text-white/70 font-robotoMono leading-relaxed whitespace-pre-wrap">
              {problem}
            </p>
          </div>
        ) : null}

        {techStack.length > 0 && (
          <div className="mb-5">
            <p className="text-[9px] font-bold uppercase tracking-widest text-white/35 font-robotoMono mb-2">
              Tech Stack
            </p>
            <div className="flex flex-wrap gap-1.5">
              {techStack.map((tech) => (
                <span
                  key={tech}
                  className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold text-white/70 font-robotoMono"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        )}

        {team.length > 0 && (
          <div className="mb-5">
            <p className="text-[9px] font-bold uppercase tracking-widest text-white/35 font-robotoMono mb-2">
              Team ({team.length})
            </p>
            <div className="space-y-2">
              {team.map((member: any) => (
                <div
                  key={member.walletAddress || member.name}
                  className="flex items-center justify-between gap-3 rounded-xl bg-white/[0.03] border border-white/5 px-3 py-2.5"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                      <User className="w-3.5 h-3.5 text-blue-400/80" />
                    </div>
                    <span className="text-[12px] font-bold text-white font-robotoMono truncate">
                      {member.name || "Team member"}
                    </span>
                  </div>
                  <span className="shrink-0 text-[8px] font-bold uppercase tracking-wider text-white/40 font-robotoMono">
                    {member.role === "team_leader" ? "Lead" : "Member"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 pt-1">
          {github && (
            <a
              href={github}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-bold text-white/70 hover:text-white font-robotoMono transition-all border border-white/10"
            >
              <Github className="w-3.5 h-3.5" />
              GitHub
            </a>
          )}
          {demo && (
            <a
              href={demo}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-[10px] font-bold text-blue-300 font-robotoMono transition-all border border-blue-500/15"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Demo
            </a>
          )}
          {pitchDeck && (
            <a
              href={pitchDeck}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-bold text-white/70 hover:text-white font-robotoMono transition-all border border-white/10"
            >
              <FileText className="w-3.5 h-3.5" />
              Pitch Deck
            </a>
          )}
          {contract && (
            <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 text-[10px] font-bold text-white/40 font-robotoMono border border-white/10 break-all">
              <Code2 className="w-3.5 h-3.5 shrink-0" />
              {contract}
            </span>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function FactCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-white/[0.03] border border-white/5 p-3">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon className="w-3 h-3 text-blue-400/70" />
        <span className="text-[9px] font-bold uppercase tracking-wider text-blue-400/70 font-robotoMono">
          {label}
        </span>
      </div>
      <p className="text-[11px] font-bold text-white font-robotoMono leading-snug">
        {value}
      </p>
    </div>
  );
}
