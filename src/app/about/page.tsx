"use client";

import { Button } from "@/components/ui/button";
import { 
  ArrowLeft,
  Target,
  Eye,
  Heart,
  Users,
  Zap,
  Shield
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function AboutPage() {
  const values = [
    { icon: Heart, title: "Simplicity", desc: "Easy to use for everyone" },
    { icon: Users, title: "Trust", desc: "Your data is safe with us" },
    { icon: Zap, title: "Speed", desc: "Fast and reliable service" },
    { icon: Shield, title: "Security", desc: "Bank-grade protection" },
  ];

  return (
    <div className="h-screen bg-white flex flex-col overflow-hidden">
      {/* Navigation */}
      <nav className="bg-white border-b flex-shrink-0">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Image 
                src="/icons/HisaabAApplogo.svg" 
                alt="HisaabApp Logo" 
                width={36} 
                height={36}
                className="w-9 h-9"
              />
              <span className="text-lg font-bold text-gray-900">HisaabApp</span>
            </Link>
            
            <Link href="/">
              <Button variant="outline" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content - Two Columns */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side - Logo & Branding (60%) */}
        <div className="w-3/5 bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500 flex items-center justify-center p-8 lg:p-12">
          <div className="text-center text-white max-w-lg">
            {/* Large Logo */}
            <div className="mb-6">
              <div className="w-32 h-32 lg:w-40 lg:h-40 bg-white rounded-3xl shadow-2xl flex items-center justify-center mx-auto">
                <Image 
                  src="/icons/HisaabAApplogo.svg" 
                  alt="HisaabApp Logo" 
                  width={120} 
                  height={120}
                  className="w-24 h-24 lg:w-32 lg:h-32"
                />
              </div>
            </div>
            
            {/* Brand Name */}
            <h1 className="text-4xl lg:text-5xl font-bold mb-3">
              HisaabApp
            </h1>
            
            {/* Tagline */}
            <p className="text-xl lg:text-2xl text-emerald-100 mb-6">
              Smart Business Management
            </p>
            
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mt-8">
              <div className="bg-white/10 backdrop-blur rounded-xl p-3">
                <div className="text-2xl lg:text-3xl font-bold">1000+</div>
                <div className="text-xs text-emerald-100">Active Users</div>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-xl p-3">
                <div className="text-2xl lg:text-3xl font-bold">50K+</div>
                <div className="text-xs text-emerald-100">Invoices Sent</div>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-xl p-3">
                <div className="text-2xl lg:text-3xl font-bold"><span style={{ fontFamily: 'Arial, sans-serif' }}>₹</span>10Cr+</div>
                <div className="text-xs text-emerald-100">Managed</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - About Info (40%) */}
        <div className="w-2/5 bg-gray-50 flex flex-col justify-center p-6 lg:p-10 overflow-hidden">
          {/* Mission */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-5 w-5 text-emerald-600" />
              <h2 className="text-lg font-semibold text-gray-900">Our Mission</h2>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              Empowering small businesses with simple, powerful tools to manage their finances, 
              customers, and growth—all in one place.
            </p>
          </div>

          {/* Vision */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="h-5 w-5 text-emerald-600" />
              <h2 className="text-lg font-semibold text-gray-900">Our Vision</h2>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              To become India&apos;s most trusted business management platform for local 
              businesses, making accounting accessible to everyone.
            </p>
          </div>

          {/* Values */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Our Values</h2>
            <div className="grid grid-cols-2 gap-3">
              {values.map((value, index) => (
                <div key={index} className="flex items-center gap-2 bg-white p-3 rounded-lg border">
                  <value.icon className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">{value.title}</div>
                    <div className="text-xs text-gray-500">{value.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Get in Touch</h3>
            <div className="space-y-1 text-sm text-gray-600">
              <p>📧 support@hisaabapp.com</p>
              <p>📞 +91 84609 88661</p>
              <p>📍 Ahmedabad, Gujarat, India</p>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-6 flex gap-3">
            <Link href="/register" className="flex-1">
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                Get Started
              </Button>
            </Link>
            <Link href="/login" className="flex-1">
              <Button variant="outline" className="w-full">
                Login
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
