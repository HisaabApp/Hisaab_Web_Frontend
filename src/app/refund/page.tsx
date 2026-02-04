"use client";

import { Button } from "@/components/ui/button";
import { 
  ArrowLeft,
  Clock,
  Mail,
  CheckCircle,
  XCircle,
  Calendar,
  CreditCard,
  IndianRupee,
  MessageSquare
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function RefundPage() {
  const highlights = [
    { icon: Calendar, title: "7-Day Guarantee", desc: "Full refund within 7 days, no questions asked" },
    { icon: Clock, title: "Quick Processing", desc: "Refunds processed in 5-7 business days" },
    { icon: IndianRupee, title: "Full Amount", desc: "100% refund to original payment method" },
  ];

  const eligibleCases = [
    "Technical issues preventing Service access",
    "Accidental duplicate payment",
    "Charged after cancellation",
    "Service not as described",
    "Billing errors on our part",
    "Dissatisfaction within 7 days of purchase"
  ];

  const nonEligibleCases = [
    "Change of mind after 7 days",
    "Violation of Terms of Service",
    "Partial month usage",
    "Third-party service fees (SMS, payment gateway)",
    "Account suspended due to policy violation",
    "Free trial period services"
  ];

  const timeline = [
    { step: 1, title: "Request Submitted", desc: "We receive your refund request" },
    { step: 2, title: "Review (24-48 hrs)", desc: "Our team reviews your request" },
    { step: 3, title: "Approval", desc: "Refund approved or clarification needed" },
    { step: 4, title: "Processing", desc: "Amount credited in 5-7 days" },
  ];

  const faqs = [
    {
      q: "How long does it take to receive my refund?",
      a: "Once approved, refunds are processed within 5-7 business days. The actual credit depends on your bank."
    },
    {
      q: "Can I get a refund for a partial month?",
      a: "We don't offer pro-rated refunds. You can cancel anytime and use the service until billing period ends."
    },
    {
      q: "What if I was charged after cancelling?",
      a: "Contact us immediately. We'll refund the full amount once we verify the error."
    },
    {
      q: "Will I lose my data after a refund?",
      a: "Your account will be downgraded to free tier. Data will be retained for 30 days before deletion."
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white sticky top-0 z-50 border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Image 
                src="/icons/HisaabAApplogo.svg" 
                alt="HisaabApp Logo" 
                width={40} 
                height={40}
                className="w-10 h-10"
              />
              <span className="text-xl font-bold text-gray-900">HisaabApp</span>
            </Link>
            
            <Link href="/">
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-12 lg:py-16 border-b bg-gradient-to-b from-amber-50 to-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
            {/* Illustration */}
            <div className="w-full lg:w-1/2 flex justify-center">
              <Image 
                src="/images/undraw-refund.svg" 
                alt="Refund Policy Illustration" 
                width={400} 
                height={300}
                className="w-full max-w-sm"
              />
            </div>
            
            {/* Text */}
            <div className="w-full lg:w-1/2 text-center lg:text-left">
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                Refund Policy
              </h1>
              <p className="text-lg text-gray-600 mb-4">
                We want you to be completely satisfied. If you&apos;re not, here&apos;s how our refund process works.
              </p>
              <div className="inline-flex items-center gap-2 text-sm text-gray-500">
                <Clock className="h-4 w-4" />
                <span>Last updated: February 1, 2026</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section className="py-10 bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {highlights.map((item, index) => (
              <div key={index} className="text-center p-6 bg-amber-50 rounded-xl">
                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <item.icon className="h-6 w-6 text-amber-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-12 lg:py-16 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">
            Refund Process
          </h2>
          
          <div className="max-w-3xl mx-auto">
            <div className="grid md:grid-cols-4 gap-4">
              {timeline.map((item, index) => (
                <div key={index} className="text-center">
                  <div className="w-10 h-10 bg-amber-500 text-white rounded-full flex items-center justify-center mx-auto mb-3 font-bold">
                    {item.step}
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm mb-1">{item.title}</h3>
                  <p className="text-xs text-gray-600">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Eligible / Non-Eligible */}
      <section className="py-12 lg:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Eligible */}
            <div className="bg-emerald-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
                Eligible for Refund
              </h3>
              <ul className="space-y-3">
                {eligibleCases.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-gray-700">
                    <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-1" />
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Not Eligible */}
            <div className="bg-red-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-600" />
                Not Eligible for Refund
              </h3>
              <ul className="space-y-3">
                {nonEligibleCases.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-gray-700">
                    <XCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-1" />
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How to Request */}
      <section className="py-12 lg:py-16 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
              How to Request a Refund
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-xl border">
                <div className="flex items-center gap-3 mb-4">
                  <Mail className="h-6 w-6 text-amber-600" />
                  <h3 className="font-semibold text-gray-900">Option 1: Email</h3>
                </div>
                <p className="text-gray-600 text-sm mb-3">
                  Send an email to <span className="font-medium text-amber-600">refund@hisaabapp.com</span> with:
                </p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Your registered email address</li>
                  <li>• Order/Transaction ID</li>
                  <li>• Reason for refund request</li>
                </ul>
              </div>

              <div className="bg-white p-6 rounded-xl border">
                <div className="flex items-center gap-3 mb-4">
                  <CreditCard className="h-6 w-6 text-amber-600" />
                  <h3 className="font-semibold text-gray-900">Option 2: In-App</h3>
                </div>
                <p className="text-gray-600 text-sm mb-3">
                  Request directly from your account:
                </p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>1. Go to Settings → Subscription</li>
                  <li>2. Click &quot;Request Refund&quot;</li>
                  <li>3. Fill out the form</li>
                  <li>4. Submit your request</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-12 lg:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
            Frequently Asked Questions
          </h2>
          
          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white border rounded-xl p-5">
                <h3 className="font-semibold text-gray-900 mb-2 flex items-start gap-2">
                  <MessageSquare className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  {faq.q}
                </h3>
                <p className="text-gray-600 text-sm ml-7">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-xl mx-auto text-center p-8 bg-amber-50 rounded-2xl">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Need help with a refund?
            </h3>
            <p className="text-gray-600 mb-6">
              Our support team is available to assist you.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a href="mailto:refund@hisaabapp.com">
                <Button variant="outline" className="gap-2 w-full sm:w-auto">
                  <Mail className="h-4 w-4" />
                  Request Refund
                </Button>
              </a>
              <a href="mailto:support@hisaabapp.com">
                <Button className="bg-amber-600 hover:bg-amber-700 w-full sm:w-auto">
                  Contact Support
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400">
            © 2026 HisaabApp. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
