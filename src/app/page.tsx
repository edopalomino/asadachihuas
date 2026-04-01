import FirebaseInit from "@/components/FirebaseInit";
import LiveMenuExperience from "@/components/LiveMenuExperience";
import {
  businessConfig,
  extraProducts,
  featuredProducts,
  serviceHighlights,
} from "@/data/menu";

export default function Home() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#fffaf5_0%,#fff1e4_34%,#fffdf9_100%)] pb-40">
      <FirebaseInit />
      <div className="mx-auto flex w-full max-w-3xl flex-col px-4 pb-10 pt-4 sm:px-6 sm:pt-6">
        <LiveMenuExperience
          featuredProducts={featuredProducts}
          extraProducts={extraProducts}
          businessConfig={businessConfig}
          serviceHighlights={serviceHighlights}
        />
      </div>
    </main>
  );
}
