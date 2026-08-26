import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { GUIDE_CONFIGS, getGuide } from "@/lib/guides";
import { DEFAULT_SOCIAL_IMAGE } from "@/lib/siteMetadata";

export function generateStaticParams() {
  return Object.keys(GUIDE_CONFIGS).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuide(slug);

  if (!guide) {
    return { title: "Guide ikke fundet | Uddannelsesindsigt" };
  }

  const url = `https://uddannelsesindsigt.com/guides/${guide.slug}`;
  return {
    title: `${guide.seoTitle} | Uddannelsesindsigt`,
    description: guide.description,
    alternates: { canonical: url },
    openGraph: {
      title: guide.seoTitle,
      description: guide.description,
      url,
      siteName: "Uddannelsesindsigt",
      locale: "da_DK",
      type: "article",
      images: [DEFAULT_SOCIAL_IMAGE],
    },
  };
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = getGuide(slug);

  if (!guide) notFound();

  const url = `https://uddannelsesindsigt.com/guides/${guide.slug}`;
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.title,
    description: guide.description,
    mainEntityOfPage: url,
    author: { "@type": "Organization", name: "Uddannelsesindsigt" },
    publisher: { "@type": "Organization", name: "Uddannelsesindsigt" },
    inLanguage: "da-DK",
  };
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Forside", item: "https://uddannelsesindsigt.com" },
      { "@type": "ListItem", position: 2, name: "Guides", item: "https://uddannelsesindsigt.com/guides" },
      { "@type": "ListItem", position: 3, name: guide.title, item: url },
    ],
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-[#12172B]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <Header />

      <main className="max-w-4xl mx-auto px-6 py-10 space-y-8">
        <nav aria-label="Brødkrummer" className="flex flex-wrap items-center gap-2 text-xs text-[#545D71]">
          <Link href="/" className="hover:underline">Forside</Link>
          <span>/</span>
          <Link href="/guides" className="hover:underline">Guides</Link>
          <span>/</span>
          <span className="font-medium text-[#12172B]">{guide.title}</span>
        </nav>

        <article className="space-y-8">
          <header className="space-y-4 border-b border-[#E7E9EF] pb-7">
            <span className="inline-flex rounded-full border border-[#2563EB]/20 bg-[#EFF6FF] px-3 py-1 text-[11px] font-bold text-[#1D4ED8]">
              {guide.badge}
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight font-display">{guide.title}</h1>
            <p className="max-w-3xl text-sm leading-relaxed text-[#545D71]">{guide.intro}</p>
          </header>

          <section className="rounded-xl border border-[#0F9D6E]/20 bg-[#E3F6EE] p-5 sm:p-6">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#0B7A57]">Prøv det i værktøjet</p>
            <h2 className="mt-1 text-lg font-bold font-display">{guide.primaryCta.label}</h2>
            <p className="mt-2 text-xs leading-relaxed text-[#345B4E]">{guide.primaryCta.description}</p>
            <Link
              href={guide.primaryCta.href}
              className="mt-4 inline-flex rounded-lg bg-[#12172B] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2"
            >
              Åbn værktøjet →
            </Link>
          </section>

          {guide.sections.map((section) => (
            <section key={section.title} className="rounded-xl border border-[#E7E9EF] bg-white p-6 sm:p-7 card-shadow">
              <h2 className="text-xl font-bold font-display">{section.title}</h2>
              <div className="mt-3 space-y-3 text-sm leading-relaxed text-[#545D71]">
                {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              </div>
              {section.bullets && (
                <ul className="mt-4 space-y-2 text-sm text-[#545D71]">
                  {section.bullets.map((bullet) => (
                    <li key={bullet} className="flex gap-2">
                      <span aria-hidden="true" className="font-bold text-[#0F9D6E]">✓</span>
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}

          <section aria-labelledby="faq-heading" className="space-y-4">
            <h2 id="faq-heading" className="text-xl font-bold font-display">Ofte stillede spørgsmål</h2>
            <div className="space-y-3">
              {guide.questions.map((item) => (
                <details key={item.question} className="group rounded-xl border border-[#E7E9EF] bg-white p-5">
                  <summary className="cursor-pointer list-none text-sm font-bold text-[#12172B] focus:outline-none focus:ring-2 focus:ring-[#2563EB] rounded">
                    {item.question}
                  </summary>
                  <p className="mt-3 text-xs leading-relaxed text-[#545D71]">{item.answer}</p>
                </details>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-[#D8DBE4] bg-white p-6 space-y-4">
            <h2 className="text-lg font-bold font-display">Læs også</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {guide.relatedLinks.map((link) => (
                <Link key={link.href} href={link.href} className="rounded-lg border border-[#E7E9EF] bg-[#F7F8FA] p-4 hover:bg-[#EFF6FF] hover:border-[#2563EB]/30 transition">
                  <span className="block text-xs font-bold text-[#12172B]">{link.label}</span>
                  <span className="mt-1 block text-[11px] leading-relaxed text-[#545D71]">{link.description}</span>
                </Link>
              ))}
            </div>
          </section>

          <p className="text-[11px] leading-relaxed text-[#8891A3]">
            Uddannelsesindsigt er beslutningsstøtte og ikke en officiel optagelsesmyndighed. Kontrollér altid aktuelle adgangskrav, frister og studieordninger hos uddannelsesstedet og Optagelse.dk.
          </p>
        </article>
      </main>
    </div>
  );
}
