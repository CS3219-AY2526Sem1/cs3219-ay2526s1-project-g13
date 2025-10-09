import Header from "@/components/ui/header";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function LandingPage() {
  return (
    <main>
      <Header />
      <section className="bg-background min-h-screen flex flex-col items-center justify-center text-center p-6">
        <h1 className="text-4xl sm:text-5xl font-extrabold mb-4">Welcome to PeerPrep</h1>
        <p className="text-lg sm:text-xl text-gray-700 mb-6 max-w-2xl">
          Your personal platform to sharpen coding skills, practice technical interviews, and
          prepare confidently for your next job. Solve challenges, track progress, and collaborate
          with peers to level up your interview game.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
          <Link href="/auth" className="flex-1">
            <Button className="w-full">Get Started</Button>
          </Link>
          <Link href="/matching" className="flex-1">
            <Button variant="outline" className="w-full">
              Start Matching
            </Button>
          </Link>
        </div>
      </section>
    </main>
  );
}
