import React, { useRef } from "react"
import type { ChatStoreApi, CreateChatStoreOptions } from "./chat-store"
import { createChatStore } from "./chat-store"
import { ChatStoreContext } from "./use-chat-store"

export function ChatStoreProvider({
  children,
  createOptions,
  store,
}: {
  children: React.ReactNode
  /** If provided, provider will create a new store instance once */
  createOptions?: CreateChatStoreOptions
  /** If provided, provider will use this exact store instance */
  store?: ChatStoreApi
}) {
  const storeRef = useRef<ChatStoreApi | null>(null)

  if (!storeRef.current) {
    storeRef.current = store ?? createChatStore(createOptions)
  }

  return <ChatStoreContext.Provider value={storeRef.current}>{children}</ChatStoreContext.Provider>
}

