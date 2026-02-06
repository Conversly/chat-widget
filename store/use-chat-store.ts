import { createContext, useContext } from "react"
import { useStore } from "zustand"
import type { ChatStore, ChatStoreApi } from "./chat-store"

export const ChatStoreContext = createContext<ChatStoreApi | null>(null)

export function useChatStore<T>(selector: (state: ChatStore) => T): T {
  const store = useContext(ChatStoreContext)
  if (!store) throw new Error("useChatStore must be used within ChatStoreProvider")
  return useStore(store, selector)
}

export function useChatStoreApi(): ChatStoreApi {
  const store = useContext(ChatStoreContext)
  if (!store) throw new Error("useChatStoreApi must be used within ChatStoreProvider")
  return store
}

