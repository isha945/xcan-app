import showcasesData from "@/data/builder-pods/showcases.json";

export interface ShowcaseCollege {
  shortName: string;
  name: string;
  city: string;
  collegeSlug: string | null;
}

export interface ShowcaseAgendaItem {
  time: string;
  title: string;
  description: string;
}

export type ShowcaseCurrency = "USD" | "INR";

export interface ShowcasePrizeBreakdown {
  place: string;
  amountUsd?: number;
  amount?: number;
}

export interface ShowcaseJudgingCriterion {
  title: string;
  description: string;
}

export type ShowcaseStatus =
  | "upcoming"
  | "open"
  | "live"
  | "judging"
  | "completed";

export interface ShowcaseDetails {
  slug: string;
  name: string;
  subtitle: string;
  tagline: string;
  city: string;
  region: string;
  status: ShowcaseStatus;
  date: string;
  day: string;
  time: string;
  timeStart: string;
  timeEnd: string;
  timezone: string;
  format: string;
  podsPresenting: number;
  venue: string | null;
  poster: string;
  infoBanner: string;
  joinLink: string;
  joinLinkLabel: string;
  presentedBy: string;
  partners: string[];
  prizePool: {
    currency?: ShowcaseCurrency;
    totalUsd?: number;
    total?: number;
    breakdown: ShowcasePrizeBreakdown[];
  };
  colleges: ShowcaseCollege[];
  agenda: ShowcaseAgendaItem[];
  outcomes: string[];
  judgingCriteria: ShowcaseJudgingCriterion[];
  description: string;
}

export interface PublicShowcase extends ShowcaseDetails {
  _id: string;
}

export interface ShowcaseEventLike {
  _id: unknown;
  slug?: string | null;
  name?: string;
  subtitle?: string | null;
  tagline?: string | null;
  city?: string;
  regionId?: unknown;
  regionSnapshot?: { name?: string; showcaseCity?: string } | null;
  eventDate?: string | Date | null;
  eventTime?: string | null;
  venue?: string | null;
  status?: string | null;
  format?: string | null;
  poster?: string | null;
  joinLink?: string | null;
  joinLinkLabel?: string | null;
  description?: string | null;
  prizePoolUsd?: number | null;
  prizeCurrency?: ShowcaseCurrency | null;
}

export interface RegionCollegeLike {
  name: string;
  slug?: string | null;
  city?: string | null;
  podName?: string | null;
  regionId?: unknown;
}

const catalog = showcasesData.showcases as ShowcaseDetails[];

export function getAllShowcaseDetails(): ShowcaseDetails[] {
  return catalog;
}

export function getShowcaseDetailsBySlug(
  slug: string
): ShowcaseDetails | undefined {
  const normalized = slug?.toLowerCase()?.trim();
  if (!normalized) return undefined;
  return catalog.find((s) => s.slug === normalized);
}

export function getShowcaseDetailsByCity(
  city: string
): ShowcaseDetails | undefined {
  const normalized = city?.toLowerCase()?.trim();
  if (!normalized) return undefined;
  return catalog.find(
    (s) =>
      s.city.toLowerCase() === normalized ||
      s.region.toLowerCase().includes(normalized)
  );
}

