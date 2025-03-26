"use client";

import { LinkButton } from "@/components/ui/button";
import { useConversations } from "@/lib/queries/conversations";
import { cn } from "@/lib/utils";
import { PartialConversation } from "@/types/chat";
import { MessageSquare, Plus } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AnimatedTitle } from "./ui/animated-title";

export function ChatSidebar() {
  const { id } = useParams();
  const { data: conversations = [], isLoading } = useConversations();

  if (isLoading) {
    return <div className="flex items-center justify-center h-full">Loading...</div>;
  }

  return (
    <div className="flex flex-col h-full gap-4">
      <div>
        <LinkButton href="/chat" className="w-full gap-2">
          <Plus className="h-4 w-4" />
          New Chat
        </LinkButton>
      </div>
      <div className="flex flex-col flex-1 overflow-auto gap-1">
        {conversations.map((chat: PartialConversation) => (
          <Link
            key={chat.id}
            href={`/chat/${chat.id}`}
            className={cn(
              "flex w-full flex-col items-start gap-1 rounded-lg p-3 text-left text-sm transition-colors",
              id === chat.id ? "bg-accent text-accent-foreground" : "hover:bg-muted"
            )}
          >
            <div className="flex w-full items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <AnimatedTitle text={chat.title} />
            </div>
            {chat?.messages?.length > 0 && (
              <p className="text-xs text-muted-foreground truncate w-full">
                {chat.messages[chat.messages.length - 1]?.content}
              </p>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
