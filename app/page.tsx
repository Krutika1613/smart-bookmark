"use client";

import { supabase } from "@/lib/supabase";

export default function Home() {
  const login = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${location.origin}/dashboard`,
      },
    });

    if (error) console.error(error);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 to-purple-600">
      <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-sm text-center">
        <h1 className="text-3xl font-bold mb-6">Smart Bookmark</h1>

        <button
          onClick={login}
          className="w-full py-3 bg-black text-white rounded hover:opacity-90"
        >
          Login with Google
        </button>
      </div>
    </div>
  );
}
