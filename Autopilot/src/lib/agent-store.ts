import { useSyncExternalStore } from "react";

type AgentState = {
  enabled: boolean;
  perProduct: Record<string, boolean>;
};

const KEY = "autopilot.agent";
const listeners = new Set<() => void>();

let state: AgentState = { enabled: true, perProduct: {} };

if (typeof window !== "undefined") {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) state = { ...state, ...JSON.parse(raw) };
  } catch {
    // Ignore malformed local state and fall back to defaults.
  }
}

function persist() {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  }
  listeners.forEach((l) => l());
}

export const agentStore = {
  get: () => state,
  setEnabled(v: boolean) {
    state = { ...state, enabled: v };
    persist();
  },
  toggleProduct(id: string) {
    state = {
      ...state,
      perProduct: { ...state.perProduct, [id]: !(state.perProduct[id] ?? true) },
    };
    persist();
  },
  subscribe(cb: () => void) {
    listeners.add(cb);
    return () => listeners.delete(cb);
  },
};

export function useAgent() {
  return useSyncExternalStore(
    agentStore.subscribe,
    agentStore.get,
    agentStore.get,
  );
}
