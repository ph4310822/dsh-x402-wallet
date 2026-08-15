/** Sidebar wallet panel: status, balance, and recent payment history. */
import type { InjectFace, PropsLocale, PropsRuntime, PropsStore } from '@deepseek-ai/dsh-client-ui-slots';
import type { X402PanelFace } from './slots.ts';
import { createX402PanelStore } from './store.ts';
/** Full panel props composed by the sidebar footer-action slot. */
export type X402PanelProps = PropsRuntime<'sidebar.footer.action'> & PropsStore<ReturnType<typeof createX402PanelStore>> & InjectFace<X402PanelFace> & PropsLocale<'x402'>;
/** Sidebar entry that opens the wallet panel. */
export declare function X402Panel({ useStore, refresh, t }: X402PanelProps): import("react").JSX.Element;
//# sourceMappingURL=X402Panel.d.ts.map