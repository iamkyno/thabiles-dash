export default function PrintLayout({ children }: LayoutProps<"/print">) {
  return <div className="mx-auto max-w-2xl bg-white p-4 text-black sm:p-8 print:p-0">{children}</div>;
}
