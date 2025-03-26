import { saveConversation, saveConversationTitle } from "@/lib/actions/conversations";
import { saveMessage } from "@/lib/actions/messages";
import { PartialConversation, PartialMessage } from "@/types/chat";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const conversationKeys = {
  all: ["conversations"] as const,
  detail: (id: string) => [...conversationKeys.all, id] as const,
};

export function useConversations() {
  return useQuery({
    queryKey: conversationKeys.all,
    queryFn: () => fetch("/api/conversations").then((res) => res.json()),
  });
}

export function useConversation(id: string) {
  return useQuery({
    queryKey: conversationKeys.detail(id),
    queryFn: () =>
      fetch(`/api/conversations/${id}`)
        .then((res) => res.json())
        .then((data) => {
          let parts = [];
          if (data.reasoning) {
            parts.push({
              type: "reasoning",
              reasoning: data.reasoning,
            });
          }

          if (data.content) {
            parts.push({
              type: "text",
              text: data.content,
            });
          }

          return {
            ...data,
            parts: parts,
          };
        }),
  });
}

export function useUpdateConversationTitle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ conversationId, title }: { conversationId: string; title: string }) =>
      saveConversationTitle(conversationId, title),
    onSuccess: (updatedConversation, { conversationId }) => {
      // Update the conversation in the detail cache
      queryClient.setQueryData(conversationKeys.detail(conversationId), (old: any) => ({
        ...old,
        title: updatedConversation.title,
      }));

      // Update the conversation in the list cache
      queryClient.setQueryData(
        conversationKeys.all,
        (old: PartialConversation[] | undefined) => {
          if (!old) return [updatedConversation];
          return old.map((conv) =>
            conv.id === conversationId
              ? { ...conv, title: updatedConversation.title }
              : conv
          );
        }
      );
    },
  });
}

export function useAddMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      message,
      conversationId,
    }: { message: PartialMessage; conversationId: string }) =>
      saveMessage(message, conversationId),
    onSuccess: (updatedConversation, { conversationId }) => {
      // Invalidate the conversation query to refetch with the new message
      queryClient.setQueryData(conversationKeys.detail(conversationId), (old: any) => ({
        ...old,
        messages: [...old.messages, updatedConversation],
      }));

      queryClient.setQueryData(
        conversationKeys.all,
        (old: PartialConversation[] | undefined) => {
          if (!old) return [updatedConversation];
          return old.map((conv) =>
            conv.id === conversationId
              ? { ...conv, messages: [...conv.messages, updatedConversation] }
              : conv
          );
        }
      );
    },
  });
}

export function useCreateConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conversation: PartialConversation) => saveConversation(conversation),
    onMutate: async (newConversation) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: conversationKeys.detail(newConversation.id),
      });

      // Snapshot the previous value
      const previousConversations = queryClient.getQueryData(conversationKeys.all);

      queryClient.setQueryData(
        conversationKeys.detail(newConversation.id),
        newConversation
      );

      // Return a context object with the snapshotted value
      return { previousConversations };
    },
    onError: (_err, newConversation, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousConversations) {
        queryClient.setQueryData(conversationKeys.all, context.previousConversations);
      }
      queryClient.removeQueries({
        queryKey: conversationKeys.detail(newConversation.id),
      });
    },
    onSettled: () => {
      // Always refetch after error or success to ensure we have the latest data
      queryClient.invalidateQueries({ queryKey: conversationKeys.all });
    },
  });
}
