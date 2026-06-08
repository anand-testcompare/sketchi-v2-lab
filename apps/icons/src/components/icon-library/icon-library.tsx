import { useEffect, useMemo, useState } from "react";

import {
  formatCollectionLabel,
  type IconLibraryData,
  iconMatchesQuery,
} from "../../lib/icon-data.js";
import { IconCard } from "../icon-card/index.js";
import { IconDetail } from "../icon-detail/index.js";

export type { IconLibraryData, SketchiIcon } from "../../lib/icon-data.js";

const PAGE_SIZE = 60;

export interface IconLibraryProps {
  data?: IconLibraryData | undefined;
  errorMessage?: string | undefined;
  initialCollection?: string;
  initialFlaggedOnly?: boolean;
  initialQuery?: string;
  status?: "error" | "loading" | "ready";
}

const emptyData: IconLibraryData = {
  icons: [],
  summary: {
    collectionCounts: {},
    totalIcons: 0,
  },
};

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
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [selectedId, setSelectedId] = useState<string | null>(null);

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
        const matchesFlag = !flaggedOnly || icon.flags.length > 0;

        return (
          matchesCollection &&
          matchesFlag &&
          iconMatchesQuery(icon, normalizedQuery)
        );
      }),
    [collection, data, flaggedOnly, normalizedQuery],
  );

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [collection, flaggedOnly, normalizedQuery]);

  const visibleIcons = filteredIcons.slice(0, visibleCount);
  const hasMore = filteredIcons.length > visibleIcons.length;
  const selected = selectedId
    ? (data.icons.find((icon) => icon.id === selectedId) ?? null)
    : null;
  const flaggedCount = Object.values(data.summary.flagCounts ?? {}).reduce(
    (sum, count) => sum + count,
    0,
  );

  function resetFilters() {
    setQuery("");
    setCollection("all");
    setFlaggedOnly(false);
  }

  return (
    <main className="sketchi-icons">
      <header className="sketchi-icons__header">
        <div className="sketchi-icons__brand">
          <img alt="" className="sk-icon" height="38" src="/icon.svg" width="38" />
          <div className="sketchi-icons__title">
            <p className="sketchi-icons__eyebrow">Sketchi icons</p>
            <h1>Curated icon output</h1>
          </div>
        </div>
        <div className="sketchi-icons__summary" aria-label="Icon summary">
          <span>
            <strong>{data.summary.totalIcons.toLocaleString()}</strong> icons
          </span>
          <span>
            <strong>{collections.length.toLocaleString()}</strong> collections
          </span>
          <span>
            <strong>{flaggedCount.toLocaleString()}</strong> review flags
          </span>
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
        {status === "ready" ? (
          <p
            aria-live="polite"
            className="sketchi-icons__count"
            role="status"
          >
            Showing {visibleIcons.length.toLocaleString()} of{" "}
            {filteredIcons.length.toLocaleString()}
          </p>
        ) : null}
      </section>

      {status === "loading" ? (
        <section className="sketchi-icons__status" role="status">
          <span className="sketchi-icons__spin" aria-hidden="true" />
          Loading icon output…
        </section>
      ) : null}

      {status === "error" ? (
        <section className="sketchi-icons__status" role="alert">
          {errorMessage ?? "Icon output could not be loaded."}
        </section>
      ) : null}

      {status === "ready" ? (
        <div
          className="sketchi-icons__body"
          data-detail={selected ? "open" : "closed"}
        >
          <div className="sketchi-icons__results">
            {filteredIcons.length > 0 ? (
              <section className="sketchi-icons__grid" aria-label="Icon results">
                {visibleIcons.map((icon) => (
                  <IconCard
                    active={selected?.id === icon.id}
                    icon={icon}
                    key={icon.id}
                    onSelect={(picked) => setSelectedId(picked.id)}
                  />
                ))}
              </section>
            ) : (
              <div className="sketchi-icons__empty">
                <p className="sketchi-icons__empty-title">
                  No icons match those filters.
                </p>
                <button
                  className="sketchi-icons__reset"
                  onClick={resetFilters}
                  type="button"
                >
                  Clear filters
                </button>
              </div>
            )}

            {hasMore ? (
              <div className="sketchi-icons__more">
                <button
                  className="sketchi-icons__more-btn"
                  onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
                  type="button"
                >
                  Load{" "}
                  {Math.min(
                    PAGE_SIZE,
                    filteredIcons.length - visibleIcons.length,
                  )}{" "}
                  more
                </button>
              </div>
            ) : null}
          </div>

          {selected ? (
            <aside className="sketchi-icons__detail">
              <IconDetail
                icon={selected}
                key={selected.id}
                onClose={() => setSelectedId(null)}
              />
            </aside>
          ) : null}
        </div>
      ) : null}
    </main>
  );
}
