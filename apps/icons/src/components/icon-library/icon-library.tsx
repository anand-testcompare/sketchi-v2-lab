import { useMemo, useState } from "react";

export interface IconLibraryProps {
  data?: IconLibraryData | undefined;
  errorMessage?: string | undefined;
  initialCollection?: string;
  initialFlaggedOnly?: boolean;
  initialQuery?: string;
  status?: "error" | "loading" | "ready";
}

export interface IconLibraryData {
  generatedAt?: string;
  icons: readonly SketchiIcon[];
  summary: {
    collectionCounts: Record<string, number>;
    flagCounts?: Record<string, number>;
    totalIcons: number;
  };
}

export interface SketchiIcon {
  bytes: number;
  collection: string;
  fileName: string;
  flags: readonly string[];
  id: string;
  slug: string;
  urlPath: string;
}

const emptyData: IconLibraryData = {
  icons: [],
  summary: {
    collectionCounts: {},
    totalIcons: 0,
  },
};

function formatCollectionLabel(collection: string): string {
  return collection
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function IconLibrary({
  data = emptyData,
  errorMessage,
  initialCollection = "all",
  initialFlaggedOnly = false,
  initialQuery = "",
  status = "ready",
}: IconLibraryProps) {
  const [query, setQuery] = useState(initialQuery);
  const [collection, setCollection] = useState(initialCollection);
  const [flaggedOnly, setFlaggedOnly] = useState(initialFlaggedOnly);
  const collections = useMemo(
    () =>
      Object.entries(data.summary.collectionCounts).sort(([a], [b]) =>
        a.localeCompare(b),
      ),
    [data],
  );
  const normalizedQuery = query.trim().toLowerCase();
  const filteredIcons = useMemo(
    () =>
      data.icons.filter((icon) => {
        const matchesCollection =
          collection === "all" || icon.collection === collection;
        const matchesQuery =
          normalizedQuery.length === 0 ||
          icon.slug.toLowerCase().includes(normalizedQuery) ||
          icon.collection.toLowerCase().includes(normalizedQuery);
        const matchesFlag = !flaggedOnly || icon.flags.length > 0;

        return matchesCollection && matchesQuery && matchesFlag;
      }),
    [collection, data, flaggedOnly, normalizedQuery],
  );
  const visibleIcons = filteredIcons.slice(0, 120);
  const flaggedCount = Object.values(data.summary.flagCounts ?? {}).reduce(
    (sum, count) => sum + count,
    0,
  );

  return (
    <main className="sketchi-icons">
      <header className="sketchi-icons__header">
        <div className="sketchi-icons__title">
          <p className="sketchi-icons__eyebrow">Sketchi Icons</p>
          <h1>Curated icon output</h1>
        </div>
        <div className="sketchi-icons__summary" aria-label="Icon summary">
          <span>{data.summary.totalIcons.toLocaleString()} icons</span>
          <span>{collections.length.toLocaleString()} collections</span>
          <span>{flaggedCount.toLocaleString()} review flags</span>
        </div>
      </header>

      <section className="sketchi-icons__toolbar" aria-label="Icon filters">
        <label className="sketchi-icons__field">
          Search icons
          <input
            onChange={(event) => setQuery(event.currentTarget.value)}
            placeholder="workos, gcp, react"
            type="search"
            value={query}
          />
        </label>
        <label className="sketchi-icons__field">
          Collection
          <select
            onChange={(event) => setCollection(event.currentTarget.value)}
            value={collection}
          >
            <option value="all">All collections</option>
            {collections.map(([collectionName, count]) => (
              <option key={collectionName} value={collectionName}>
                {formatCollectionLabel(collectionName)} ({count})
              </option>
            ))}
          </select>
        </label>
        <label className="sketchi-icons__toggle">
          <input
            checked={flaggedOnly}
            onChange={(event) => setFlaggedOnly(event.currentTarget.checked)}
            type="checkbox"
          />
          Review flags
        </label>
      </section>

      {status === "loading" ? (
        <section className="sketchi-icons__status" role="status">
          Loading icon output
        </section>
      ) : null}

      {status === "error" ? (
        <section className="sketchi-icons__status" role="alert">
          {errorMessage ?? "Icon output could not be loaded."}
        </section>
      ) : null}

      {status === "ready" ? (
        <section className="sketchi-icons__grid" aria-label="Icon results">
          {visibleIcons.map((icon) => (
            <article className="sketchi-icons__item" key={icon.id}>
              <div className="sketchi-icons__preview">
                <img
                  alt={`${icon.slug} icon`}
                  loading="lazy"
                  src={icon.urlPath}
                />
              </div>
              <strong>{icon.slug}</strong>
              <span>{icon.collection}</span>
            </article>
          ))}
          {visibleIcons.length === 0 ? (
            <div className="sketchi-icons__status">No matching icons</div>
          ) : null}
        </section>
      ) : null}
    </main>
  );
}
