"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Dashboard() {
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");

  useEffect(() => {
    load();

    const channel = supabase
      .channel("bookmarks")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookmarks" },
        () => load()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function load() {
    const { data } = await supabase
      .from("bookmarks")
      .select()
      .order("created_at", { ascending: false });

    setBookmarks(data || []);
  }

  async function add() {
    if (!title || !url) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    await supabase.from("bookmarks").insert({
      title,
      url,
      user_id: user?.id,
    });

    setTitle("");
    setUrl("");
  }

  async function remove(id: string) {
    await supabase.from("bookmarks").delete().eq("id", id);
  }

  async function logout() {
    await supabase.auth.signOut();
    location.href = "/";
  }

  return (
    <div
      className="min-h-screen bg-cover bg-center flex items-center justify-center"
      style={{
        backgroundImage:
          "url('https://images.unsplash.com/photo-1524995997946-a1c2e315a42f')",
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/50"></div>

      <div className="relative max-w-xl w-full bg-white rounded-xl shadow-xl p-6 mx-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Smart Bookmark</h1>
          <button onClick={logout} className="text-sm text-red-500">
            Logout
          </button>
        </div>

        <input
          className="border p-2 w-full mb-2 rounded"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <input
          className="border p-2 w-full mb-2 rounded"
          placeholder="URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />

        <button
          onClick={add}
          className="w-full bg-indigo-600 text-white py-2 rounded"
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
                className="text-indigo-600"
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
