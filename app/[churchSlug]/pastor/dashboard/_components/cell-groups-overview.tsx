"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  TrendingDown,
  Users2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type AlertReason =
  | "low_attendance"
  | "no_recent_meeting"
  | "leader_inactive"
  | "declining_trend";

export type AlertSeverity = "warning" | "critical";

export interface CellGroupAlert {
  groupId: string;
  groupName: string;
  leaderName: string;
  leaderPhone?: string | null;
  reason: AlertReason;
  severity: AlertSeverity;
}

export interface CellGroupOverviewData {
  activeGroups: number;
  totalMembers: number;
  thisWeekAttendance: {
    attended: number;
    total: number;
    percentage: number;
  };
  newMembers: number;
  groupsNeedingAttention: CellGroupAlert[];
}

const reasonLabels: Record<AlertReason, string> = {
  low_attendance: "Low attendance",
  no_recent_meeting: "No recent meeting",
  leader_inactive: "Leader inactive",
  declining_trend: "Declining trend"
};

const severityStyles: Record<AlertSeverity, { badge: string; border: string }> = {
  warning: {
    badge: "bg-amber-100 text-amber-700 border-amber-200",
    border: "border-l-amber-500"
  },
  critical: {
    badge: "bg-red-100 text-red-700 border-red-200",
    border: "border-l-red-500"
  }
};

interface CellGroupsOverviewProps {
  data: CellGroupOverviewData;
  basePath: string;
}

export function CellGroupsOverview({ data, basePath }: CellGroupsOverviewProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasAlerts = data.groupsNeedingAttention.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-base">
            <Users2 className="h-5 w-5 text-primary" />
            Cell Groups Overview
          </div>
          <Badge variant="outline">Branches only</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="text-xs font-medium text-muted-foreground">Active Groups</p>
            <p className="mt-1 text-2xl font-bold">{data.activeGroups}</p>
          </div>
          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="text-xs font-medium text-muted-foreground">Total Members</p>
            <p className="mt-1 text-2xl font-bold">{data.totalMembers}</p>
          </div>
          <div className="rounded-lg border bg-emerald-50 p-3">
            <p className="text-xs font-medium text-muted-foreground">New Members</p>
            <p className="mt-1 text-2xl font-bold text-emerald-600">+{data.newMembers}</p>
          </div>
          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="text-xs font-medium text-muted-foreground">Needing Attention</p>
            <p className={cn(
              "mt-1 text-2xl font-bold",
              hasAlerts ? "text-amber-600" : "text-emerald-600"
            )}>
              {data.groupsNeedingAttention.length}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">This Week&apos;s Attendance</span>
            <span className="font-semibold">
              {data.thisWeekAttendance.attended} / {data.thisWeekAttendance.total} ({data.thisWeekAttendance.percentage}%)
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-2 rounded-full bg-primary transition-all"
              style={{ width: `${data.thisWeekAttendance.percentage}%` }}
            />
          </div>
        </div>

        {hasAlerts ? (
          <div className="space-y-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-between text-amber-600 hover:text-amber-700 hover:bg-amber-50"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <span className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                {data.groupsNeedingAttention.length} group{data.groupsNeedingAttention.length !== 1 ? "s" : ""} needing attention
              </span>
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>

            {isExpanded ? (
              <div className="space-y-2">
                {data.groupsNeedingAttention.map((alert) => (
                  <div
                    key={alert.groupId}
                    className={cn(
                      "flex items-center justify-between rounded-lg border-l-4 bg-gray-50 p-3",
                      severityStyles[alert.severity].border
                    )}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`${basePath}/cell-groups/${alert.groupId}`}
                          className="text-sm font-medium hover:underline"
                        >
                          {alert.groupName}
                        </Link>
                        <Badge
                          variant="outline"
                          className={cn("text-xs", severityStyles[alert.severity].badge)}
                        >
                          {reasonLabels[alert.reason]}
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Leader: {alert.leaderName}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {alert.leaderPhone ? (
                        <a
                          href={`https://wa.me/${alert.leaderPhone.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-full p-2 text-emerald-600 transition-colors hover:bg-emerald-50"
                          title="Contact via WhatsApp"
                        >
                          <MessageCircle className="h-4 w-4" />
                        </a>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="pt-2">
          <Link href={`${basePath}/cell-groups`}>
            <Button variant="outline" size="sm" className="w-full">
              View All Cell Groups
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
