import { createFileRoute } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — Booklogy" },
      {
        name: "description",
        content:
          "Start free with one book a month, or go Pro for $9/month with unlimited books and saved history.",
      },
      { property: "og:title", content: "Pricing — Booklogy" },
      {
        property: "og:description",
        content: "Free, Pro at $9/month, and Team at $29/month for shared libraries.",
      },
    ],
  }),
  component: PricingPage,
});

const tiers = [
  {
    name: "Free",
    price: "$0",
    note: "Try it on one book",
    features: ["1 book per month", "Top 5 ideas + use cases", "7-day action plan", "No saved history"],
    cta: "Start free",
    href: "/",
    highlight: false,
  },
  {
    name: "Pro",
    price: "$9",
    note: "For people who read a lot",
    features: [
      "Unlimited books",
      "Faster AI processing",
      "Saved plan history",
      "Priority support",
    ],
    cta: "Upgrade to Pro",
    href: "https://buy.stripe.com/test_pro_plan",
    highlight: true,
  },
  {
    name: "Team",
    price: "$29",
    note: "Coming soon",
    features: ["5 users", "Shared book library", "Team action plans", "Priority support"],
    cta: "Join the waitlist",
    href: "https://buy.stripe.com/test_team_plan",
    highlight: false,
  },
];

function PricingPage() {
  return (
    <div className="bg-hero">
      <section className="mx-auto w-full max-w-5xl px-5 py-16">
        <div className="max-w-2xl">
          <h1 className="text-4xl leading-tight sm:text-5xl">Simple pricing</h1>
          <p className="mt-3 text-muted-foreground">
            Every plan turns books into action. Pick how many you want to work through.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`flex flex-col rounded-2xl border bg-card p-6 shadow-paper ${
                tier.highlight ? "border-primary ring-1 ring-primary/30" : "border-border"
              }`}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl">{tier.name}</h2>
                {tier.highlight && (
                  <span className="rounded-full bg-accent px-2.5 py-1 text-[11px] font-medium text-accent-foreground">
                    Most popular
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{tier.note}</p>
              <p className="mt-5 flex items-baseline gap-1">
                <span className="font-display text-4xl">{tier.price}</span>
                {tier.price !== "$0" && (
                  <span className="text-sm text-muted-foreground">/month</span>
                )}
              </p>
              <ul className="mt-6 flex-1 space-y-3 text-sm">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Button
                asChild
                variant={tier.highlight ? "default" : "outline"}
                className="mt-7 w-full"
              >
                <a href={tier.href}>{tier.cta}</a>
              </Button>
            </div>
          ))}
        </div>

        <p className="mt-8 text-xs text-muted-foreground">
          Pro and Team checkout link to Stripe Payment Links — swap the URLs for your own live links.
        </p>
      </section>
    </div>
  );
}
