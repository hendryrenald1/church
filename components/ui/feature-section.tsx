"use client";

import { ReactNode, useMemo, useState } from "react";
import {
  Layers3,
  ShieldCheck,
  Users,
  Workflow,
  Building,
  Sparkle,
  ArrowRight
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type Feature = {
  title: string;
  description: string;
  stat: string;
  icon: ReactNode;
};

const features: Feature[] = [
  {
    title: "Your data stays private",
    description: "Each church has its own secure space. Your member information is protected and only accessible to your authorized staff.",
    stat: "Enterprise-grade security",
    icon: <ShieldCheck className="h-5 w-5" />
  },
  {
    title: "Multi-campus ready",
    description: "Manage multiple locations effortlessly. Assign pastors to specific campuses and let them focus on their congregation.",
    stat: "Unlimited branches",
    icon: <Building className="h-5 w-5" />
  },
  {
    title: "Family connections",
    description: "Link members into family units, track relationships, and see the whole household at a glance.",
    stat: "Easy family management",
    icon: <Users className="h-5 w-5" />
  },
  {
    title: "Designed for ministry",
    description: "Clean, intuitive dashboards for administrators and pastors. Less time on admin, more time for what matters.",
    stat: "Built for churches",
    icon: <Sparkle className="h-5 w-5" />
  }
];

export function FeatureSection() {
  const [active, setActive] = useState(0);
  const activeFeature = useMemo(() => features[active], [active]);

  return (
    <section className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-16 md:flex-row">
      <div className="flex max-w-xl flex-col gap-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Why churches choose us</p>
        <h2 className="text-3xl font-semibold md:text-4xl">
          Everything you need to manage your church, all in one place.
        </h2>
        <p className="text-muted-foreground">
          Whether you have one campus or many, our platform gives administrators and pastors the right tools
          for their role. Hover over each feature to learn how we can help your ministry grow.
        </p>
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-3 text-primary">
            <Layers3 className="h-5 w-5" />
            <span className="text-sm font-semibold uppercase tracking-wider">Feature spotlight</span>
          </div>
          <h3 className="mt-4 text-2xl font-semibold">{activeFeature.title}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{activeFeature.description}</p>
          <div className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {activeFeature.stat}
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/auth/register-church" className="gap-2">
              Get started free
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/auth/login">Already have an account? Sign in</Link>
          </Button>
        </div>
      </div>
      <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2">
        {features.map((feature, index) => (
          <button
            key={feature.title}
            type="button"
            onMouseEnter={() => setActive(index)}
            onFocus={() => setActive(index)}
            className="group relative overflow-hidden rounded-2xl border bg-card p-5 text-left transition-all duration-200 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <div className="absolute inset-0 opacity-0 transition group-hover:opacity-100">
              <div className="h-full w-full bg-gradient-to-br from-primary/15 via-transparent to-primary/5" />
            </div>
            <div className="relative flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
              {feature.icon}
            </div>
            <h3 className="relative mt-4 text-xl font-semibold">{feature.title}</h3>
            <p className="relative mt-2 text-sm text-muted-foreground">{feature.description}</p>
            <p className="relative mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {feature.stat}
            </p>
          </button>
        ))}
      </div>
    </section>
  );
}
