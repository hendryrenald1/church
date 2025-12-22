"use client";

import { useCallback, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";

export function FamilySearchBar() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");

  const updateSearch = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set("search", value);
      } else {
        params.delete("search");
      }
      router.replace(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams]
  );

  return (
    <div className="rounded-lg border bg-muted/40 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
        <div className="relative w-full md:w-[320px]">
          <Input
            type="search"
            placeholder="Search families or members..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              updateSearch(e.target.value);
            }}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}
