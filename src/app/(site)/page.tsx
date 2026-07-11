// Homepage (Server Component). Featured stories are fetched + rendered on the
// server for SEO/latency; the hero typewriter, realtime latest-news ticker,
// promo banner and keyboard interactions are client islands. Top News is a
// curated static section (ported verbatim from main/index.html).

import Link from "next/link";
import { getFeaturedNews } from "@/lib/data/articles.server";
import { FeaturedCards } from "@/components/home/FeaturedCards";
import { Typewriter } from "@/components/home/Typewriter";
import { LatestTicker } from "@/components/home/LatestTicker";
import { Promo } from "@/components/home/Promo";
import { HomeInteractions } from "@/components/home/HomeInteractions";
import "./home.css";

// Revalidate featured stories periodically (ISR) for fast, cached delivery.
export const revalidate = 300;

export default async function HomePage() {
  const featured = await getFeaturedNews();

  return (
    <>
      <Promo />
      <HomeInteractions />

      <main className="main home-page">
        <section className="HOME">
          <Typewriter />
          <p id="team">by custmr.team</p>
        </section>

        <section className="PAGE page1">
          <p className="topic">Featured</p>
          <hr className="Line1" />
          <br />
          <br />
          <FeaturedCards articles={featured} />
          <br />
        </section>

        <section className="PAGE">
          <p className="topic">Latest news</p>
          <hr className="Line1" />
          <br />
          <LatestTicker />
          <br />
          <br />
          <br />
          <div className="line2">
            <div className="line-with-text">
              <Link href="/articles" className="link1">
                read more
              </Link>
            </div>
          </div>
          <br />
          <br />
          <br />
          <br />
        </section>

        <section className="PAGE">
          <p className="topic">Top news</p>
          <hr className="Line1" />

          <article className="highlights">
            <section className="column left">
              <h1>BUDGET 2026: THE &apos;VIKSIT BHARAT&apos; ACCELERATOR</h1>

              <section className="item">
                <h2>THE THREE KARTAVYAS:</h2>
                <p>
                  The FM anchored the ₹53.5 lakh crore budget on sustaining
                  growth, fulfilling citizen aspirations, and ensuring inclusive
                  &quot;Sabka Vikas&quot; across all regions.
                </p>
              </section>

              <section className="item">
                <h2>MANUFACTURING &amp; SHAKTI:</h2>
                <p>
                  Launched Biopharma SHAKTI with a ₹10,000 crore outlay to turn
                  India into a global hub, alongside a ₹40,000 crore electronics
                  manufacturing boost.
                </p>
              </section>

              <section className="item">
                <h2>TAX EVOLUTION 2.0:</h2>
                <p>
                  Announced the comprehensive New Income Tax Act, 2025, which
                  aims to replace the colonial-era framework with a modern,
                  digital-first tax code starting April 2026. Tax compliance is
                  being &quot;humanized&quot; through the introduction of
                  pre-filled, simplified filing forms and a dedicated taxpayer
                  assistance portal.
                </p>
              </section>
            </section>

            <section className="column right">
              <section className="date date1">04 FEBRUARY 2026</section>

              <section className="item">
                <h2>INFRASTRUCTURE ENGINE:</h2>
                <p>
                  Stepped up Capital Expenditure to a record ₹12.2 lakh crore.
                  Key moves include 7 High-Speed Rail corridors and 20 new
                  National Waterways.
                </p>
              </section>

              <section className="item">
                <h2>MSME CHAMPION FUND:</h2>
                <p>
                  Introduced a ₹10,000 crore SME Growth Fund to scale units into
                  &quot;Global Champions&quot; and &quot;Corporate Mitras&quot;
                  to simplify business compliance.
                </p>
              </section>

              <section className="item">
                <h2>GREEN TRANSITION:</h2>
                <p>
                  Allocated ₹20,000 crore for Carbon Capture (CCUS) and exempted
                  customs duty on nuclear equipment to accelerate the Net-Zero
                  industrial economy.
                </p>
              </section>

              <section className="item">
                <h2>WELLNESS &amp; &apos;SILVER&apos; ECONOMY:</h2>
                <p>
                  Launched a specialized Caregiver Training Scheme for 1.5 lakh
                  professionals and announced NIMHANS-2. Also, the government has
                  established a one-time, six-month compliance window for
                  providing citizens fair opportunity to regularize their
                  holdings without facing heavy litigation or punitive penalties.
                </p>
              </section>
            </section>
          </article>
        </section>

        <br />
        <br />
        <br />
        <a href="#" className="topic">
          bitfeed initiatives
        </a>
        <br />
        <br />
        <hr className="Line1" />
        <br />
        <br />
        <br />
      </main>
    </>
  );
}
