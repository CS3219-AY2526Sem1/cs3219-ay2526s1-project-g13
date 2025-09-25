import AuthForm from "./AuthForm";
import Navbar from "./NavBar";
import VerifyAccountPage from "./verifyAcc";

export default function Page() {
  return (
    <main>
      <div className="w-full bg-[#20222E] text-white flex items-center justify-between px-4 py-2">
        <h1 className="text-xl font-bold">PeerPrep</h1>
        <Navbar />
      </div>
      <AuthForm />
    </main>
  );
}
