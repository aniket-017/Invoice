interface LayoutProps {
  sidebar: React.ReactNode;
  children: React.ReactNode;
}

export default function Layout({ sidebar, children }: LayoutProps) {
  return (
    <div className="flex min-h-screen">
      <aside className="no-print w-56 shrink-0 border-r border-slate-200 bg-white shadow-soft">
        <div className="sticky top-0 py-4">
          <h1 className="px-4 text-lg font-bold text-primary-700">Barcode Billing</h1>
          {sidebar}
        </div>
      </aside>
      <main className="min-w-0 flex-1 p-6 md:p-8">{children}</main>
    </div>
  );
}
