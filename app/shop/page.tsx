import { Suspense } from "react";
import { ShopView } from "../../components/shop-view";

export const dynamic = "force-dynamic";

export default function ShopPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-[60vh] flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full border-4 border-[#093d2b] border-t-transparent animate-spin" />
            <p className="text-sm font-semibold text-gray-600">শপ পেইজ লোড হচ্ছে...</p>
          </div>
        </main>
      }
    >
      <ShopView />
    </Suspense>
  );
}
