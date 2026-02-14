"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Dashboard() {
  const router = useRouter();
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();

      if (!data.session) {
        router.replace("/");
        return;
      }

      await load();
    };

    init();

    // const channel = supabase
    //   .channel("bookmarks")
    //   .on(
    //     "postgres_changes",
    //     { event: "*", schema: "public", table: "bookmarks" },
    //     () => load()
    //   )
    //   .subscribe();


    const channel = supabase
  .channel("bookmarks")

  // listen to NEW bookmarks
  .on(
    "postgres_changes",
    { event: "INSERT", schema: "public", table: "bookmarks" },
    //() => load()
    payload => setBookmarks(prev => [payload.new as any, ...prev])
  )

  // listen to DELETES
  .on(
    "postgres_changes",
    { event: "DELETE", schema: "public", table: "bookmarks" },
    //() => load()
    payload => setBookmarks(prev => prev.filter(b => b.id !== payload.old.id))
  )

  .subscribe();


    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function load() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data } = await supabase
      .from("bookmarks")
      .select()
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    setBookmarks(data || []);
  }

  async function add() {
    if (!title || !url) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data } = await supabase
      .from("bookmarks")
      .insert({
        title,
        url,
        user_id: user!.id,
      })
      .select()
      .single();

    if (data) setBookmarks((prev) => [data, ...prev]);

    setTitle("");
    setUrl("");
  }

  async function remove(id: string) {
    await supabase.from("bookmarks").delete().eq("id", id);

    setBookmarks((prev) => prev.filter((b) => b.id !== id));
  }

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/");
  }

  return (
    <div
      className="min-h-screen bg-cover bg-center flex items-center justify-center"
      style={{
        backgroundImage:
          "url('https://images.unsplash.com/photo-1507842217343-583bb7270b66')",
      }}
    >
      {/* dark overlay */}
      <div className="absolute inset-0 bg-black/60"></div>

      <div className="relative max-w-xl w-full bg-white/95 rounded-xl shadow-xl p-6 mx-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-indigo-700">
            Smart Bookmark
          </h1>

          <button onClick={logout} className="text-sm text-red-500">
            Logout
          </button>
        </div>

        <input
          className="border p-2 w-full mb-2 rounded"
          placeholder="Bookmark title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <input
          className="border p-2 w-full mb-3 rounded"
          placeholder="https://example.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />

        <button
          onClick={add}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded"
        >
          Add Bookmark
        </button>

        <div className="mt-6 space-y-3 max-h-64 overflow-y-auto">
          {bookmarks.map((b) => (
            <div
              key={b.id}
              className="border rounded p-3 flex justify-between items-center"
            >
              <a
                href={b.url}
                target="_blank"
                className="text-indigo-600 underline"
              >
                {b.title}
              </a>

              <button onClick={() => remove(b.id)}>❌</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
