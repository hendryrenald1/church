"use client";

import { LoginForm } from "@/components/auth/login-form";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  BarChart3,
  Building2,
  Quote
} from "lucide-react";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="grid min-h-screen w-full lg:grid-cols-2">
        {/* Right Panel - Shows first on mobile */}
        <aside className="relative order-first flex flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-8 py-12 text-white lg:order-last lg:px-12">
          {/* Subtle pattern overlay */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />

          {/* Content container - aligned to ~35% from top on desktop */}
          <div className="relative z-10 flex flex-1 flex-col justify-center lg:justify-start lg:pt-[20vh]">
            <div className="space-y-8">
              <Badge
                variant="outline"
                className="w-fit border-emerald-400/50 bg-emerald-500/10 text-emerald-300"
              >
                Secure Church Workspace
              </Badge>

              <div className="space-y-4">
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                  Designed for Ministry
                </h1>
                <p className="max-w-md text-lg text-slate-300">
                  A calm, focused, and private workspace to help you serve your congregation with excellence.
                </p>
              </div>

              {/* Feature list with Lucide icons */}
              <div className="space-y-5 pt-4">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
                  What you can do
                </h2>
                <ul className="space-y-4">
                  <li className="flex items-start gap-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-white/10">
                      <Users className="h-5 w-5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="font-medium">Manage members & families</p>
                      <p className="text-sm text-slate-400">
                        Keep track of your congregation and their connections.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-white/10">
                      <BarChart3 className="h-5 w-5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="font-medium">Track attendance & engagement</p>
                      <p className="text-sm text-slate-400">
                        Gain insights into participation across services and groups.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-white/10">
                      <Building2 className="h-5 w-5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="font-medium">Oversee multiple branches</p>
                      <p className="text-sm text-slate-400">
                        Manage permissions and data for each campus from one place.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Testimonial / Social proof */}
              <div className="mt-8 border-t border-white/10 pt-8">
                <div className="flex items-start gap-3">
                  <Quote className="h-8 w-8 flex-shrink-0 text-emerald-400/50" />
                  <blockquote className="space-y-2">
                    <p className="italic text-slate-300">
                      &ldquo;This platform has transformed how we connect with our congregation. Simple, secure, and built for ministry.&rdquo;
                    </p>
                    <footer className="text-sm text-slate-400">
                      — Pastor James, Grace Community Church
                    </footer>
                  </blockquote>
                </div>
                <p className="mt-6 text-sm font-medium text-emerald-400">
                  Trusted by 500+ churches worldwide
                </p>
              </div>
            </div>
          </div>

          {/* Footer - hidden on mobile */}
          <footer className="relative z-10 mt-8 hidden text-sm text-slate-500 lg:block">
            &copy; {new Date().getFullYear()} ChurchFlow. All rights reserved.
          </footer>
        </aside>

        {/* Left Panel - Login Form */}
        <main className="flex flex-col px-6 py-12 sm:px-12 lg:px-16">
          {/* Logo placeholder - aligned top */}
          <div className="mb-auto">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <span className="text-lg font-bold text-primary-foreground">C</span>
              </div>
              <span className="text-xl font-semibold">ChurchFlow</span>
            </div>
          </div>

          {/* Form container - aligned to ~35% from top */}
          <div className="flex flex-1 items-center lg:items-start lg:pt-[15vh]">
            <LoginForm />
          </div>

          {/* Mobile footer */}
          <footer className="mt-8 text-center text-sm text-muted-foreground lg:hidden">
            &copy; {new Date().getFullYear()} ChurchFlow. All rights reserved.
          </footer>
        </main>
      </div>
    </div>
  );
}
