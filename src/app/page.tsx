/**
 * Landing Page - Public
 * Product showcase and marketing page for HisaabApp
 */

"use client";

import { Button } from "@/components/ui/button";
import { 
  Check,
  IndianRupee,
  Zap,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { warmupService } from "@/lib/api/services/warmup.service";
import {
  fadeIn,
  fadeInUp,
  fadeInLeft,
  fadeInRight,
  fadeInDown,
  staggerContainer,
  staggerContainerSlow,
  scaleIn,
} from "@/lib/animations";

// ─────────────────────────────────────────────
// Scroll-triggered section wrapper
// ─────────────────────────────────────────────
function InViewSection({
  children,
  className,
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.section
      ref={ref}
      id={id}
      className={className}
      variants={staggerContainer}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
    >
      {children}
    </motion.section>
  );
}

export default function LandingPage() {
  const keepaliveIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    warmupService.keepBackendWarm();
    keepaliveIntervalRef.current = warmupService.startBackendKeepalive(4 * 60 * 1000) as any;
    return () => {
      if (keepaliveIntervalRef.current) {
        warmupService.stopBackendKeepalive(keepaliveIntervalRef.current);
      }
    };
  }, []);

  // JSON-LD structured data for SEO
  useEffect(() => {
    const schemaData = {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "HisaabApp",
      "description": "Complete business billing and customer management solution",
      "url": "https://hisaabapp.in",
      "applicationCategory": "BusinessApplication",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "INR",
        "description": "14-day free trial"
      },
      "author": {
        "@type": "Organization",
        "name": "HisaabApp",
        "url": "https://hisaabapp.in"
      }
    };
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(schemaData);
    document.head.appendChild(script);
    return () => { document.head.removeChild(script); };
  }, []);

  const pricingPlans = [
    {
      name: "Basic",
      price: "99",
      description: "Perfect for small to growing businesses",
      popular: false,
      features: [
        "Up to 1,000 customers",
        "Up to 100 messages/month",
        "Up to 3 branches",
        "Up to 5 team members",
        "SMS & WhatsApp reminders",
        "Multi-branch support",
        "Team collaboration",
        "Basic analytics",
      ],
      buttonText: "Start Free Trial",
    },
    {
      name: "Premium",
      price: "499",
      description: "For large businesses",
      popular: true,
      features: [
        "Unlimited customers",
        "Up to 500 messages/month",
        "Unlimited branches",
        "Unlimited team members",
        "SMS + WhatsApp reminders",
        "Advanced analytics",
        "Excel export",
        "Payment reminders",
        "Priority support",
        "Custom branding",
      ],
      buttonText: "Start Free Trial",
    },
    {
      name: "Enterprise",
      priceLabel: "Custom",
      description: "For enterprise needs",
      popular: false,
      features: [
        "Everything in Premium",
        "Unlimited messages/month",
        "Custom integrations",
        "Dedicated account manager",
        "24/7 priority support",
        "Advanced security features",
        "Custom development",
        "SLA guarantee",
      ],
      buttonText: "Contact Sales",
    },
  ];

  return (
    <div className="min-h-screen bg-white" style={{ scrollBehavior: "smooth" }}>

      {/* ── Navigation ── */}
      <motion.nav
        className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-200"
        variants={fadeInDown}
        initial="hidden"
        animate="visible"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <motion.div className="flex items-center gap-2" variants={fadeInLeft}>
              <Image src="/icons/HisaabAApplogo.svg" alt="HisaabApp Logo" width={40} height={40} className="w-10 h-10" />
              <span className="text-xl font-bold text-stone-900">HisaabApp</span>
            </motion.div>

            <motion.div
              className="hidden md:flex items-center gap-8"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              {[
                { label: "Features", href: "#features" },
                { label: "Pricing", href: "#pricing" },
                { label: "Support", href: "#footer" },
              ].map((item) => (
                <motion.a
                  key={item.label}
                  href={item.href}
                  className="text-sm text-gray-600 hover:text-emerald-600 transition-colors font-medium"
                  variants={fadeIn}
                >
                  {item.label}
                </motion.a>
              ))}
            </motion.div>

            <motion.div className="flex items-center gap-3" variants={fadeInRight}>
              <Link href="/login">
                <Button variant="ghost" className="text-stone-600 hover:text-stone-900">Login</Button>
              </Link>
              <Link href="/register">
                <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-6 shadow-sm">
                    Try for Free
                  </Button>
                </motion.div>
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.nav>

      {/* ── Hero Section ── */}
      <section className="bg-gradient-to-br from-slate-50 via-emerald-50/30 to-white py-16 lg:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">

            {/* Left — text */}
            <motion.div
              className="space-y-6"
              variants={staggerContainerSlow}
              initial="hidden"
              animate="visible"
            >
              {/* Eyebrow */}
              <motion.div variants={fadeInUp}>
                <span className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-emerald-200">
                  <Zap className="h-3 w-3" />
                  Made for Indian Businesses
                </span>
              </motion.div>

              <motion.h1
                className="text-4xl lg:text-5xl font-bold text-stone-900 leading-tight"
                variants={fadeInLeft}
              >
                The Smart{" "}
                <span className="text-emerald-600">Hisaab</span>
                <br />
                Your Business Deserves
              </motion.h1>

              <motion.p className="text-lg text-stone-600 max-w-lg leading-relaxed" variants={fadeInLeft}>
                Stop managing customer dues in notebooks. HisaabApp tracks payments, sends WhatsApp reminders, and generates invoices — all in one place.
              </motion.p>

              <motion.div className="flex flex-col sm:flex-row gap-4" variants={fadeInUp}>
                <Link href="/register">
                  <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                    <Button
                      size="lg"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-8 h-12 shadow-md gap-2"
                    >
                      Start for Free
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </motion.div>
                </Link>
              </motion.div>

              <motion.div
                className="flex flex-wrap items-center gap-5 pt-2 text-sm text-stone-500"
                variants={fadeIn}
              >
                {["14-day free trial", "No credit card needed", "Cancel anytime"].map((t) => (
                  <div key={t} className="flex items-center gap-1.5">
                    <Check className="h-4 w-4 text-emerald-500" />
                    <span>{t}</span>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            {/* Right — video */}
            <motion.div
              className="relative"
              variants={fadeInRight}
              initial="hidden"
              animate="visible"
            >
              <motion.div
                className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-stone-200"
                whileHover={{ scale: 1.01 }}
                transition={{ duration: 0.3 }}
              >
                <video autoPlay loop muted playsInline className="w-full h-auto">
                  <source src="/video/home_video.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </motion.div>

              {/* Revenue Card Overlay */}
              <motion.div
                className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-lg p-4 border border-stone-100"
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.7, type: "spring", stiffness: 200, damping: 20 }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <IndianRupee className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs text-stone-500">Monthly Collected</p>
                    <p className="text-lg font-bold text-stone-900">Rs. 2,45,000</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>



      {/* ── Features Bento Grid ── */}
      <InViewSection id="features" className="py-20 bg-[#F5F0E8]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div className="text-center mb-14" variants={fadeInUp}>
            <h2 className="text-3xl lg:text-4xl font-black text-stone-900 mb-3">
              Everything in one place
            </h2>
            <p className="text-lg text-stone-500 max-w-xl mx-auto">
              From customer records to automated reminders — your complete hisaab system.
            </p>
          </motion.div>

          {/* Bento grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto">

            {/* 1 — Customer Management: col-span-2, golden amber */}
            <motion.div
              variants={fadeInUp}
              whileHover={{ scale: 1.018, transition: { duration: 0.22, ease: "easeOut" } }}
              className="md:col-span-2 bg-amber-400 rounded-3xl p-8 min-h-[290px] flex flex-col justify-between relative overflow-hidden cursor-default"
            >
              {/* Giant decorative number */}
              <div className="absolute -top-4 -right-6 text-[130px] font-black leading-none text-amber-900/10 select-none pointer-events-none">
                ∞
              </div>
              <div className="relative z-10">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-amber-900 mb-3">Customer Management</p>
                <h3 className="text-3xl font-black text-amber-950 leading-none mb-3">
                  Everyone&apos;s dues.<br />One place.
                </h3>
                <p className="text-amber-950/80 text-sm max-w-xs leading-relaxed font-medium">
                  Add unlimited customers, track payment history, and keep every contact organised.
                </p>
              </div>
              <div className="flex gap-2 flex-wrap relative z-10">
                {["Unlimited customers", "Payment history", "Profiles"].map((tag) => (
                  <span key={tag} className="text-xs bg-amber-950/10 border border-amber-950/15 text-amber-950 px-3 py-1.5 rounded-full font-semibold">
                    {tag}
                  </span>
                ))}
              </div>
            </motion.div>

            {/* 2 — Smart Invoicing: dark stone */}
            <motion.div
              variants={fadeInUp}
              whileHover={{ scale: 1.018, transition: { duration: 0.22, ease: "easeOut" } }}
              className="bg-stone-900 rounded-3xl p-7 min-h-[290px] flex flex-col justify-between cursor-default"
            >
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-stone-400 mb-3">Smart Invoicing</p>
                <h3 className="text-2xl font-black text-white leading-tight">PDF.<br />One tap.</h3>
              </div>
              {/* CSS invoice card */}
              <div className="bg-white rounded-2xl p-4">
                <div className="flex justify-between items-center mb-3">
                  <p className="text-[10px] text-stone-600 font-black uppercase tracking-wide">Invoice #1042</p>
                  <span className="text-[9px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-black">Sent ✓</span>
                </div>
                <div className="space-y-1.5 mb-3">
                  {[["Milk · 30L", "Rs.900"], ["Curd · 5kg", "Rs.350"], ["Butter", "Rs.240"]].map(([item, price]) => (
                    <div key={item} className="flex justify-between text-[10px]">
                      <span className="text-stone-600 font-medium">{item}</span>
                      <span className="font-bold text-stone-800">{price}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-stone-100 pt-2 flex justify-between items-center">
                  <span className="text-[10px] text-stone-600 font-black uppercase tracking-wide">Total</span>
                  <span className="text-sm font-black text-emerald-600">Rs.1,490</span>
                </div>
              </div>
            </motion.div>

            {/* 3 — Reminders: sky blue */}
            <motion.div
              variants={fadeInUp}
              whileHover={{ scale: 1.018, transition: { duration: 0.22, ease: "easeOut" } }}
              className="bg-sky-500 rounded-3xl p-7 min-h-[260px] flex flex-col justify-between cursor-default"
            >
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-white/80 mb-3">Reminders</p>
                <h3 className="text-2xl font-black text-white leading-tight">Collect on time.<br />Every time.</h3>
              </div>
              {/* Chat bubble UI */}
              <div className="space-y-2">
                <div className="bg-white/20 rounded-2xl rounded-tl-sm px-3.5 py-2.5 w-fit">
                  <p className="text-xs text-white font-bold">⏰ Due: Rs.500 pending</p>
                  <p className="text-[10px] text-white/70 font-medium mt-0.5">HisaabApp · just now</p>
                </div>
                <div className="bg-white rounded-2xl rounded-tr-sm px-3.5 py-2.5 w-fit ml-auto shadow-md">
                  <p className="text-xs text-sky-900 font-bold">Paying now! 🙏</p>
                </div>
              </div>
            </motion.div>

            {/* 4 — Expense Tracking: lime */}
            <motion.div
              variants={fadeInUp}
              whileHover={{ scale: 1.018, transition: { duration: 0.22, ease: "easeOut" } }}
              className="bg-lime-300 rounded-3xl p-7 min-h-[260px] flex flex-col cursor-default"
            >
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-lime-900 mb-3">Expense Tracking</p>
              <h3 className="text-2xl font-black text-lime-950 leading-tight mb-4">Every rupee<br />accounted for.</h3>
              <div className="space-y-2 mt-auto">
                {[
                  { label: "Milk supply", amt: "+Rs.2,400", pos: true },
                  { label: "Packaging", amt: "−Rs.320", pos: false },
                  { label: "Transport", amt: "−Rs.180", pos: false },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between items-center bg-lime-950/8 rounded-xl px-3 py-2.5 text-xs">
                    <span className="text-lime-950 font-semibold">{row.label}</span>
                    <span className={`font-black ${row.pos ? "text-lime-800" : "text-red-600"}`}>{row.amt}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* 5 — Analytics: rose pink */}
            <motion.div
              variants={fadeInUp}
              whileHover={{ scale: 1.018, transition: { duration: 0.22, ease: "easeOut" } }}
              className="bg-rose-200 rounded-3xl p-7 min-h-[260px] flex flex-col cursor-default"
            >
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-rose-700 mb-3">Analytics</p>
              <h3 className="text-2xl font-black text-rose-950 leading-tight mb-1">Your business,<br />visible.</h3>
              <div className="my-3">
                <span className="text-4xl font-black text-rose-600">↑ 32%</span>
                <p className="text-xs text-rose-700 font-bold mt-0.5">collection this month</p>
              </div>
              {/* Bar chart */}
              <div className="mt-auto flex items-end gap-1 h-10">
                {[40, 55, 35, 75, 50, 90, 42, 80, 60, 100].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-rose-500 rounded-t-sm"
                    style={{ height: `${h}%`, opacity: 0.25 + (i / 10) * 0.75 }}
                  />
                ))}
              </div>
            </motion.div>

            {/* 6 — Secure: full-width dark */}
            <motion.div
              variants={fadeInUp}
              whileHover={{ scale: 1.008, transition: { duration: 0.22, ease: "easeOut" } }}
              className="md:col-span-3 bg-stone-900 rounded-3xl px-10 py-8 flex flex-col sm:flex-row items-center justify-between gap-6 cursor-default"
            >
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-stone-400 mb-1">Security</p>
                <h3 className="text-2xl font-black text-white">Secure &amp; Reliable — always.</h3>
              </div>
              <div className="flex flex-wrap gap-3 justify-center">
                {["🔒 Encrypted", "☁️ Auto backup", "📱 Any device", "⚡ 99.9% uptime"].map((tag) => (
                  <span key={tag} className="text-sm bg-white/10 border border-white/15 text-white px-4 py-2 rounded-full font-semibold">
                    {tag}
                  </span>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </InViewSection>

      {/* ── Pricing Section ── */}
      <InViewSection id="pricing" className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div className="text-center mb-14" variants={fadeInUp}>
            <h2 className="text-3xl lg:text-4xl font-bold text-stone-900 mb-3">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg text-stone-500">Choose the plan that fits your business</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto overflow-visible pt-4">
            {pricingPlans.map((plan, index) => (
              <motion.div
                key={index}
                variants={scaleIn}
                whileHover={{ y: -6, transition: { duration: 0.25 } }}
                className={`relative ${plan.popular ? "md:scale-[1.06] md:-mt-3 z-10" : ""}`}
              >
                <div
                  className={`rounded-2xl p-8 h-full flex flex-col ${
                    plan.popular
                      ? "bg-slate-700 ring-2 ring-emerald-500 shadow-2xl shadow-emerald-500/20"
                      : "bg-slate-800"
                  }`}
                >
                  {plan.popular && (
                    <motion.div
                      className="absolute -top-3 left-1/2 -translate-x-1/2 z-10"
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <span className="bg-emerald-600 text-white text-xs font-semibold px-4 py-1.5 rounded-full">
                        Most Popular
                      </span>
                    </motion.div>
                  )}

                  <div className="text-center mb-6">
                    <h3 className={`text-xl font-bold mb-2 ${plan.popular ? "text-emerald-400" : "text-white"}`}>
                      {plan.name}
                    </h3>
                    <div className="flex items-baseline justify-center gap-1">
                      {"price" in plan ? (
                        <>
                          <span className="text-3xl font-bold text-emerald-400">Rs.{plan.price}</span>
                          <span className="text-stone-400 text-sm">/month</span>
                        </>
                      ) : (
                        <span className="text-2xl font-bold text-emerald-400">
                          {(plan as { priceLabel: string }).priceLabel}
                        </span>
                      )}
                    </div>
                    <p className="text-stone-400 text-sm mt-2">{plan.description}</p>
                  </div>

                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-stone-300">
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  {plan.buttonText === "Contact Sales" ? (
                    <a href="mailto:support@hisaabapp.com?subject=Enterprise Plan Inquiry" className="block">
                      <Button className="w-full rounded-full bg-white text-stone-900 hover:bg-stone-100 font-semibold">
                        {plan.buttonText}
                      </Button>
                    </a>
                  ) : (
                    <Link href="/register" className="block">
                      <Button
                        className={`w-full rounded-full font-semibold ${
                          plan.popular
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                            : "bg-white text-stone-900 hover:bg-stone-100"
                        }`}
                      >
                        {plan.buttonText}
                      </Button>
                    </Link>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </InViewSection>

      {/* ── CTA Section ── */}
      <InViewSection className="py-20 bg-emerald-600">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h2
            className="text-3xl lg:text-4xl font-bold text-white mb-4 leading-tight"
            variants={fadeInUp}
          >
            Still writing in a notebook?
          </motion.h2>
          <motion.p
            className="text-lg text-emerald-100 mb-8 max-w-xl mx-auto leading-relaxed"
            variants={fadeInUp}
          >
            Thousands of Indian businesses have already made the switch. Takes 2 minutes to set up — no training needed.
          </motion.p>
          <motion.div variants={fadeInUp}>
            <Link href="/register">
              <motion.div
                className="inline-block"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
              >
                <Button
                  size="lg"
                  className="bg-white text-emerald-600 hover:bg-emerald-50 rounded-full px-10 h-12 font-bold shadow-lg gap-2"
                >
                  Start Your Free Trial
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </motion.div>
            </Link>
          </motion.div>
          <motion.p className="text-sm text-emerald-200 mt-6" variants={fadeIn}>
            14-day free trial &nbsp;•&nbsp; No credit card required &nbsp;•&nbsp; Cancel anytime
          </motion.p>
        </div>
      </InViewSection>

      {/* ── Footer ── */}
      <InViewSection id="footer" className="bg-slate-900 text-white py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-5 gap-8 mb-12">
            <motion.div className="md:col-span-2" variants={fadeInLeft}>
              <div className="flex items-center gap-2 mb-4">
                <Image
                  src="/icons/HisaabAApplogo.svg"
                  alt="HisaabApp Logo"
                  width={32}
                  height={32}
                  className="w-8 h-8"
                />
                <span className="text-xl font-bold">HisaabApp</span>
              </div>
              <p className="text-sm text-stone-400 max-w-xs leading-relaxed">
                Complete business billing and customer management solution for growing Indian businesses.
              </p>
            </motion.div>

            {[
              {
                title: "Product",
                links: [
                  { name: "Features", href: "#features" },
                  { name: "Pricing", href: "#pricing" },
                  { name: "Get Started", href: "/register" },
                ],
              },
              {
                title: "Support",
                links: [
                  { name: "Help Center", href: "mailto:support@hisaabapp.com" },
                  { name: "Contact Us", href: "mailto:contact@hisaabapp.com" },
                  { name: "WhatsApp", href: "https://wa.me/918460988661" },
                  { name: "Call Us", href: "tel:+918460988661" },
                ],
              },
              {
                title: "Company",
                links: [
                  { name: "About", href: "/about" },
                  { name: "Terms of Service", href: "/terms" },
                  { name: "Privacy Policy", href: "/privacy" },
                  { name: "Refund Policy", href: "/refund" },
                ],
              },
            ].map((section) => (
              <motion.div key={section.title} variants={fadeInUp}>
                <h3 className="font-semibold mb-4 text-sm text-stone-300 uppercase tracking-wide">
                  {section.title}
                </h3>
                <ul className="space-y-3">
                  {section.links.map((link) => (
                    <li key={link.name}>
                      <a
                        href={link.href}
                        className="text-sm text-stone-400 hover:text-white transition-colors"
                      >
                        {link.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>

          <motion.div className="border-t border-stone-800 pt-8 text-center" variants={fadeIn}>
            <p className="text-sm text-stone-500">© 2026 HisaabApp. All rights reserved.</p>
          </motion.div>
        </div>
      </InViewSection>
    </div>
  );
}
