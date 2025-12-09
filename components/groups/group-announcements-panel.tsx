"use client";

import { useEffect, useState, useTransition } from "react";
import { GroupAnnouncement } from "@/app/[churchSlug]/admin/groups/types";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

type Props = {
  groupId: string;
};

export function GroupAnnouncementsPanel({ groupId }: Props) {
  const [announcements, setAnnouncements] = useState<GroupAnnouncement[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const load = async () => {
    const res = await fetch(`/api/admin/groups/${groupId}/announcements`);
    const data = await res.json().catch(() => []);
    if (Array.isArray(data)) setAnnouncements(data);
  };

  useEffect(() => {
    load();
  }, [groupId]);

  const onSubmit = () => {
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/admin/groups/${groupId}/announcements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), body: body.trim() })
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        setError(payload?.error ?? "Failed to post announcement");
        return;
      }
      setTitle("");
      setBody("");
      await load();
    });
  };

  return (
    <Card className="space-y-4 p-4">
      <div>
        <h2 className="text-lg font-semibold">Announcements</h2>
        <p className="text-sm text-muted-foreground">Share quick updates with the group.</p>
      </div>
      <div className="space-y-2">
        <Input placeholder="Subject" value={title} onChange={(e) => setTitle(e.target.value)} />
        <Textarea
          rows={3}
          placeholder="Message"
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button onClick={onSubmit} disabled={pending || !title.trim() || !body.trim()}>
          Post announcement
        </Button>
      </div>
      <div className="space-y-3">
        {announcements.length === 0 ? (
          <p className="text-sm text-muted-foreground">No announcements yet.</p>
        ) : (
          announcements.map((announcement) => (
            <Card key={announcement.id} className="p-4">
              <p className="text-sm font-semibold">{announcement.title}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(announcement.created_at).toLocaleString()}
              </p>
              <p className="mt-2 text-sm">{announcement.body}</p>
            </Card>
          ))
        )}
      </div>
    </Card>
  );
}
