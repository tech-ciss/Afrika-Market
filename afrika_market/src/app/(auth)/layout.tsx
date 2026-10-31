import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container-page py-10 sm:py-16">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-6 text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-xl font-black text-white">
              A
            </span>
            <span className="text-xl font-extrabold tracking-tight text-earth-900">
              AFRIKA <span className="text-brand-600">MARKET</span>
            </span>
          </Link>
        </div>
        {children}
      </div>
    </div>
  );
}
