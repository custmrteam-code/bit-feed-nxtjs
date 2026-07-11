// Students hub (/students) — AI learning intro + the latest free resources.
// Server-rendered (the resource list is bundled JSON); the keyboard stepped
// scroll is a client island.

import type { Metadata } from "next";
import Link from "next/link";
import { latestByTag } from "@/lib/data/resources";
import { SteppedScroll } from "@/components/students/SteppedScroll";
import { SITE_URL } from "@/lib/env";
import "./students.css";

export const metadata: Metadata = {
  title: "AI Learning & Free Student Resources",
  description:
    "Learn Artificial Intelligence with transparency. Access free student resources, credits, discounts, and selected courses on AI.",
  alternates: { canonical: `${SITE_URL}/students` },
};

export default function StudentsPage() {
  const resources = latestByTag("credits", 5);

  return (
    <div className="students-page">
      <SteppedScroll selectors={[".HOME", ".AI_intro", ".resources-section"]} />

      <section className="HOME">
        <h1 className="name">
          Study With <span className="text-red"> Transparency</span>.{" "}
        </h1>
      </section>

      <main style={{ width: "100%" }}>
        <div style={{ width: "100%", maxWidth: 900, margin: "0 auto" }}>
          <p className="topic">ai learn</p>
        </div>
        <hr className="l" />
        <br />

        <article className="AI_intro">
          <section className="intro-section">
            <h2>
              What is{" "}
              <span className="text-red">
                Artificial <br /> Intelligence
              </span>
              ?{" "}
            </h2>
            <p className="info3">
              Artificial intelligence (AI) is a technology that enables computers
              to perform advanced functions typically requiring human
              intelligence, such as learning, reasoning, problem-solving,
              perception, language understanding, and decision-making. At its
              core, AI systems learn and improve through exposure to vast amounts
              of data, identifying patterns and relationships that humans may
              miss.
            </p>
          </section>

          <section className="columns-container">
            <div className="column">
              <h2>
                Why do we <span className="text-red">need</span> AI?
              </h2>
              <p className="info3">
                <span className="text-red">
                  What kind of problems does it solve?
                </span>{" "}
                AI helps solve problems that are too big, too fast, too
                repetitive, or too complex for people to handle alone. In short:
                AI is like an extra-smart helper that learns from data, spots
                patterns, and automates work so humans can focus on creativity,
                judgment, and care.
              </p>
            </div>
            <div className="column">
              <h2>
                When &amp; How did AI <span className="text-red">begin</span>?
              </h2>
              <p className="info3">
                <span className="text-red">In 1950</span>, mathematician Alan
                Turing published a famous paper &quot;Computing Machinery and
                Intelligence&quot; and posed the question: &quot;Can machines
                think?&quot;
              </p>
              <p className="info3">
                He also proposed the Turing Test – a way to check if a machine
                can act so human-like that we can&apos;t tell the difference.
              </p>
            </div>
          </section>

          <hr className="Line2" />
          <div className="footer-link">
            <a href="#">
              <span className="text-red1">Download resources</span>
            </a>
          </div>
          <hr className="Line2" />
        </article>

        <br />
        <br />
        <br />
        <div style={{ width: "100%", maxWidth: 900, margin: "0 auto" }}>
          <p className="topic">free.resources</p>
        </div>
        <hr className="l" />
        <br />
        <br />
        <br />

        <section className="resources-section">
          <table className="resources-table">
            <thead>
              <tr>
                <th scope="col">Resource</th>
                <th scope="col">Value</th>
                <th scope="col">Description</th>
                <th scope="col"></th>
              </tr>
            </thead>
            <tbody>
              {resources.map((item) => (
                <tr key={item.resource}>
                  <td data-label="Resource">{item.resource}</td>
                  <td data-label="Value">{item.value}</td>
                  <td data-label="Description">{item.description}</td>
                  <td>
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noreferrer"
                      className="apply-link"
                    >
                      Apply Now
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <br />
          <br />
          <br />
          <div className="line2">
            <div className="line-with-text">
              <Link href="/students/resources" className="link1">
                read more
              </Link>
            </div>
          </div>
          <br />
          <br />
          <br />
          <br />
        </section>
      </main>
    </div>
  );
}
