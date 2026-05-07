"use client";

import { useState } from "react";
import { Copy, ExternalLink, Plus, Power } from "lucide-react";
import { useAgentController } from "@/components/site/agent-controls";

export default function DashboardLinksPage() {
  const { data, toggleLink, createLink, isPending, isDemoMode } = useAgentController();
  const [copied, setCopied] = useState<string | null>(null);
  const [draft, setDraft] = useState({
    targetUrl: "",
    productTitle: "",
    offerType: "recovery",
    offerValue: "10",
  });

  if (!data) return null;

  const copy = async (trackedUrl: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(trackedUrl);
    }
    setCopied(trackedUrl);
    window.setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="mx-auto max-w-7xl p-6 md:p-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-1 text-xs uppercase tracking-[0.24em] text-[#6a5bff]">Smart links</div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">Tracked products</h1>
          <p className="mt-2 text-sm text-slate-500">
            {isDemoMode ? "Local demo links stay interactive even while the database is offline." : "Every row below is backed by a real `smart_links` record."}
          </p>
        </div>
      </div>

      <div className="mb-6 rounded-[32px] border border-[#ece9ff] bg-white p-6 shadow-[0_45px_100px_-70px_rgba(110,103,255,0.6)]">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900">
          <Plus className="h-4 w-4 text-[#6a5bff]" />
          Create tracked link
        </div>
        <form
          className="grid gap-3 md:grid-cols-[1.1fr_1fr_0.7fr_0.5fr_auto]"
          onSubmit={async (event) => {
            event.preventDefault();
            await createLink({
              targetUrl: draft.targetUrl,
              productTitle: draft.productTitle,
              offerType: draft.offerType,
              offerValue: Number(draft.offerValue),
            });
            setDraft({ targetUrl: "", productTitle: "", offerType: "recovery", offerValue: "10" });
          }}
        >
          <input
            value={draft.productTitle}
            onChange={(event) => setDraft((state) => ({ ...state, productTitle: event.target.value }))}
            placeholder="Product name"
            className="rounded-2xl border border-[#ece9ff] bg-[#fbfaff] px-4 py-3 text-sm text-slate-900 outline-none"
          />
          <input
            value={draft.targetUrl}
            onChange={(event) => setDraft((state) => ({ ...state, targetUrl: event.target.value }))}
            placeholder="https://checkout-url.com/product"
            className="rounded-2xl border border-[#ece9ff] bg-[#fbfaff] px-4 py-3 text-sm text-slate-900 outline-none"
          />
          <select
            value={draft.offerType}
            onChange={(event) => setDraft((state) => ({ ...state, offerType: event.target.value }))}
            className="rounded-2xl border border-[#ece9ff] bg-[#fbfaff] px-4 py-3 text-sm text-slate-900 outline-none"
          >
            <option value="recovery">Recovery</option>
            <option value="discount">Discount</option>
            <option value="upsell">Upsell</option>
            <option value="bundle">Bundle</option>
          </select>
          <input
            value={draft.offerValue}
            onChange={(event) => setDraft((state) => ({ ...state, offerValue: event.target.value }))}
            placeholder="10"
            className="rounded-2xl border border-[#ece9ff] bg-[#fbfaff] px-4 py-3 text-sm text-slate-900 outline-none"
          />
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#8f6bff] to-[#ff4f9d] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
            disabled={isPending || !draft.targetUrl || !draft.productTitle}
          >
            {isPending ? "Saving..." : "Create"}
          </button>
        </form>
      </div>

      <div className="overflow-hidden rounded-[32px] border border-[#ece9ff] bg-white shadow-[0_45px_100px_-70px_rgba(110,103,255,0.6)]">
        <div className="grid grid-cols-12 border-b border-[#f0edff] bg-[#fbfaff] px-5 py-3 text-[10px] uppercase tracking-wider text-slate-400">
          <div className="col-span-4">Product</div>
          <div className="col-span-3">Tracked link</div>
          <div className="col-span-1 text-right">Clicks</div>
          <div className="col-span-1 text-right">Recov.</div>
          <div className="col-span-1 text-right">Revenue</div>
          <div className="col-span-2 text-right">Agent</div>
        </div>
        {data.links.map((product) => {
          const live = product.enabled;

          return (
            <div key={product.id} className="grid grid-cols-12 items-center border-b border-[#f3f0ff] px-5 py-4 transition-colors last:border-0 hover:bg-[#fcfbff]">
              <div className="col-span-4 min-w-0">
                <div className="truncate text-sm font-medium text-slate-900">{product.name}</div>
                <a
                  href={product.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex truncate text-xs text-slate-400 hover:text-[#6a5bff]"
                >
                  <span className="truncate">{product.url}</span>
                  <ExternalLink className="ml-1 mt-0.5 h-3 w-3 flex-shrink-0" />
                </a>
              </div>
              <div className="col-span-3 min-w-0">
                <button
                  onClick={() => copy(product.trackedUrl)}
                  className="inline-flex max-w-full items-center gap-2 rounded-lg border border-border bg-background/60 px-2.5 py-1.5 font-mono text-xs transition-colors hover:border-primary/40"
                >
                  <span className="truncate">{product.trackedSlug}</span>
                  <Copy className="h-3 w-3 flex-shrink-0" />
                </button>
                {copied === product.trackedUrl && <span className="ml-2 text-[10px] text-success">Copied</span>}
              </div>
              <div className="col-span-1 text-right text-sm font-medium text-slate-900">{product.clicks.toLocaleString()}</div>
              <div className="col-span-1 text-right text-sm font-medium text-[#ff4f9d]">{product.recovered}</div>
              <div className="col-span-1 text-right text-sm font-medium text-slate-900">${product.revenue}</div>
              <div className="col-span-2 flex items-center justify-end">
                <button
                  onClick={() => toggleLink(product.id, !product.enabled)}
                  disabled={isPending || !data.agent.enabled}
                  aria-label={product.enabled ? `Pause ${product.name}` : `Activate ${product.name}`}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-40 ${live ? "bg-gradient-to-r from-[#8f6bff] to-[#ff4f9d]" : "bg-slate-200"}`}
                >
                  <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${live ? "translate-x-6" : "translate-x-1"}`} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {!data.agent.enabled && (
        <div className="mt-6 flex items-center gap-2 rounded-2xl border border-[#ffe0ef] bg-[#fff7fb] px-4 py-3 text-sm text-[#ff4f9d]">
          <Power className="h-4 w-4" />
          Agent is paused globally. Product toggles will resume when the global agent is active again.
        </div>
      )}
    </div>
  );
}
