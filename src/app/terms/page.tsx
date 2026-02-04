"use client";

import { Button } from "@/components/ui/button";
import { 
  ArrowLeft,
  Clock,
  Mail,
  CheckCircle
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function TermsPage() {
  const sections = [
    {
      title: "1. Acceptance of Terms",
      content: `By accessing and using HisaabApp ("the Service"), you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our Service.

These terms apply to all users, including business owners, employees, and any other individuals who access or use the Service.`
    },
    {
      title: "2. User Accounts",
      points: [
        "You must provide accurate and complete information when creating an account",
        "You are responsible for maintaining the security of your account credentials",
        "You must be at least 18 years old to use this Service",
        "One person or business may not maintain more than one free account",
        "You are responsible for all activities that occur under your account"
      ]
    },
    {
      title: "3. Data Privacy & Security",
      points: [
        "We collect and process your data as described in our Privacy Policy",
        "Your business and customer data remains your property",
        "We implement industry-standard security measures to protect your data",
        "We do not sell your personal information to third parties",
        "You can request data export or deletion at any time"
      ]
    },
    {
      title: "4. Payments & Subscriptions",
      points: [
        "Subscription fees are billed in advance on a monthly basis",
        "All fees are exclusive of applicable taxes",
        "You can upgrade, downgrade, or cancel your subscription at any time",
        "Refunds are processed according to our Refund Policy",
        "We reserve the right to modify pricing with 30 days notice"
      ]
    },
    {
      title: "5. Acceptable Use",
      content: "You agree to use the Service only for lawful purposes. You must NOT:",
      points: [
        "Use the Service for any illegal activities",
        "Attempt to gain unauthorized access to our systems",
        "Transmit viruses, malware, or harmful code",
        "Harass, abuse, or harm other users",
        "Violate any applicable laws or regulations"
      ]
    },
    {
      title: "6. Limitation of Liability",
      points: [
        "The Service is provided 'as is' without warranties of any kind",
        "We are not liable for any indirect, incidental, or consequential damages",
        "Our total liability shall not exceed the amount paid by you in the past 12 months",
        "We are not responsible for third-party services or integrations"
      ]
    },
    {
      title: "7. Service Modifications",
      points: [
        "We may modify, suspend, or discontinue features with reasonable notice",
        "We will notify you of significant changes via email or in-app notification",
        "Continued use after changes constitutes acceptance of modified terms"
      ]
    },
    {
      title: "8. Dispute Resolution",
      points: [
        "These terms are governed by the laws of India",
        "Any disputes shall be resolved through arbitration in Ahmedabad, Gujarat",
        "You agree to attempt informal resolution before legal proceedings"
      ]
    },
    {
      title: "9. Contact Information",
      content: `For questions about these Terms of Service, please contact us:

📧 Email: legal@hisaabapp.com
📞 Phone: +91 84609 88661
📍 Address: Ahmedabad, Gujarat, India`
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
      <section className="py-12 lg:py-16 border-b bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
            {/* Illustration */}
            <div className="w-full lg:w-1/2 flex justify-center">
              <Image 
                src="/images/undraw-terms.svg" 
                alt="Terms of Service Illustration" 
                width={400} 
                height={300}
                className="w-full max-w-sm"
              />
            </div>
            
            {/* Text */}
            <div className="w-full lg:w-1/2 text-center lg:text-left">
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                Terms of Service
              </h1>
              <p className="text-lg text-gray-600 mb-4">
                Please read these terms carefully before using HisaabApp. By using our service, you agree to these terms.
              </p>
              <div className="inline-flex items-center gap-2 text-sm text-gray-500">
                <Clock className="h-4 w-4" />
                <span>Last updated: February 1, 2026</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Terms Content */}
      <section className="py-12 lg:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            {sections.map((section, index) => (
              <div key={index} className="mb-10 pb-10 border-b border-gray-100 last:border-0">
                <h2 className="text-xl lg:text-2xl font-semibold text-gray-900 mb-4">
                  {section.title}
                </h2>
                
                {section.content && (
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line mb-4">
                    {section.content}
                  </p>
                )}
                
                {section.points && (
                  <ul className="space-y-3">
                    {section.points.map((point, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{point}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>

          {/* CTA Section */}
          <div className="max-w-xl mx-auto text-center mt-12 p-8 bg-gray-50 rounded-2xl">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Have questions about our terms?
            </h3>
            <p className="text-gray-600 mb-6">
              Our team is here to help clarify any concerns.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a href="mailto:legal@hisaabapp.com">
                <Button variant="outline" className="gap-2 w-full sm:w-auto">
                  <Mail className="h-4 w-4" />
                  Contact Us
                </Button>
              </a>
              <Link href="/register">
                <Button className="bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto">
                  Get Started Free
                </Button>
              </Link>
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
