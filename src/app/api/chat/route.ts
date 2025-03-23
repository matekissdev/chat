import { groq } from "@ai-sdk/groq";
import { smoothStream, streamText } from "ai";

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: groq("llama-3.3-70b-versatile"),
    messages,
    maxSteps: 5,
    experimental_transform: smoothStream({
      delayInMs: 15,
    }),
  });

  return result.toDataStreamResponse();
}
