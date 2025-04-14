"use client";

import { useChat } from "@ai-sdk/react";
import { useQueryClient } from "@tanstack/react-query";
import { Message } from "ai";
import { useParams } from "next/navigation";
import React, {
  createContext,
  useContext,
  ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";
import { v4 as uuidv4 } from "uuid";
import { getModel } from "../providers";
import { Model } from "../providers";
import { useAddMessage } from "../queries/conversations";
import { useUpdateConversationTitle } from "../queries/conversations";

type ChatStatus = "submitted" | "streaming" | "ready" | "error";

interface ChatContextType {
  id: string;
  messages: Message[];
  model: Model;
  setModelId: (modelId: string) => void;
  setMessages: (messages: Message[]) => void;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  status: ChatStatus;
  stop: () => void;
  reload: (options?: { body?: Record<string, any> }) => void;
  append: (message: Message) => void;
}

const ChatContext = createContext<ChatContextType | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const params = useParams();
  const conversationId = useMemo(() => (params.id as string) || uuidv4(), [params.id]);
  const queryClient = useQueryClient();
  const updateTitle = useUpdateConversationTitle();
  const addMessage = useAddMessage();
  const [model, setModel] = useState<Model>(getModel("4o-mini") as Model);
  const [modelId, setModelId] = useState<string>("4o-mini");

  function scrollDown() {
    const messagesEnd = document.getElementById("messages-end");
    if (messagesEnd) {
      messagesEnd.scrollIntoView({ behavior: "instant" });
    }
  }

  const { id, messages, setMessages, handleInputChange, status, stop, reload, append } =
    useChat({
      id: conversationId,
      body: { model: model.id },
      onResponse: () => {
        scrollDown();
      },
      onFinish: (message: Message) => {
        queryClient.invalidateQueries({ queryKey: ["subscription"] });

        addMessage.mutateAsync({
          message,
          conversationId,
        });

        if (messages.length === 1) {
          const titleMessages = [messages[0], message];

          updateTitle.mutateAsync({
            conversationId,
            messages: titleMessages,
          });
        }
        scrollDown();
      },
    });

  useEffect(() => {
    setModel(getModel(modelId) as Model);
  }, [modelId]);

  useEffect(() => {
    scrollDown();
  }, [messages.length, status]);

  return (
    <ChatContext.Provider
      value={{
        id,
        messages,
        model,
        setModelId,
        setMessages,
        handleInputChange,
        status,
        stop,
        reload,
        append,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChatContext() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChatContext must be used within a ChatProvider");
  }
  return context;
}
