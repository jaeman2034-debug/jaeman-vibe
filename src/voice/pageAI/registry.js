let active = null;
export function setActivePlugin(plugin, ctx) { active = { plugin, ctx }; }
export function clearActivePlugin() { active = null; }
export async function runPageAI(input) { if (!active)
    return false; try {
    const handled = await active.plugin.handle(input, active.ctx);
    return !!handled;
}
catch (e) {
    console.error("PageAI error", e);
    return false;
} }
export function getActiveExamples() { return active?.plugin.examples ?? []; }
