// app/page.tsx
import Image from "next/image";
import Link from "next/link";

import logo from "@/app/components/images/logo-bgremoved.png";
import background from "@/app/components/images/background.png";

export default function Home() {
  return (
    <div className="bg-gray-50">
      {/* ── Hero Section ── */}
      {/*
        Replace "/hero-ship.jpg" with your actual image path once ready.
        The image sits in a relative container; the dark overlay sits on top of
        it, and all text content floats above both via z-10.
      */}
      <section className="relative min-h-screen flex flex-col overflow-hidden">

        {/* Background image — swap src when ready */}
        <Image
          src = {background}
          alt="Background image of a busy port with vessels and cranes"
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "@/app/components/images/background.png" }}
          aria-hidden="true"
        />

        {/* Dark gradient overlay (mimics the reference image) */}
        <div
          className="absolute inset-0 bg-linear-to-r from-black/70 via-black/50 to-black/30"
          aria-hidden="true"
        />

        {/* Fallback colour shown while image loads / before you add it */}
        <div
          className="absolute inset-0 -z-10 bg-slate-800"
          aria-hidden="true"
        />

        {/* ── Header (lives inside the hero) ── */}
        <header className="relative z-10 py-4 md:py-6">
          <div className="container px-4 mx-auto sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">

              {/* Logo */}
              <div className="shrink-0">
                <Link
                  href="/"
                  className="flex rounded outline-none focus:ring-1 focus:ring-white focus:ring-offset-2"
                >
                  <Image
                    src={logo}
                    alt="SmartPort Logo"
                    className="w-auto h-14 md:h-20"
                  />
                </Link>
              </div>

              {/* Mobile Menu Button */}
              <div className="flex lg:hidden">
                <button type="button" className="text-white">
                  <svg
                    className="w-7 h-7"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                </button>
              </div>

              {/* Desktop Nav */}
              <nav className="hidden lg:flex lg:ml-10 xl:ml-16 lg:items-center lg:space-x-8 xl:space-x-12">
                {["Solutions", "Industries", "Pricing", "About"].map((item) => (
                  <Link
                    key={item}
                    href="#"
                    className="text-base font-medium text-white/90 transition-all duration-200 hover:text-white"
                  >
                    {item}
                  </Link>
                ))}
              </nav>

              {/* Right Actions */}
              <div className="hidden lg:ml-auto lg:flex lg:items-center lg:space-x-6">
                <Link
                  href="/login"
                  className="text-base font-medium text-white/90 hover:text-white transition"
                >
                  Sign in
                </Link>

                <Link
                  href="#"
                  className="px-5 py-2 text-base font-semibold text-gray-900 bg-white rounded-xl hover:bg-gray-100 transition"
                >
                  Request Demo
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* ── Hero Content ── */}
        <div className="relative z-10 flex-1 flex items-center">
          <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8 w-full py-16 lg:py-24">
            <div className="max-w-2xl">

              <p className="text-sm font-semibold text-white/60 uppercase tracking-widest">
                Real-time Vessel Tracking&nbsp;·&nbsp;Smart Berthing&nbsp;·&nbsp;Port Intelligence
              </p>

              <h1 className="mt-4 text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
                Intelligent Port Operations,{" "}
                <span className="text-blue-400">Reimagined.</span>
              </h1>

              <p className="mt-6 text-lg text-white/80 max-w-xl">
                SmartPort is a cloud-native platform that enables real-time
                vessel tracking, optimized berthing decisions, and seamless
                port operations. Built for modern ports to improve efficiency,
                visibility, and operational control.
              </p>

              {/* Email capture */}
              <form className="mt-8 sm:mt-10">
                <div className="relative sm:flex sm:items-center sm:bg-white/10 sm:backdrop-blur-sm sm:border sm:border-white/30 sm:rounded-xl sm:p-2">
                  <input
                    type="email"
                    placeholder="Enter your work email"
                    className="block w-full px-4 py-4 text-white placeholder-white/50 bg-white/10 backdrop-blur-sm border border-white/30 rounded-xl outline-none focus:border-white focus:ring-1 focus:ring-white sm:bg-transparent sm:border-none sm:focus:ring-0 sm:rounded-none"
                    required
                  />
                  <div className="mt-4 sm:mt-0 sm:shrink-0 sm:pl-2">
                    <button
                      type="submit"
                      className="w-full sm:w-auto inline-flex justify-center px-6 py-3 text-base font-semibold text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition"
                    >
                      Request Demo
                    </button>
                  </div>
                </div>
              </form>

              {/* Stats */}
              <div className="flex flex-wrap items-center mt-10 gap-y-4 gap-x-6 sm:gap-x-10">
                <div className="flex items-center">
                  <p className="text-3xl font-bold text-white">50+</p>
                  <p className="ml-3 text-sm text-white/70 leading-snug">
                    Active<br />Vessels Tracked
                  </p>
                </div>

                <div className="hidden sm:block h-10 w-px bg-white/20" />

                <div className="flex items-center">
                  <p className="text-3xl font-bold text-white">4.2h</p>
                  <p className="ml-3 text-sm text-white/70 leading-snug">
                    Avg. Turnaround<br />Time
                  </p>
                </div>

                <div className="hidden sm:block h-10 w-px bg-white/20" />

                <div className="flex items-center">
                  <p className="text-3xl font-bold text-white">99.9%</p>
                  <p className="ml-3 text-sm text-white/70 leading-snug">
                    System<br />Uptime
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ── Rest of page (light background resumes here) ── */}
    </div>
  );
}