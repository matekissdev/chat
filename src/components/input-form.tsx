"use client";

import { Button } from "@/components/ui/button";
import { useUpdateConversationModel } from "@/lib/queries/conversations";
import { useModelStore } from "@/lib/stores/model-store";
import { IconPlayerStop } from "@tabler/icons-react";
import { Send } from "lucide-react";
import { useParams } from "next/navigation";
import { ChangeEvent, FormEvent, KeyboardEvent, forwardRef } from "react";
import TextareaAutosize from "react-textarea-autosize";
import Anthropic from "./icons/anthropic";
import DeepSeek from "./icons/deepseek";
import Google from "./icons/google";
import Meta from "./icons/meta";
import OpenAI from "./icons/openai";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

interface InputFormProps {
  input: string;
  handleChange: (
    e: ChangeEvent<HTMLInputElement> | ChangeEvent<HTMLTextAreaElement>
  ) => void;
  handleSubmit: (e: FormEvent<HTMLFormElement>) => void;
  handleKeyDown: (e: KeyboardEvent<HTMLTextAreaElement>) => void;
  handleStop?: () => void;
  status?: string;
}

const InputForm = forwardRef<HTMLTextAreaElement, InputFormProps>(
  ({ input, handleChange, handleSubmit, handleKeyDown, status, handleStop }, ref) => {
    const params = useParams();
    const conversationId = params.id as string;
    const { model, setModel } = useModelStore();
    const updateModel = useUpdateConversationModel();

    const handleModelChange = (value: string) => {
      setModel(value);

      if (conversationId) {
        updateModel.mutateAsync({ conversationId, model: value });
      }
    };

    return (
      <div className="flex-none p-4">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col w-full max-w-5xl mx-auto items-end border rounded-xl p-4 bg-card"
        >
          <TextareaAutosize
            ref={ref}
            placeholder="(Shift + Enter for new line)"
            value={input}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            rows={1}
            className="flex min-h-10 max-h-80 w-full bg-transparent placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 text-sm resize-none"
          />
          <div className="flex items-end w-full gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="-ml-2 -mb-2 text-sm text-muted-foreground hover:text-primary"
                >
                  {model}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
                  Select Model
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup
                  defaultValue="4o-mini"
                  value={model}
                  onValueChange={handleModelChange}
                >
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                      <OpenAI />
                      OpenAI
                    </DropdownMenuLabel>
                    <DropdownMenuRadioItem
                      value="4o-mini"
                      className="text-sm cursor-pointer"
                    >
                      GPT-4o mini
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem
                      value="o3-mini"
                      className="text-sm cursor-pointer"
                    >
                      o3-mini
                    </DropdownMenuRadioItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                      <Anthropic />
                      Anthropic
                    </DropdownMenuLabel>
                    <DropdownMenuRadioItem
                      value="claude-3-7-sonnet"
                      className="text-sm cursor-pointer"
                    >
                      Claude 3.7 Sonnet
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem
                      value="claude-3-5-sonnet"
                      className="text-sm cursor-pointer"
                    >
                      Claude 3.5 Sonnet
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem
                      value="claude-3-5-haiku"
                      className="text-sm cursor-pointer"
                    >
                      Claude 3.5 Haiku
                    </DropdownMenuRadioItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                      <Google />
                      Google
                    </DropdownMenuLabel>
                    <DropdownMenuRadioItem
                      value="gemini-2.0-flash"
                      className="text-sm cursor-pointer"
                    >
                      Gemini 2.0 Flash
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem
                      value="gemini-2.0-flash-lite"
                      className="text-sm cursor-pointer"
                    >
                      Gemini 2.0 Flash Lite
                    </DropdownMenuRadioItem>
                  </DropdownMenuGroup>
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                      <Meta />
                      Meta
                    </DropdownMenuLabel>
                    <DropdownMenuRadioItem
                      value="llama-3.3"
                      className="text-sm cursor-pointer"
                    >
                      Llama 3.3
                    </DropdownMenuRadioItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                      <DeepSeek />
                      DeepSeek
                    </DropdownMenuLabel>
                    <DropdownMenuRadioItem
                      value="deepseek-r1"
                      className="text-sm cursor-pointer"
                    >
                      DeepSeek R1
                    </DropdownMenuRadioItem>
                  </DropdownMenuGroup>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            {status === "submitted" || status === "streaming" ? (
              <Button
                type="submit"
                size="icon"
                className="shrink-0 ml-auto size-9"
                onClick={() => handleStop?.()}
              >
                <IconPlayerStop size={16} />
              </Button>
            ) : (
              <Button type="submit" size="icon" className="shrink-0 ml-auto size-9">
                <Send size={16} />
              </Button>
            )}
          </div>
        </form>
      </div>
    );
  }
);

InputForm.displayName = "InputForm";

export default InputForm;
