import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const ADMIN_EMAIL = "admin@school.local";
const ADMIN_PASSWORD = "admin123";

/**
 * Ensures the default admin account exists. Idempotent.
 * Called on app load from the auth page so the user can immediately sign in
 * with username `admin` and password `admin123`.
 */
export const ensureAdminUser = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  // Check if any admin role exists
  const { data: existingAdmins } = await supabaseAdmin
    .from("user_roles")
    .select("user_id")
    .eq("role", "admin")
    .limit(1);

  if (existingAdmins && existingAdmins.length > 0) {
    return { ok: true, created: false };
  }

  // Look up existing user with this email
  const { data: list } = await supabaseAdmin.auth.admin.listUsers();
  let userId = list?.users.find((u) => u.email === ADMIN_EMAIL)?.id;

  if (!userId) {
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: { name: "Administrator", username: "admin" },
    });
    if (error) throw new Error(`Failed to create admin: ${error.message}`);
    userId = created.user.id;
  }

  if (userId) {
    await supabaseAdmin.from("user_roles").upsert({ user_id: userId, role: "admin" });
  }

  return { ok: true, created: true };
});

/**
 * Admin-only: create a new user (teacher or student) with email + password.
 * Returns the new user's auth id.
 */
export const createAppUser = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        email: z.string().email(),
        password: z.string().min(6),
        role: z.enum(["teacher", "student"]),
        name: z.string().min(1),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { name: data.name },
    });
    if (error) throw new Error(error.message);

    await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: created.user.id, role: data.role });

    return { userId: created.user.id };
  });
