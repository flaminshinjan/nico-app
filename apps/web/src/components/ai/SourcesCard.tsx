import type { SerpResult } from "@/hooks/useSerpSearch";

type SourcesCardProps = {
  sources: SerpResult[];
};

function getDomain(url: string) {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

export function SourcesCard({ sources }: SourcesCardProps) {
  return (
    <div className="w-full">
      <div className="flex items-center gap-1.5 mb-2">
        <svg
          className="w-3.5 h-3.5 text-content-tertiary"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.75}
            d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM3.6 9h16.8M3.6 15h16.8M12 3c2.3 2.4 3.6 5.6 3.6 9S14.3 18.6 12 21c-2.3-2.4-3.6-5.6-3.6-9S9.7 5.4 12 3Z"
          />
        </svg>
        <span className="text-[11px] text-content-tertiary">
          Found {sources.length} web sources
        </span>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {sources.map((source) => {
          const domain = getDomain(source.url);
          const faviconUrl =
            source.favicon ??
            `https://www.google.com/s2/favicons?domain=${domain}&sz=16`;
          return (
            <div
              key={source.url}
              className="flex-shrink-0 flex flex-col gap-1 p-2 rounded-md bg-canvas-hover hover:bg-canvas-active transition-all cursor-default"
              style={{ width: 96, height: 56, transition: "transform 0.15s ease, background 0.15s ease" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"; }}
            >
              <img src={faviconUrl} alt="" className="w-3 h-3 rounded-full" />
              <div className="text-[10px] font-sans text-content-tertiary truncate">
                {domain}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
