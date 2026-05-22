// The root "/" route is served by app/page.tsx.
// This file exists only to allow (public)/layout.tsx to apply to sibling routes
// (/login, /register, /verify, /forgot-password).
// If Next.js ever resolves this file as a page, redirect to root.
import { redirect } from "next/navigation";

export default function PublicIndexRedirect() {
  redirect("/");
}
