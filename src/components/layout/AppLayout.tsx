import TopNav from './TopNav';
import BottomTab from './BottomTab';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-50">
      <TopNav />
      <main className="pb-16">{children}</main>
      <BottomTab />
    </div>
  );
}
