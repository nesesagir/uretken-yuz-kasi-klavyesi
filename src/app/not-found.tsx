import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <div className="max-w-md text-center">
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
          Üretken Yüz Kası Klavyesi
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">Sayfa bulunamadı</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Bu adres ürün içinde yok. Ana sayfadan iletişime veya bakım paneline dönebilirsiniz.
        </p>
        <Link
          href="/"
          className="cta-primary mt-6 inline-flex min-h-12 items-center justify-center rounded-2xl px-5 text-sm font-semibold"
        >
          Ana sayfa
        </Link>
      </div>
    </main>
  );
}
