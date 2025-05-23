import InputForm from "@/components/input-form";
import { ChatProvider } from "@/lib/contexts/chat-context";
import { getUserFromSession } from "@/lib/dao/users";
import { ReactNode } from "react";

export default async function ChatLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getUserFromSession();

  return (
    <ChatProvider>
      <div className="relative flex flex-1 flex-col min-w-[320px] max-h-svh bg-background md:rounded-[20px]">
        {children}
        <div className="absolute bottom-0 left-0 right-0">
          <div className="relative h-6 max-w-5xl mx-auto bg-gradient-to-t from-background to-transparent pointer-events-none z-10" />
          <InputForm plan={user.subscription} freeMessages={user?.freeMessages} />
        </div>
      </div>
    </ChatProvider>
  );
}
