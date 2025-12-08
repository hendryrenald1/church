import { NextResponse } from "next/server";

// Placeholder: handled client-side with supabase.auth.signInWithPassword
export async function POST() {
  return NextResponse.json({ message: "Use Supabase client-side login" });
}

