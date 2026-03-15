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
    <div className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div className="mb-3 flex items-center gap-2 text-xs text-slate-500">
        <svg
          className="h-4 w-4 text-slate-400"
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
        <span>Found {sources.length} web sources</span>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {sources.map((source) => {
          const domain = getDomain(source.url);
          const faviconUrl =
            source.favicon ??
            `https://www.google.com/s2/favicons?domain=${domain}&sz=16`;

          return (
            <div
              key={source.url}
              className="flex w-28 flex-shrink-0 cursor-default flex-col gap-1 rounded-lg border border-slate-200 bg-white p-2"
            >
              <img
                src={faviconUrl}
                alt=""
                className="h-4 w-4"
              />
              <div className="line-clamp-2 text-xs font-medium text-slate-700">
                {source.title}
              </div>
              <div className="truncate text-xs text-slate-400">{domain}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
