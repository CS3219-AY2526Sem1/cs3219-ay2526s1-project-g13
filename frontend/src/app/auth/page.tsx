"use client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";
import SignInForm from "@/components/auth/sign-in-form";
import SignUpForm from "@/components/auth/sign-up-form";
import { useRouter } from "next/navigation";
import Header from "@/components/ui/header";
import { Home } from "lucide-react";

export default function AuthPage() {
  const router = useRouter();

  return (
    <div>
      <Header />
      <div className="min-h-screen flex items-center justify-center gap-30 p-2 sm:p-4 md:p-8 lg:p-12 xl:p-20">
        <div className="flex flex-col items-center mb-10 gap-4">
          <h1 className="scroll-m-20 text-center text-4xl font-extrabold tracking-tight text-balance">
            Welcome to PeerPrep
          </h1>
          <h3 className="scroll-m-20 text-center text-2xl font-semibold tracking-tight text-balance">
            Collaborate, learn, and prepare for your technical interviews with peers
          </h3>
          <Image src="/images/peerprep.png" alt="PeerPrep" width={400} height={400} />
        </div>
        <div className="w-full max-w-sm flex-col gap-6 flex">
          <Tabs defaultValue="sign-in">
            <TabsList className="grid w-full grid-cols-3 items-center text-center">
              <div className="flex justify-center">
                <Home
                  className="text-muted-foreground hover:cursor-pointer text-2xl"
                  onClick={() => router.push("/")}
                />
              </div>
              <div className="flex justify-center">
                <TabsTrigger value="sign-in">Sign In</TabsTrigger>
              </div>
              <div className="flex justify-center">
                <TabsTrigger value="sign-up">Sign Up</TabsTrigger>
              </div>
            </TabsList>

            {/* Sign In */}
            <TabsContent value="sign-in">
              <SignInForm />
            </TabsContent>

            {/* Sign Up */}
            <TabsContent value="sign-up">
              <SignUpForm />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
