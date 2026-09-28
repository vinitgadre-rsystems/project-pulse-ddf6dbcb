import { createFileRoute } from "@tanstack/react-router";

// TEMPORARY one-time admin bootstrap. Deleted immediately after use.
export const Route = createFileRoute("/api/public/setup-admin-once")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (request.headers.get("x-setup-key") !== process.env["LOVABLE_CRON_SECRET"]) {
          return new Response("Forbidden", { status: 403 });
        }
        const { email, password } = (await request.json()) as { email: string; password: string };
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        let userId: string | undefined;
        const created = await supabaseAdmin.auth.admin.createUser({ email, password, email_confirm: true });
        if (created.error) {
          const list = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
          const u = list.data.users.find((x) => x.email?.toLowerCase() === email.toLowerCase());
          if (!u) return new Response(created.error.message, { status: 500 });
          userId = u.id;
          const upd = await supabaseAdmin.auth.admin.updateUserById(u.id, { password, email_confirm: true });
          if (upd.error) return new Response(upd.error.message, { status: 500 });
        } else userId = created.data.user.id;
        const { error } = await supabaseAdmin.from("user_roles").upsert({ user_id: userId!, role: "admin" }, { onConflict: "user_id,role" });
        if (error) return new Response(error.message, { status: 500 });
        return Response.json({ ok: true });
      },
    },
  },
});
