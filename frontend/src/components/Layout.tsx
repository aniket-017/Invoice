interface LayoutProps {
  sidebar: React.ReactNode;
  children: React.ReactNode;
}

export default function Layout({ sidebar, children }: LayoutProps) {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="no-print w-full shrink-0 border-b border-slate-200 bg-white shadow-soft md:w-56 md:border-b-0 md:border-r">
        <div className="md:sticky md:top-0 py-4">
          <h1 className="px-4 text-lg font-bold text-primary-700">Khatu Shyam Books Store</h1>
          {sidebar}
        </div>
      </aside>
      <main className="min-w-0 flex-1 p-4 sm:p-6 md:p-8">{children}</main>
    </div>
  );
}
