import { saveConversation } from "@/lib/actions/conversations";
import systemPrompt from "@/lib/backend/prompts/system-prompt";
import { getConversation } from "@/lib/dao/conversations";
import {
  OnFinishResult,
  saveResultAsAssistantMessage,
  saveUserMessage,
} from "@/lib/dao/messages";
import { decrementFreeMessages, getUserFromSession } from "@/lib/dao/users";
import rateLimit from "@/lib/rate-limiter";
import { AnthropicProviderOptions, anthropic } from "@ai-sdk/anthropic";
import { createAzure } from "@ai-sdk/azure";
import { fireworks } from "@ai-sdk/fireworks";
import { google } from "@ai-sdk/google";
import { perplexity } from "@ai-sdk/perplexity";
import { xai } from "@ai-sdk/xai";
import {
  Message,
  extractReasoningMiddleware,
  smoothStream,
  streamText,
  wrapLanguageModel,
} from "ai";
import { NextRequest } from "next/server";
import { v4 as uuidv4 } from "uuid";

const limiter = rateLimit(10, 60);

export const maxDuration = 55;

const azure = createAzure({
  apiVersion: "2024-12-01-preview",
});

const azure41 = createAzure({
  apiVersion: "2024-04-01-preview",
  apiKey: process.env.AZURE_GPT41_API_KEY,
  resourceName: process.env.AZURE_GPT41_RESOURCE_NAME,
});

const reasoningFireworks = (model: string) => {
  return wrapLanguageModel({
    model: fireworks(model),
    middleware: extractReasoningMiddleware({ tagName: "think" }),
  });
};

const allowedModels = {
  "gpt-4.1": azure41("gpt-4.1"),
  "4.1-nano": azure41("gpt-4.1-nano"),
  "4.1-mini": azure41("gpt-4.1-mini"),
  "4o-mini": azure("gpt-4o-mini"),
  "o3-mini": azure("o3-mini"),
  "claude-3-7-sonnet": anthropic("claude-3-7-sonnet-20250219"),
  "claude-3-7-sonnet-reasoning": anthropic("claude-3-7-sonnet-20250219"),
  "claude-3-5-sonnet": anthropic("claude-3-5-sonnet-20240620"),
  "claude-3-5-haiku": anthropic("claude-3-5-haiku-20241022"),
  "gemini-2.0-flash": google("gemini-2.0-flash", { useSearchGrounding: true }),
  "gemini-2.0-flash-lite": google("gemini-2.0-flash-lite"),
  "grok-3-beta": xai("grok-3-beta"),
  "grok-3-mini-beta": xai("grok-3-mini-beta"),
  "grok-2-1212": xai("grok-2-1212"),
  "llama-3.1-405b": fireworks("accounts/fireworks/models/llama-v3p1-405b-instruct"),
  "llama-4-scout": fireworks("accounts/fireworks/models/llama4-scout-instruct-basic"),
  "llama-4-maverick": fireworks(
    "accounts/fireworks/models/llama4-maverick-instruct-basic"
  ),
  "deepseek-r1": reasoningFireworks("accounts/fireworks/models/deepseek-r1"),
  "deepseek-v3": fireworks("accounts/fireworks/models/deepseek-v3"),
  sonar: perplexity("sonar"),
  "sonar-pro": perplexity("sonar-pro"),
};

function getProviderOptions(model: string) {
  const providerOptions: any = {};

  if (model === "deepseek-r1") {
    providerOptions.groq = { reasoningFormat: "parsed" };
  }

  if (model === "claude-3-7-sonnet-reasoning") {
    providerOptions.anthropic = {
      thinking: { type: "enabled", budgetTokens: 12000 },
    } satisfies AnthropicProviderOptions;
  }

  return providerOptions;
}

export async function POST(req: NextRequest) {
  const response = limiter(req);
  if (response) return response;

  const start = Date.now();
  const user = await getUserFromSession();
  const userFetched = Date.now();
  console.log(`User fetched in: ${userFetched - start}ms`);

  if (user.freeMessages <= 0) {
    return new Response("Out of available messages", { status: 400 });
  }

  const { id, messages, model: modelId } = await req.json();
  const model = allowedModels[modelId as keyof typeof allowedModels];

  if (!model) {
    return new Response("Invalid model", { status: 400 });
  }

  const conversation = await getConversation(id);

  if (!conversation) {
    await saveNewConversation(id, modelId, messages);
  } else {
    const lastMessage = messages[messages.length - 1];
    await saveUserMessage(lastMessage.content, id);
  }

  const result = streamText({
    model,
    messages,
    maxSteps: 5,
    system: systemPrompt,
    providerOptions: getProviderOptions(modelId),
    experimental_transform: smoothStream({
      delayInMs: 10,
    }),
    onFinish: async (result: OnFinishResult) => {
      await saveResultAsAssistantMessage(result, id);
      await decrementFreeMessages(user.id);
    },
    onError: (error) => {
      console.error(error);
    },
  });

  const end = Date.now();
  console.log(`Response time: ${end - start}ms`);

  return result.toDataStreamResponse({ sendReasoning: true });
}

async function saveNewConversation(id: string, modelId: string, messages: Message[]) {
  const conversation = {
    id,
    title: "New Chat",
    model: modelId,
    messages: [
      {
        ...messages[0],
        parts: undefined,
        reasoning: null,
        signature: null,
      },
    ],
    lastMessageAt: new Date(),
  };

  await saveConversation(conversation);
}
