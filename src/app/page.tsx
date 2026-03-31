/**
 * Landing Page - Public
 * Product showcase and marketing page for HisaabApp
 */

"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Users, 
  FileText,
  Bell,
  BarChart3,
  Receipt,
  Shield,
  Check,
  Milk,
  GraduationCap,
  RefreshCw,
  Store,
  IndianRupee
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
  cardHover,
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

// ─────────────────────────────────────────────
// Animated feature card
// ─────────────────────────────────────────────
function FeatureCard({
  feature,
}: {
  feature: {
    icon: React.ElementType;
    title: string;
    description: string;
    color: string;
    items: string[];
  };
}) {
  return (
    <motion.div variants={fadeInUp} whileHover="hover" initial="rest" animate="rest">
      <motion.div variants={cardHover} className="h-full">
        <Card className="border-0 shadow-sm bg-white h-full">
          <CardContent className="p-6">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${feature.color}`}>
              <feature.icon className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
            <p className="text-sm text-gray-600 mb-4">{feature.description}</p>
            <ul className="space-y-2">
              {feature.items.map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                  <Check className="h-4 w-4 text-green-500" />
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

export default function LandingPage() {
  const keepaliveIntervalRef = useRef<number | null>(null);

  // Keep backend warm on landing page to prevent Render free-tier sleep
  useEffect(() => {
    warmupService.keepBackendWarm(); // Immediate warmup on page load
    
    // Start periodic keepalive every 4 minutes
    keepaliveIntervalRef.current = warmupService.startBackendKeepalive(4 * 60 * 1000) as any;

    return () => {
      if (keepaliveIntervalRef.current) {
        warmupService.stopBackendKeepalive(keepaliveIntervalRef.current);
      }
    };
  }, []);

  // Add JSON-LD structured data for SEO
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
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.8",
        "ratingCount": "250"
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

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  const features = [
    {
      icon: Users,
      title: "Customer Management",
      description: "Create unlimited customer profiles with detailed information, payment history, and contact preferences.",
      color: "bg-violet-100 text-violet-600",
      items: ["Unlimited customers", "Detailed profiles", "Payment history"]
    },
    {
      icon: FileText,
      title: "Smart Invoicing",
      description: "Generate professional PDF invoices with your business logo and share instantly via WhatsApp or email.",
      color: "bg-emerald-100 text-emerald-600",
      items: ["Professional PDF invoices", "Custom business logo", "One-click sharing"]
    },
    {
      icon: Bell,
      title: "Automated Reminders",
      description: "Send payment reminders automatically via SMS and WhatsApp to ensure timely collections.",
      color: "bg-amber-100 text-amber-600",
      items: ["SMS & WhatsApp reminders", "Automated scheduling", "Custom templates"]
    },
    {
      icon: BarChart3,
      title: "Analytics & Reports",
      description: "Comprehensive analytics with visual charts showing payment trends, outstanding balances, and monthly summaries.",
      color: "bg-violet-100 text-violet-600",
      items: ["Visual charts & graphs", "Payment trend analysis", "CSV export for accounting"]
    },
    {
      icon: Receipt,
      title: "Expense Tracking",
      description: "Record daily and monthly expenses with quantity and rate tracking for complete financial oversight.",
      color: "bg-teal-100 text-teal-600",
      items: ["Daily/monthly tracking", "Quantity & rate details", "Category-wise organization"]
    },
    {
      icon: Shield,
      title: "Secure & Reliable",
      description: "Enterprise-grade security with responsive design that works perfectly on mobile and desktop.",
      color: "bg-red-100 text-red-600",
      items: ["Secure authentication", "Mobile & desktop ready", "Data backup & sync"]
    }
  ];

  const businessTypes = [
    {
      icon: Milk,
      title: "Dairy Vendors",
      description: "Track daily milk deliveries, manage monthly subscriptions, and send automated payment reminders."
    },
    {
      icon: GraduationCap,
      title: "Tuition Centers",
      description: "Manage student fees, track attendance-based billing, and send fee reminders to parents."
    },
    {
      icon: RefreshCw,
      title: "Subscription Services",
      description: "Handle recurring payments, manage service renewals, and track subscription analytics."
    },
    {
      icon: Store,
      title: "Local Vendors",
      description: "Manage customer credit accounts, track inventory sales, and streamline payment collections."
    }
  ];

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
        "Basic analytics"
      ],
      buttonText: "Start Free Trial"
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
        "Custom branding"
      ],
      buttonText: "Start Free Trial"
    },
    {
      name: "Enterprise",
      // price: null,
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
        "SLA guarantee"
      ],
      buttonText: "Contact Sales"
    }
  ];

  return (
    <div className="min-h-screen bg-white" style={{ scrollBehavior: "smooth" }}>

      {/* ── Navigation ── */}
      <motion.nav
        className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b"
        variants={fadeInDown}
        initial="hidden"
        animate="visible"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <motion.div className="flex items-center gap-2" variants={fadeInLeft}>
              <Image src="/icons/HisaabAApplogo.svg" alt="HisaabApp Logo" width={40} height={40} className="w-10 h-10" />
              <span className="text-xl font-bold text-gray-900">HisaabApp</span>
            </motion.div>

            <motion.div className="hidden md:flex items-center gap-8" variants={staggerContainer} initial="hidden" animate="visible">
              {[
                { label: "Features", href: "#features" },
                { label: "Pricing", href: "#pricing" },
                { label: "Reviews", href: "#business" },
                { label: "Support", href: "#footer" },
              ].map((item) => (
                <motion.a key={item.label} href={item.href} className="text-sm text-gray-600 hover:text-emerald-600 transition-colors" variants={fadeIn}>
                  {item.label}
                </motion.a>
              ))}
            </motion.div>

            <motion.div className="flex items-center gap-3" variants={fadeInRight}>
              <Link href="/login">
                <Button variant="ghost" className="text-gray-600">Login</Button>
              </Link>
              <Link href="/register">
                <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                  <Button className="bg-emerald-600 hover:bg-emerald-700 rounded-full px-6">Start Free Trial</Button>
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
            <motion.div className="space-y-6" variants={staggerContainerSlow} initial="hidden" animate="visible">
              <motion.h1 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight" variants={fadeInLeft}>
                Complete Business{" "}
                <span className="text-emerald-600">Billing</span>
                <br />
                &amp; Customer Management
              </motion.h1>
              <motion.p className="text-lg text-gray-600 max-w-lg" variants={fadeInLeft}>
                Track recurring payments, manage customers, send automated reminders via SMS &amp; WhatsApp. Perfect for dairy vendors, tuition centers, and subscription services.
              </motion.p>
              <motion.div className="flex flex-col sm:flex-row gap-4" variants={fadeInUp}>
                <Link href="/register">
                  <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                    <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 rounded-full px-8 h-12">Start Free Trial</Button>
                  </motion.div>
                </Link>
              </motion.div>
              <motion.div className="flex flex-wrap items-center gap-6 pt-4 text-sm text-gray-500" variants={fadeIn}>
                {["14-day free trial", "No credit card required", "Cancel anytime"].map((t) => (
                  <div key={t} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-gray-400" />
                    <span>{t}</span>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            {/* Right — video */}
            <motion.div className="relative" variants={fadeInRight} initial="hidden" animate="visible">
              <motion.div className="bg-white rounded-2xl shadow-2xl overflow-hidden border" whileHover={{ scale: 1.01 }} transition={{ duration: 0.3 }}>
                <video autoPlay loop muted playsInline className="w-full h-auto">
                  <source src="/video/home_video.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </motion.div>
              {/* Revenue Card Overlay */}
              <motion.div
                className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-lg p-4 border"
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.7, type: "spring", stiffness: 200, damping: 20 }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <IndianRupee className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Monthly Revenue</p>
                    <p className="text-lg font-bold text-gray-900">Rs. 2,45,000</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Features Section ── */}
      <InViewSection id="features" className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div className="text-center mb-16" variants={fadeInUp}>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Everything You Need to Manage Your Business</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">From billing to analytics, HisaabApp has all the tools to grow your business</p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <FeatureCard key={index} feature={feature} />
            ))}
          </div>
        </div>
      </InViewSection>

      {/* ── Business Types Section ── */}
      <InViewSection id="business" className="py-20 bg-slate-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div className="text-center mb-16" variants={fadeInUp}>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Perfect for Every Business Type</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">From small vendors to growing enterprises, HisaabApp scales with your business</p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {businessTypes.map((business, index) => (
              <motion.div key={index} variants={fadeInUp} whileHover={{ y: -6, transition: { duration: 0.25 } }}>
                <Card className="border-0 shadow-sm bg-white text-center h-full">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <business.icon className="h-6 w-6 text-slate-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">{business.title}</h3>
                    <p className="text-sm text-gray-600">{business.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </InViewSection>

      {/* ── Pricing Section ── */}
      <InViewSection id="pricing" className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div className="text-center mb-16" variants={fadeInUp}>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Simple, Transparent Pricing</h2>
            <p className="text-lg text-gray-600">Choose the plan that fits your business needs</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <motion.div key={index} variants={scaleIn} whileHover={{ y: -8, transition: { duration: 0.3 } }} className="relative">
                <Card className={`bg-slate-800 border-0 shadow-xl h-full ${plan.popular ? "ring-2 ring-emerald-500" : ""}`}>
                  {plan.popular && (
                    <motion.div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                      <span className="bg-emerald-600 text-white text-xs font-medium px-4 py-1.5 rounded-full">Most Popular</span>
                    </motion.div>
                  )}
                  <CardContent className="p-8">
                    <div className="text-center mb-6">
                      <h3 className={`text-xl font-semibold mb-2 ${plan.popular ? "text-emerald-400" : "text-white"}`}>{plan.name}</h3>
                      <div className="flex items-baseline justify-center gap-1">
                        {"price" in plan && plan.price !== null ? (
                          <>
                            <span className="text-3xl font-bold text-emerald-400">Rs. {plan.price}</span>
                            <span className="text-gray-400">/month</span>
                          </>
                        ) : (
                          <span className="text-2xl font-bold text-emerald-400">{(plan as any).priceLabel}</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-400 mt-2">{plan.description}</p>
                    </div>
                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
                          <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    {plan.buttonText === "Contact Sales" ? (
                      <a href="mailto:support@hisaabapp.com?subject=Enterprise Plan Inquiry" className="block">
                        <Button className="w-full rounded-full bg-white text-slate-800 hover:bg-gray-100">{plan.buttonText}</Button>
                      </a>
                    ) : (
                      <Link href="/register" className="block">
                        <Button className={`w-full rounded-full ${plan.popular ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-white text-slate-800 hover:bg-gray-100"}`}>
                          {plan.buttonText}
                        </Button>
                      </Link>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </InViewSection>

      {/* ── CTA Section ── */}
      <InViewSection className="py-20 bg-emerald-600">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h2 className="text-3xl lg:text-4xl font-bold text-white mb-4" variants={fadeInUp}>Ready to Transform Your Business Billing?</motion.h2>
          <motion.p className="text-lg text-emerald-100 mb-8 max-w-2xl mx-auto" variants={fadeInUp}>
            Join thousands of businesses already using HisaabApp to streamline their billing and grow their revenue.
          </motion.p>
          <motion.div className="flex flex-col sm:flex-row gap-4 justify-center" variants={fadeInUp}>
            <Link href="/register">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                <Button size="lg" className="bg-white text-emerald-600 hover:bg-gray-100 rounded-full px-8 h-12">Start Your Free Trial</Button>
              </motion.div>
            </Link>
            <Link href="/register">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                <Button size="lg" variant="outline" className="rounded-full px-8 h-12 text-white border-white hover:bg-white/10">Schedule Demo</Button>
              </motion.div>
            </Link>
          </motion.div>
          <motion.p className="text-sm text-emerald-200 mt-6" variants={fadeIn}>14-day free trial • No credit card required • Cancel anytime</motion.p>
        </div>
      </InViewSection>

      {/* ── Footer ── */}
      <InViewSection id="footer" className="bg-slate-900 text-white py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-5 gap-8 mb-12">
            <motion.div className="md:col-span-2" variants={fadeInLeft}>
              <div className="flex items-center gap-2 mb-4">
                <Image src="/icons/HisaabAApplogo.svg" alt="HisaabApp Logo" width={32} height={32} className="w-8 h-8" />
                <span className="text-xl font-bold">HisaabApp</span>
              </div>
              <p className="text-sm text-gray-400 max-w-xs">Complete business billing and customer management solution for growing businesses.</p>
            </motion.div>
            {[
              { title: "Product", links: [{ name: "Features", href: "#features" }, { name: "Pricing", href: "#pricing" }, { name: "Business Types", href: "#business" }, { name: "Get Started", href: "/register" }] },
              { title: "Support", links: [{ name: "Help Center", href: "mailto:support@hisaabapp.com" }, { name: "Contact Us", href: "mailto:contact@hisaabapp.com" }, { name: "WhatsApp", href: "https://wa.me/918460988661" }, { name: "Call Us", href: "tel:+918460988661" }] },
              { title: "Company", links: [{ name: "About", href: "/about" }, { name: "Terms of Service", href: "/terms" }, { name: "Privacy Policy", href: "/privacy" }, { name: "Refund Policy", href: "/refund" }] },
            ].map((section) => (
              <motion.div key={section.title} variants={fadeInUp}>
                <h3 className="font-semibold mb-4 text-sm">{section.title}</h3>
                <ul className="space-y-3">
                  {section.links.map((link) => (
                    <li key={link.name}>
                      <a href={link.href} className="text-sm text-gray-400 hover:text-white transition-colors">{link.name}</a>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
          <motion.div className="border-t border-gray-800 pt-8 text-center" variants={fadeIn}>
            <p className="text-sm text-gray-400">© 2026 HisaabApp. All rights reserved.</p>
          </motion.div>
        </div>
      </InViewSection>
    </div>
  );
}
