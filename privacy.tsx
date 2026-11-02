import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — AREM" },
      { name: "description", content: "How AREM collects, uses and protects your account, posts, photos and activity." },
      { property: "og:title", content: "Privacy Policy — AREM" },
      { property: "og:description", content: "How AREM handles your data, photos and videos." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Privacy,
});

const UPDATED = "October 10, 2026";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-xs font-bold uppercase tracking-[0.25em]">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-foreground/80">{children}</div>
    </section>
  );
}

function Privacy() {
  return (
    <div className="safe-top safe-bottom min-h-dvh bg-background font-display text-foreground">
      <main className="mx-auto max-w-2xl px-5 py-8">
        <Link to="/" className="inline-flex h-11 items-center text-[15px] font-semibold">← AREM</Link>
        <h1 className="mt-6 text-3xl font-bold">Privacy Policy</h1>
        <p className="mt-2 text-xs text-muted-foreground">Last updated {UPDATED}</p>
        <p className="mt-6 text-sm leading-relaxed text-foreground/80">AREM is a social network for sharing sneakers. This policy explains what we collect, why, and the choices you have. AREM has no payments, no selling and no ads.</p>

        <Section title="What we collect">
          <p><strong>Account:</strong> your email address, a password (stored only as a secure hash), or your Google account name and email if you sign in with Google.</p>
          <p><strong>Profile:</strong> username, name, bio and profile photo you choose to add.</p>
          <p><strong>Content:</strong> photos and videos you post, the sneaker you tag, captions and style tags.</p>
          <p><strong>Activity:</strong> Rock Its, comments and Calls (sneaker predictions, including your reason and the date).</p>
          <p><strong>Technical:</strong> basic logs such as time of request and device/browser type, used to keep the service secure and working.</p>
          <p>We do not collect your location, contacts, or payment information.</p>
        </Section>

        <Section title="How we use it">
          <p>To run your account, show your posts and activity to other members, calculate AREM features like Trend Scores and your AREM Score, keep the service safe, and fix problems.</p>
          <p>When you ask for an AI analysis of a Call, the sneaker name and the reason you typed are sent to an AI provider to generate the analysis. It is not used to identify you.</p>
          <p>We do not sell your data and do not use it for advertising.</p>
        </Section>

        <Section title="What other people can see">
          <p>Your username, name, bio, profile photo, posts, comments and Calls are public to other AREM users. Your email address and Rock It history are private.</p>
        </Section>

        <Section title="Where it is stored">
          <p>Account data, posts and activity are stored with our cloud backend provider (Supabase, via Lovable Cloud). Photos and videos are kept in private storage and shown through temporary, expiring links. Data is encrypted in transit (HTTPS).</p>
          <p>Our providers process data only to operate AREM on our behalf.</p>
        </Section>

        <Section title="How long we keep it">
          <p>We keep your data while your account exists. When you delete a post, it is removed. When your account is deleted, your profile, posts, comments, Rock Its and Calls are deleted.</p>
        </Section>

        <Section title="Your choices and rights">
          <p>You can edit your profile at any time. You can request a copy of your data or deletion of your account by contacting us. Depending on where you live, you may have additional rights (for example under GDPR or CCPA) to access, correct or delete your data.</p>
        </Section>

        <Section title="Children">
          <p>AREM is not intended for children under 13, and we do not knowingly collect their data.</p>
        </Section>

        <Section title="Changes">
          <p>If we change this policy, we'll update the date above and let you know in the app for significant changes.</p>
        </Section>

        <Section title="Contact">
          <p>Questions or requests: <strong>privacy@arem.app</strong></p>
        </Section>
      </main>
    </div>
  );
}
