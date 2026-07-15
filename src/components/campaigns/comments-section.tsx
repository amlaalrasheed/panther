"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { addComment } from "@/app/(app)/campaigns/actions";
import { formatDateTime } from "@/lib/format";

type CommentItem = { id: string; body: string; createdAt: string | Date; user: { name: string } };

export function CommentsSection({
  campaignId,
  comments,
}: {
  campaignId: string;
  comments: CommentItem[];
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setSubmitting(true);
    try {
      await addComment(campaignId, body.trim());
      setBody("");
      router.refresh();
    } catch {
      toast.error("Could not add comment");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        {comments.length === 0 && <p className="text-sm text-muted-foreground">No comments yet.</p>}
        {comments.map((c) => (
          <div key={c.id} className="flex gap-2.5">
            <Avatar className="size-7 shrink-0">
              <AvatarFallback className="text-[10px]">
                {c.user.name
                  .split(" ")
                  .map((p) => p[0])
                  .slice(0, 2)
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 rounded-lg bg-muted/50 px-3 py-2 text-sm">
              <div className="mb-0.5 flex items-baseline gap-2">
                <span className="font-medium">{c.user.name}</span>
                <span className="text-xs text-muted-foreground">{formatDateTime(c.createdAt)}</span>
              </div>
              <p className="whitespace-pre-wrap">{c.body}</p>
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={onSubmit} className="flex gap-2">
        <Textarea
          rows={1}
          placeholder="Add a comment..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="min-h-9 resize-none"
        />
        <Button type="submit" size="icon" disabled={submitting || !body.trim()}>
          {submitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
        </Button>
      </form>
    </div>
  );
}
