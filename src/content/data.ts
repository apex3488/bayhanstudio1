export const serviceIds = ["web", "bots", "mobile", "design", "crm", "ai"] as const;
export type ServiceId = (typeof serviceIds)[number];

export type PlateKind = ServiceId | "tholos";

export const numerals = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"] as const;

/** "live" — a working product or site; "demo" — a working demo version. */
export type ProjectStatus = "live" | "demo";

export type ProjectMeta = {
  slug: ProjectSlug;
  status: ProjectStatus;
  /** Screenshot of the live project, stored in /public/work. */
  image: string;
  url: string;
  host: string;
  /** Platforms, exactly as listed in the studio portfolio. */
  tags: string[];
};

export type ProjectSlug = "bayhan-game" | "pitstop" | "vendo" | "bayhan-studio";

export const projects: ProjectMeta[] = [
  {
    slug: "bayhan-game",
    status: "live",
    image: "/work/bayhan-game.jpg",
    url: "https://bayhangame1.vercel.app/",
    host: "bayhangame1.vercel.app",
    tags: ["Browser", "Telegram Bot", "Mini App"],
  },
  {
    slug: "pitstop",
    status: "live",
    image: "/work/pitstop.jpg",
    url: "https://apex3488.github.io/pitstop/",
    host: "apex3488.github.io/pitstop",
    tags: ["Web"],
  },
  {
    slug: "vendo",
    status: "demo",
    image: "/work/vendo.jpg",
    url: "https://vendo-gamma.vercel.app/",
    host: "vendo-gamma.vercel.app",
    tags: ["Web", "Mobile web"],
  },
  {
    slug: "bayhan-studio",
    status: "live",
    image: "/work/bayhan-studio.jpg",
    url: "https://apex3488.github.io/bayhanstudio1/",
    host: "apex3488.github.io/bayhanstudio1",
    tags: ["Web", "E-commerce", "Telegram Bots"],
  },
];

export function getProject(slug: string): ProjectMeta | undefined {
  return projects.find((p) => p.slug === slug);
}