export function slugifyShowcase(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function isoDateOnly(value?: string | Date | null): string {
  if (!value) return "";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.slice(0, 10);
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

export function weekdayFromDate(date: string): string {
  if (!date) return "";
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleDateString("en-IN", { weekday: "long" });
}

export function formatShowcaseDate(date: string): string {
  if (!date) return "Date TBD";
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function getPrizeCurrency(
  prizePool: ShowcaseDetails["prizePool"]
): ShowcaseCurrency {
  return prizePool.currency === "INR" ? "INR" : "USD";
}

export function getPrizePoolTotal(
  prizePool: ShowcaseDetails["prizePool"]
): number {
  return prizePool.total ?? prizePool.totalUsd ?? 0;
}

export function getPrizeAmount(item: ShowcasePrizeBreakdown): number {
  return item.amount ?? item.amountUsd ?? 0;
}

export function formatPrizeAmount(
  amount: number,
  currency: ShowcaseCurrency = "USD"
): string {
  if (currency === "INR") {
    return `₹${amount.toLocaleString("en-IN")}`;
  }
  return `$${amount.toLocaleString()}`;
}

function matchCatalogExtras(event: ShowcaseEventLike): ShowcaseDetails | undefined {
  const storedSlug = event.slug?.toLowerCase()?.trim();
  if (storedSlug) {
    const bySlug = getShowcaseDetailsBySlug(storedSlug);
    if (bySlug) return bySlug;
  }
  const city = event.city || event.regionSnapshot?.showcaseCity || "";
  if (!city) return undefined;
  const date = isoDateOnly(event.eventDate);
  const cityMatches = catalog.filter(
    (s) =>
      s.city.toLowerCase() === city.toLowerCase() ||
      s.region.toLowerCase().includes(city.toLowerCase())
  );
  if (date) {
    const dated = cityMatches.find((s) => s.date === date);
    if (dated) return dated;
  }
  return cityMatches[0];
}

function collegesFromRegion(
  event: ShowcaseEventLike,
  regionColleges: RegionCollegeLike[]
): ShowcaseCollege[] {
  const regionId = event.regionId?.toString?.();
  if (!regionId) return [];
  return regionColleges
    .filter((c) => c.regionId?.toString?.() === regionId)
    .map((c) => ({
      shortName: c.podName || c.name,
      name: c.name,
      city: c.city || "",
      collegeSlug: c.slug || null,
    }));
}

export function buildPublicShowcases(
  events: ShowcaseEventLike[],
  regionColleges: RegionCollegeLike[] = []
): PublicShowcase[] {
  const used = new Set<string>();

  return events.map((event) => {
    const extras = matchCatalogExtras(event);
    const fallbackColleges = collegesFromRegion(event, regionColleges);
    const date = isoDateOnly(event.eventDate) || extras?.date || "";
    const city = event.city || extras?.city || "";

    let slug =
      event.slug?.trim() ||
      extras?.slug ||
      slugifyShowcase(city) ||
      String(event._id);
    slug = slug.toLowerCase();
    if (used.has(slug)) {
      slug = date
        ? `${slug}-${date}`
        : `${slug}-${String(event._id).slice(-6)}`;
    }
    used.add(slug);

    const amount = event.prizePoolUsd ?? 0;
    const prizeFromDb: ShowcaseDetails["prizePool"] =
      event.prizeCurrency === "INR"
        ? { currency: "INR", total: amount, breakdown: extras?.prizePool?.breakdown ?? [] }
        : { currency: "USD", totalUsd: amount, breakdown: extras?.prizePool?.breakdown ?? [] };

    return {
      _id: String(event._id),
      slug,
      name: event.name || extras?.name || "Showcase",
      subtitle:
        event.subtitle || extras?.subtitle || event.regionSnapshot?.name || "",
      tagline: event.tagline || extras?.tagline || "",
      city,
      region:
        event.regionSnapshot?.name || extras?.region || "",
      status: (event.status || extras?.status || "upcoming") as ShowcaseStatus,
      date,
      day: extras?.day || weekdayFromDate(date),
      time: event.eventTime || extras?.time || "",
      timeStart: extras?.timeStart || "",
      timeEnd: extras?.timeEnd || "",
      timezone: extras?.timezone || "Asia/Kolkata",
      format: event.format || extras?.format || (event.venue ? "In person" : "Virtual"),
      podsPresenting:
        extras?.podsPresenting ||
        extras?.colleges?.length ||
        fallbackColleges.length,
      venue: event.venue ?? extras?.venue ?? null,
      poster: event.poster || extras?.poster || "",
      infoBanner: extras?.infoBanner || "",
      joinLink: event.joinLink || extras?.joinLink || "",
      joinLinkLabel:
        event.joinLinkLabel || extras?.joinLinkLabel || "Join Showcase",
      presentedBy: extras?.presentedBy || "Lampros DAO",
      partners: extras?.partners?.length ? extras.partners : ["Arbitrum", "Ethereum"],
      prizePool: extras?.prizePool || prizeFromDb,
      colleges:
        extras?.colleges?.length ? extras.colleges : fallbackColleges,
      agenda: extras?.agenda || [],
      outcomes: extras?.outcomes || [],
      judgingCriteria: extras?.judgingCriteria || [],
      description: event.description || extras?.description || "",
    };
  });
}
