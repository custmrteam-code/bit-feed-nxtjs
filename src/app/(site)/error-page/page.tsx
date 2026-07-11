// "Page Under Development" — ported from others/x-error.html. Reached via the
// sidebar "artificial intelligence" link and the `i` keyboard shortcut.

import type { Metadata } from "next";
import "./error-page.css";

export const metadata: Metadata = {
  title: "Page Under Development",
  robots: { index: false },
};

export default function ErrorPage() {
  return (
    <main className="xerror-main">
      <div className="xerror-cat">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 733 673"
          className="catbody"
        >
          <path
            fill="#212121"
            d="M111.002 139.5C270.502 -24.5001 471.503 2.4997 621.002 139.5C770.501 276.5 768.504 627.5 621.002 649.5C473.5 671.5 246 687.5 111.002 649.5C-23.9964 611.5 -48.4982 303.5 111.002 139.5Z"
          />
          <path fill="#212121" d="M184 9L270.603 159H97.3975L184 9Z" />
          <path fill="#212121" d="M541 0L627.603 150H454.397L541 0Z" />
        </svg>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 158 564"
          className="tail"
        >
          <path
            fill="#191919"
            d="M5.97602 76.066C-11.1099 41.6747 12.9018 0 51.3036 0V0C71.5336 0 89.8636 12.2558 97.2565 31.0866C173.697 225.792 180.478 345.852 97.0691 536.666C89.7636 553.378 73.0672 564 54.8273 564V564C16.9427 564 -5.4224 521.149 13.0712 488.085C90.2225 350.15 87.9612 241.089 5.97602 76.066Z"
          />
        </svg>
        <div className="text7">
          <span className="bigzzz">Z</span>
          <span className="zzz">Z</span>
        </div>
      </div>
      <h3>4o4 Under Development...</h3>
    </main>
  );
}
