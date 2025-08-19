import type { PageAIPlugin, PageAIContext } from "./types";

let active: { plugin: PageAIPlugin; ctx: PageAIContext } | null = null;

export function setActivePlugin(plugin: PageAIPlugin, ctx: PageAIContext) {
  active = { plugin, ctx };
}

export function clearActivePlugin() { active = null; }

export async function runPageAI(input: string): Promise<boolean> {
  if (!active) return false;
  try {
    const handled = await active.plugin.handle(input, active.ctx);
    return !!handled;
  } catch (e) {
    console.error("PageAI error", e);
    return false;
  }
}

export function getActiveExamples(): string[] {
  return active?.plugin.examples ?? [];
} 