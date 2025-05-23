import "server-only";

import { getUserIdFromSession } from "@/lib/dao/users";
import prisma from "@/lib/prisma";
import { Message } from "@prisma/client";
import { UIMessage } from "ai";

export async function getConversation(id: string) {
  const userId = await getUserIdFromSession();

  const conversation = await prisma.conversation.findUnique({
    where: {
      id: id,
      userId,
    },
    select: {
      id: true,
      title: true,
      model: true,
      messages: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  return {
    ...conversation,
    messages: mapMessages(conversation?.messages || []),
  };
}

export async function getConversations(
  page: number,
  limit: number,
  search?: string
): Promise<{ conversations: any[]; hasMore: boolean }> {
  const userId = await getUserIdFromSession();
  const skip = (page - 1) * limit;

  const [conversations, total] = await Promise.all([
    prisma.conversation.findMany({
      where: {
        userId,
        ...(search
          ? {
              OR: [
                { title: { contains: search, mode: "insensitive" } },
                {
                  messages: {
                    some: { content: { contains: search, mode: "insensitive" } },
                  },
                },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        title: true,
        lastMessageAt: true,
        messages: {
          select: {
            id: true,
            content: true,
          },
          take: 1,
          orderBy: {
            createdAt: "desc",
          },
        },
      },
      orderBy: {
        lastMessageAt: "desc",
      },
      skip,
      take: limit,
    }),
    prisma.conversation.count({
      where: {
        userId,
        ...(search
          ? {
              OR: [
                { title: { contains: search, mode: "insensitive" } },
                {
                  messages: {
                    some: { content: { contains: search, mode: "insensitive" } },
                  },
                },
              ],
            }
          : {}),
      },
    }),
  ]);

  const hasMore = skip + conversations.length < total;

  return {
    conversations,
    hasMore,
  };
}

export async function appendMessageToConversation(
  message: UIMessage,
  conversationId: string
) {
  const userId = await getUserIdFromSession();

  await prisma.message.create({
    data: {
      ...message,
      parts: JSON.stringify(message.parts),
      toolInvocations: JSON.stringify(message.toolInvocations),
      conversationId,
    },
  });

  const updatedConversation = await prisma.conversation.update({
    where: {
      id: conversationId,
      userId,
    },
    data: {
      lastMessageAt: new Date(),
    },
    include: {
      messages: true,
    },
  });

  return {
    ...updatedConversation,
    messages: mapMessages(updatedConversation.messages),
  };
}

function mapMessages(messages: Message[]) {
  return messages.map((message) => ({
    ...message,
    role: message.role as "system" | "user" | "assistant" | "data",
    reasoning: message.reasoning ?? undefined,
    parts: JSON.parse(message.parts as string),
    toolInvocations: JSON.parse(message.toolInvocations as string),
  }));
}
