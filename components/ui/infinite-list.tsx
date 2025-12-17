"use client";

import { useCallback, useEffect, useRef, ReactNode } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { cn } from "@/lib/utils";
import { Skeleton } from "./skeleton";

interface InfiniteListProps<T> {
  items: T[];
  isLoading: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  fetchNextPage: () => void;
  renderItem: (item: T, index: number) => ReactNode;
  renderSkeleton?: () => ReactNode;
  estimatedItemHeight?: number;
  overscan?: number;
  className?: string;
  loadingMessage?: string;
  emptyMessage?: string;
  endMessage?: string;
  totalCount?: number;
  keyExtractor: (item: T) => string;
}

/**
 * Reusable infinite scrolling list component with virtualization
 * Uses intersection observer for automatic loading and TanStack Virtual for performance
 */
export function InfiniteList<T>({
  items,
  isLoading,
  isFetchingNextPage,
  hasNextPage,
  fetchNextPage,
  renderItem,
  renderSkeleton,
  estimatedItemHeight = 64,
  overscan = 5,
  className,
  loadingMessage = "Loading...",
  emptyMessage = "No items found.",
  endMessage = "End of list",
  totalCount,
  keyExtractor,
}: InfiniteListProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Set up intersection observer for automatic loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      {
        root: null,
        rootMargin: "100px", // Start loading 100px before reaching the end
        threshold: 0,
      }
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Virtualizer for efficient rendering of large lists
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimatedItemHeight,
    overscan,
  });

  const virtualItems = virtualizer.getVirtualItems();

  // Manual load more handler for button click
  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Default skeleton renderer
  const defaultSkeleton = () => (
    <div className="flex items-center gap-4 px-4 py-3">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3 w-1/4" />
      </div>
    </div>
  );

  const SkeletonItem = renderSkeleton || defaultSkeleton;

  // Initial loading state
  if (isLoading && items.length === 0) {
    return (
      <div className={cn("space-y-2", className)}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i}>{SkeletonItem()}</div>
        ))}
      </div>
    );
  }

  // Empty state
  if (!isLoading && items.length === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center py-12 text-muted-foreground", className)}>
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col", className)}>
      {/* Item count indicator */}
      {totalCount !== undefined && (
        <div className="mb-2 text-sm text-muted-foreground">
          Showing {items.length} of {totalCount} items
        </div>
      )}

      {/* Virtualized list container */}
      <div
        ref={parentRef}
        className="relative overflow-auto"
        style={{ height: "calc(100vh - 300px)", minHeight: 400 }}
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
          }}
        >
          {virtualItems.map((virtualItem) => {
            const item = items[virtualItem.index];
            return (
              <div
                key={keyExtractor(item)}
                data-index={virtualItem.index}
                ref={virtualizer.measureElement}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                {renderItem(item, virtualItem.index)}
              </div>
            );
          })}
        </div>
      </div>

      {/* Load more trigger element for intersection observer */}
      <div ref={loadMoreRef} className="h-1" aria-hidden="true" />

      {/* Loading more indicator */}
      {isFetchingNextPage && (
        <div className="flex items-center justify-center py-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span>{loadingMessage}</span>
          </div>
        </div>
      )}

      {/* Load more button (fallback for intersection observer) */}
      {hasNextPage && !isFetchingNextPage && (
        <div className="flex justify-center py-4">
          <button
            onClick={handleLoadMore}
            className="rounded-lg border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            Load more
          </button>
        </div>
      )}

      {/* End of list message */}
      {!hasNextPage && items.length > 0 && (
        <div className="flex justify-center py-4 text-sm text-muted-foreground">
          {endMessage}
        </div>
      )}
    </div>
  );
}

/**
 * Simple infinite list without virtualization for smaller datasets
 * Uses only intersection observer for automatic loading
 */
interface SimpleInfiniteListProps<T> {
  items: T[];
  isLoading: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  fetchNextPage: () => void;
  renderItem: (item: T, index: number) => ReactNode;
  renderSkeleton?: () => ReactNode;
  className?: string;
  emptyMessage?: string;
  totalCount?: number;
  keyExtractor: (item: T) => string;
}

export function SimpleInfiniteList<T>({
  items,
  isLoading,
  isFetchingNextPage,
  hasNextPage,
  fetchNextPage,
  renderItem,
  renderSkeleton,
  className,
  emptyMessage = "No items found.",
  totalCount,
  keyExtractor,
}: SimpleInfiniteListProps<T>) {
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Intersection observer for automatic loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: "100px" }
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) observer.observe(currentRef);

    return () => {
      if (currentRef) observer.unobserve(currentRef);
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const defaultSkeleton = () => (
    <div className="flex items-center gap-4 px-4 py-3">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3 w-1/4" />
      </div>
    </div>
  );

  const SkeletonItem = renderSkeleton || defaultSkeleton;

  if (isLoading && items.length === 0) {
    return (
      <div className={cn("space-y-2", className)}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i}>{SkeletonItem()}</div>
        ))}
      </div>
    );
  }

  if (!isLoading && items.length === 0) {
    return (
      <div className={cn("py-12 text-center text-muted-foreground", className)}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col", className)}>
      {totalCount !== undefined && (
        <div className="mb-2 text-sm text-muted-foreground">
          Showing {items.length} of {totalCount} items
        </div>
      )}

      <div className="space-y-0">
        {items.map((item, index) => (
          <div key={keyExtractor(item)}>{renderItem(item, index)}</div>
        ))}
      </div>

      <div ref={loadMoreRef} className="h-1" />

      {isFetchingNextPage && (
        <div className="flex justify-center py-4">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}

      {!hasNextPage && items.length > 0 && (
        <div className="py-4 text-center text-sm text-muted-foreground">
          You&apos;ve reached the end
        </div>
      )}
    </div>
  );
}
