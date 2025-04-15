"use client";

import { useChatContext } from "@/lib/contexts/chat-context";
import { useConversation } from "@/lib/queries/conversations";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { memo, useEffect, useRef } from "react";
import { MessageItem } from "./message-item";
import { LoadingDots } from "./ui/loading-dots";

const MemoizedMessageItem = memo(MessageItem);

export function MessagesList({
  initialConversation,
  id,
}: {
  initialConversation?: any;
  id: string;
}) {
  const router = useRouter();
  const { messages, status, setMessages, setModelId } = useChatContext();
  const { data: conversation } = useConversation(id, initialConversation);
  const lastMessageIndex = messages.length - 1;

  useEffect(() => {
    if (!conversation) {
      router.push("/chat");
    }
    if (conversation?.messages) {
      setMessages(conversation.messages);
    }

    if (conversation?.model) {
      setModelId(conversation.model);
    }
  }, [conversation, setMessages, setModelId]);

  const memoizedConversationMessages = useMemo(() => {
    return conversation?.messages?.map((message: any) => (
      <MemoizedMessageItem key={message.id} message={message} />
    ));
  }, [conversation?.messages]);

  const memoizedLastMessage = useMemo(() => {
    if (
      messages?.length > 0 &&
      messages[lastMessageIndex].role === "assistant" &&
      status !== "ready"
    ) {
      return <MemoizedMessageItem message={messages[lastMessageIndex]} />;
    }
    return null;
  }, [messages, lastMessageIndex, status]);

  return (
    <div className="flex flex-col max-w-5xl mx-auto gap-4 px-4 sm:px-8 pt-8">
      {memoizedConversationMessages}
      {memoizedLastMessage}
      {status === "submitted" && <LoadingDots className="text-muted-foreground" />}
      <div id="messages-end" />
    </div>
  );
}
