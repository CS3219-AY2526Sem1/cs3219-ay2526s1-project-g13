/**
 * A minimal top bar (no navigation links)
 * Shown only on public/auth pages (e.g. login, register, forgot password).
 * Use NavBar instead when the user is authenticated.
 */

export default function Header() {
  return (
    <div className="w-full bg-[#20222E] text-white flex items-center justify-between px-4 py-2">
      <h1 className="text-xl font-bold">PeerPrep</h1>
    </div>
  );
}
