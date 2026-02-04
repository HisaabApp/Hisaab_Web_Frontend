"use client";

import { Button } from "@/components/ui/button";
import { 
  ArrowLeft,
  Clock,
  Mail,
  CheckCircle,
  Shield,
  Lock,
  Server
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function PrivacyPage() {
  const sections = [
    {
      title: "1. Information We Collect",
      content: "We collect information you provide directly:",
      points: [
        "Account information (name, email, phone number)",
        "Business details (business name, address, UPI ID)",
        "Customer data you add to manage your business",
        "Payment information for subscription billing",
        "Device information and usage analytics"
      ]
    },
    {
      title: "2. How We Use Your Information",
      content: "We use your information to:",
      points: [
        "Provide and maintain our Service",
        "Process payments and send invoices",
        "Send notifications and reminders on your behalf",
        "Improve and personalize your experience",
        "Ensure security and prevent fraud",
        "Comply with legal obligations"
      ]
    },
    {
      title: "3. Information Sharing",
      content: "We do NOT sell your personal data. We may share information with:",
      points: [
        "Service Providers: Companies that help us operate (Razorpay, Twilio)",
        "Legal Requirements: When required by law or legal process",
        "Business Transfers: In case of merger, acquisition, or sale",
        "With Your Consent: When you explicitly agree"
      ]
    },
    {
      title: "4. Data Security",
      content: "We implement robust security measures:",
      points: [
        "256-bit SSL/TLS encryption for all data transmission",
        "Encrypted database storage",
        "Regular security audits and penetration testing",
        "Access controls and authentication",
        "Secure backup and disaster recovery"
      ]
    },
    {
      title: "5. Data Storage & Retention",
      points: [
        "Your data is stored on secure servers in India",
        "We retain your data as long as your account is active",
        "After account deletion, data is removed within 30 days",
        "Some data may be retained for legal compliance"
      ]
    },
    {
      title: "6. Your Rights",
      content: "You have the right to:",
      points: [
        "Access: Request a copy of your personal data",
        "Rectification: Correct inaccurate information",
        "Deletion: Request deletion of your data",
        "Portability: Export your data in standard formats",
        "Objection: Opt-out of certain processing"
      ]
    },
    {
      title: "7. Cookies & Tracking",
      content: "We use cookies for:",
      points: [
        "Essential Functions: Login, security, preferences",
        "Analytics: Understanding how you use our Service",
        "Performance: Improving speed and reliability"
      ],
      note: "We do NOT use cookies for third-party advertising."
    },
    {
      title: "8. Contact Us",
      content: `For privacy-related questions or concerns:

📧 Email: privacy@hisaabapp.com
📞 Phone: +91 84609 88661
📍 Address: Ahmedabad, Gujarat, India

We respond to all privacy inquiries within 48 hours.`
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
      <section className="py-12 lg:py-16 border-b bg-gradient-to-b from-blue-50 to-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
            {/* Illustration */}
            <div className="w-full lg:w-1/2 flex justify-center">
              <Image 
                src="/images/undraw-privacy.svg" 
                alt="Privacy Policy Illustration" 
                width={400} 
                height={300}
                className="w-full max-w-sm"
              />
            </div>
            
            {/* Text */}
            <div className="w-full lg:w-1/2 text-center lg:text-left">
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                Privacy Policy
              </h1>
              <p className="text-lg text-gray-600 mb-4">
                Your privacy is important to us. This policy explains how we collect, use, and protect your information.
              </p>
              <div className="inline-flex items-center gap-2 text-sm text-gray-500">
                <Clock className="h-4 w-4" />
                <span>Last updated: February 1, 2026</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-8 bg-gray-50 border-b">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-4 lg:gap-8">
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border">
              <Lock className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">256-bit Encryption</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border">
              <Shield className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">GDPR Compliant</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border">
              <Server className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">Data Stored in India</span>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy Content */}
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
                        <CheckCircle className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{point}</span>
                      </li>
                    ))}
                  </ul>
                )}
                
                {section.note && (
                  <p className="mt-4 text-sm text-gray-500 italic">
                    {section.note}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* CTA Section */}
          <div className="max-w-xl mx-auto text-center mt-12 p-8 bg-blue-50 rounded-2xl">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Questions about your privacy?
            </h3>
            <p className="text-gray-600 mb-6">
              Our privacy team is here to help you.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a href="mailto:privacy@hisaabapp.com">
                <Button variant="outline" className="gap-2 w-full sm:w-auto">
                  <Mail className="h-4 w-4" />
                  Contact Privacy Team
                </Button>
              </a>
              <Link href="/register">
                <Button className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
                  Get Started Securely
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
