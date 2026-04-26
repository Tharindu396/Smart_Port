// app/components/Footer.tsx
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-white dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 pt-16 pb-8 sm:px-6 lg:px-8 lg:pt-24">
        
        {/* CTA Section */}
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-5xl dark:text-white">
            Transform Your Port Operations
          </h2>

          <p className="mx-auto mt-4 max-w-md text-gray-500 dark:text-gray-400">
            Leverage real-time vessel tracking, intelligent berthing, and
            operational analytics to optimize efficiency and decision-making.
          </p>

          <Link
            href="#"
            className="mt-8 inline-block rounded-full border border-blue-600 px-12 py-3 text-sm font-medium text-white bg-gray-900 hover:bg-gray-700 transition"
          >
            Request Demo
          </Link>
        </div>

        {/* Bottom Section */}
        <div className="mt-16 border-t border-gray-100 pt-8 sm:flex sm:items-center sm:justify-between lg:mt-24 dark:border-gray-800">
          
          {/* Links */}
          <ul className="flex flex-wrap justify-center gap-4 text-xs lg:justify-start">
            <li>
              <Link
                href="#"
                className="text-gray-500 transition hover:opacity-75 dark:text-gray-400"
              >
                Terms & Conditions
              </Link>
            </li>

            <li>
              <Link
                href="#"
                className="text-gray-500 transition hover:opacity-75 dark:text-gray-400"
              >
                Privacy Policy
              </Link>
            </li>

            <li>
              <Link
                href="#"
                className="text-gray-500 transition hover:opacity-75 dark:text-gray-400"
              >
                Cookies
              </Link>
            </li>
          </ul>

          {/* Social Icons */}
          <ul className="mt-8 flex justify-center gap-6 sm:mt-0 lg:justify-end">
            
            {/* Facebook */}
            <li>
              <a
                href="#"
                target="_blank"
                rel="noreferrer"
                className="text-gray-700 transition hover:opacity-75 dark:text-gray-200"
              >
                <span className="sr-only">Facebook</span>
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                  />
                </svg>
              </a>
            </li>

            {/* Twitter */}
            <li>
              <a
                href="#"
                target="_blank"
                rel="noreferrer"
                className="text-gray-700 transition hover:opacity-75 dark:text-gray-200"
              >
                <span className="sr-only">Twitter</span>
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675..." />
                </svg>
              </a>
            </li>

            {/* GitHub */}
            <li>
              <a
                href="#"
                target="_blank"
                rel="noreferrer"
                className="text-gray-700 transition hover:opacity-75 dark:text-gray-200"
              >
                <span className="sr-only">GitHub</span>
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017..."
                  />
                </svg>
              </a>
            </li>
          </ul>
        </div>

        {/* Copyright */}
        <p className="mt-8 text-center text-xs text-gray-500 dark:text-gray-400">
          © {new Date().getFullYear()} SmartPort. All rights reserved.
        </p>
      </div>
    </footer>
  );
}