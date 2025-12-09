'use client';

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Church, MoveRight } from "lucide-react";
import { Button } from "@/components/ui/button";

function Hero() {
  const [titleNumber, setTitleNumber] = useState(0);
  const titles = useMemo(
    () => ["multi-tenant", "secure", "member-first", "pastor-ready", "branch-aware"],
    []
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setTitleNumber((prev) => (prev === titles.length - 1 ? 0 : prev + 1));
    }, 2200);
    return () => clearTimeout(timeoutId);
  }, [titleNumber, titles]);

  return (
    <section className="w-full bg-gradient-to-b from-background via-background to-background/80">
      <div className="container mx-auto">
        <div className="flex flex-col items-center justify-center gap-8 py-20 text-center lg:py-32">
          <Button variant="secondary" size="sm" className="gap-2 rounded-full px-4 py-1.5">
            <Church className="h-4 w-4 text-primary" />
            Multi-tenant Church OS
          </Button>
          <div className="flex flex-col gap-4">
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl">
              Build a
              <span className="relative ml-2 inline-flex min-w-[10ch] justify-center overflow-hidden">
                {titles.map((title, index) => (
                  <motion.span
                    key={title}
                    className="absolute text-primary"
                    initial={{ opacity: 0, y: -120 }}
                    transition={{ type: "spring", stiffness: 60 }}
                    animate={
                      titleNumber === index
                        ? { opacity: 1, y: 0 }
                        : { opacity: 0, y: titleNumber > index ? -140 : 140 }
                    }
                  >
                    {title}
                  </motion.span>
                ))}
                <span className="opacity-0">{titles[0]}</span>
              </span>
              church platform your pastors love.
            </h1>
            <p className="mx-auto max-w-3xl text-lg text-muted-foreground">
              Unite branches, pastors, admins, and members inside one Supabase-secured workspace. Track
              families, assignments, and branch health while giving each role the tools they need.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" className="gap-2" asChild>
              <Link href="/auth/register-church">
                Register your church
                <MoveRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/auth/login">Login to your hub</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

export { Hero };
