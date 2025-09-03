'use client'

import Link from 'next/link'
import Image from 'next/image'
import React from 'react'

interface FooterLink {
  label: string;
  href: string;
}

interface FooterCategory {
  title: string;
  links?: FooterLink[];
  pricing?: {
    text: string;
    linkText: string;
    href: string;
  };
}

interface ComplianceLogo {
  src: string;
  alt: string;
}

interface SocialIcon {
  name: string;
  href: string;
  icon: JSX.Element;
}

const footerCategories: FooterCategory[] = [
  {
    title: 'Product',
    links: [
      { label: 'RAG API', href: 'https://customgpt.ai/api?utm_source=starterkit_page' },
      { label: 'Customer Intelligence', href: 'https://customgpt.ai/customer-intelligence?utm_source=starterkit_page' },
      { label: 'Custom Deep Research', href: 'https://researcher.customgpt.ai?utm_source=starterkit_page' },
      { label: 'Enterprise', href: 'https://customgpt.ai/enterprise-solutions-customgpt?utm_source=starterkit_page' }
    ]
  },
  {
    title: 'Use Cases',
    links: [
      { label: 'Onboarding & Training', href: 'https://customgpt.ai/use-case/onboarding-and-training?utm_source=starterkit_page' },
      { label: 'Internal Search Tool', href: 'https://customgpt.ai/use-case/internal-search?utm_source=starterkit_page' },
      { label: 'Competitive Analysis', href: 'https://customgpt.ai/use-case/competitive-analysis?utm_source=starterkit_page' },
      { label: 'Customer Service', href: 'https://customgpt.ai/solution/customer-service?utm_source=starterkit_page' },
      { label: 'Engagement Analytics', href: 'https://customgpt.ai/use-case-lead-generation?utm_source=starterkit_page' },
      { label: 'Research Assistance', href: 'https://customgpt.ai/use-case-topic-research?utm_source=starterkit_page' },
      { label: 'Site Search', href: 'https://customgpt.ai/use-case/site-search?utm_source=starterkit_page' }
    ]
  },
  {
    title: 'Industries',
    links: [
      { label: 'Technology', href: 'https://customgpt.ai/industry/startup?utm_source=starterkit_page' },
      { label: 'Education', href: 'https://customgpt.ai/education?utm_source=starterkit_page' },
      { label: 'Government', href: 'https://customgpt.ai/use-case/government?utm_source=starterkit_page' },
      { label: 'Manufacturing & Industrial', href: 'https://customgpt.ai/use-case/manufacturing?utm_source=starterkit_page' },
      { label: 'Pharmaceuticals', href: 'https://customgpt.ai/use-case/pharma?utm_source=starterkit_page' },
      { label: 'Biotech', href: 'https://customgpt.ai/use-case/biotech?utm_source=starterkit_page' },
      { label: 'Ecommerce', href: 'https://customgpt.ai/use-case/ecommerce?utm_source=starterkit_page' },
      { label: 'Finance & Banking', href: 'https://customgpt.ai/use-case/finance-and-banking?utm_source=starterkit_page' },
      { label: 'Healthcare', href: 'https://customgpt.ai/use-case/healthcare?utm_source=starterkit_page' }
    ]
  },
  {
    title: 'Company',
    links: [
      { label: 'About Us', href: 'https://customgpt.ai/about-us?utm_source=starterkit_page' },
      { label: 'Testimonials', href: 'https://customgpt.ai/testimonials?utm_source=starterkit_page' },
      { label: 'Customers', href: 'https://customgpt.ai/customers?utm_source=starterkit_page' },
      { label: 'Partner Directory', href: 'https://customgpt.ai/partner-directory?utm_source=starterkit_page' },
      { label: 'Solution Partner Program', href: 'https://customgpt.ai/solutions-partner?utm_source=starterkit_page' },
      { label: 'Affiliate Partner Program', href: 'https://customgpt.ai/partners?utm_source=starterkit_page' },
      { label: 'Contact Us', href: 'https://customgpt.ai/contact-us?utm_source=starterkit_page' }
    ]
  },
  {
    title: 'Resources',
    links: [
      { label: 'Case Studies', href: 'https://customgpt.ai/customers?utm_source=starterkit_page' },
      { label: 'FAQs', href: 'https://customgpt.ai/faq?utm_source=starterkit_page' },
      { label: 'Blog', href: 'https://customgpt.ai/blog?utm_source=starterkit_page' },
      { label: 'Security & Trust', href: 'https://customgpt.ai/security?utm_source=starterkit_page' },
      { label: 'GDPR', href: 'https://customgpt.ai/gdpr-compliance?utm_source=starterkit_page' },
      { label: 'Documentation', href: 'https://docs.customgpt.ai?utm_source=starterkit_page' },
      { label: 'Live Demo', href: 'https://customgpt.ai/demo?utm_source=starterkit_page' },
      { label: 'Free Sitemap Builders', href: 'https://customgpt.ai/free-tools?utm_source=starterkit_page' },
      { label: 'Free Prompt Optimizer', href: 'https://customgpt.ai/improve-my-prompt?utm_source=starterkit_page' },
      { label: 'Free AI Bot Creator', href: 'https://customgpt.ai/custom-ai-chatbot-free?utm_source=starterkit_page' }
    ]
  },
  {
    title: 'Pricing',
    pricing: {
      text: 'Explore our flexible pricing options to find the perfect plan for your needs.',
      linkText: 'View Pricing Plans →',
      href: 'https://customgpt.ai/pricing?utm_source=starterkit_page'
    }
  }
]

const complianceLogos: ComplianceLogo[] = [
  { src: '/assets/comparison/gdpr.png', alt: 'GDPR Compliant' },
  { src: '/assets/comparison/soc.webp', alt: 'SOC2 Compliant' }
]

const socialIcons: SocialIcon[] = [
  {
    name: 'LinkedIn',
    href: 'https://www.linkedin.com/company/customgpt',
    icon: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-10h3v10zm-1.5-11.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.784 1.764-1.75 1.764zm13.5 11.268h-3v-5.604c0-1.337-.027-3.064-1.867-3.064-1.868 0-2.154 1.459-2.154 2.967v5.701h-3v-10h2.882v1.367h.041c.402-.761 1.384-1.564 2.849-1.564 3.046 0 3.611 2.007 3.611 4.621v5.576z" />
      </svg>
    )
  },
  {
    name: 'X',
    href: 'https://x.com/CustomGPT.ai',
    icon: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2zm4.24 13.59l1.41-1.41L13.41 12l4.24-4.24-1.41-1.41L12 10.59 7.76 6.35 6.35 7.76 10.59 12l-4.24 4.24 1.41 1.41L12 13.41l4.24 4.24z" />
      </svg>
    )
  },
  {
    name: 'Facebook',
    href: 'https://www.facebook.com/customgpt/',
    icon: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M22.675 0h-21.35C.595 0 0 .595 0 1.326v21.348C0 23.406.595 24 1.326 24h11.494v-9.294H9.691v-3.622h3.129V8.413c0-3.1 1.894-4.788 4.659-4.788 1.325 0 2.463.099 2.794.143v3.24l-1.918.001c-1.504 0-1.796.715-1.796 1.763v2.312h3.588l-.467 3.622h-3.121V24h6.116c.73 0 1.326-.594 1.326-1.326V1.326C24 .595 23.405 0 22.675 0z" />
      </svg>
    )
  },
  {
    name: 'YouTube',
    href: 'https://www.youtube.com/@CustomGPT.ai',
    icon: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M23.498 6.186a2.993 2.993 0 0 0-2.108-2.108C19.872 3.5 12 3.5 12 3.5s-7.872 0-9.39.578a2.993 2.993 0 0 0-2.108 2.108C0 7.703 0 12 0 12s0 4.297.502 5.814a2.993 2.993 0 0 0 2.108 2.108C4.128 20.5 12 20.5 12 20.5s7.872 0 9.39-.578a2.993 2.993 0 0 0 2.108-2.108C24 16.297 24 12 24 12s0-4.297-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    )
  }
]

const Footer = () => {
  return (
    <footer className="bg-white mt-16">
      <div className="max-w-screen-xl mx-auto px-4 py-8">
        {/* Footer Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
          {footerCategories.map((category, index) => (
            <div key={index}>
              <h2 className="mb-4 text-xl font-semibold text-gray-900 ">
                {category.title}
              </h2>
              {category.links ? (
                <ul className="text-gray-500 space-y-2">
                  {category.links.map((link, i) => (
                    <li key={i}>
                      <Link href={link.href} className="font-extralight hover:text-customgpt-primary transition-colors">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : category.pricing ? (
                <div className="text-gray-500 space-y-2">
                  <p className="mb-2">{category.pricing.text}</p>
                  <Link href={category.pricing.href} className="hover:underline font-extralight hover:text-customgpt-primary transition-colors">
                    {category.pricing.linkText}
                  </Link>
                </div>
              ) : null}
            </div>
          ))}
        </div>

        {/* Compliance Logos */}
        <div className="mt-8 flex items-center space-x-4">
          {complianceLogos.map((logo, index) => (
            <div key={index} className="flex items-center">
              <Image src={logo.src} alt={logo.alt} width={50} height={50} />
              <span className="ml-2 text-sm text-gray-500 ">{logo.alt}</span>
            </div>
          ))}
        </div>

        {/* Social Icons */}
        <div className="mt-8 flex justify-center space-x-6">
          {socialIcons.map((social, index) => (
            <Link key={index} href={social.href} className="text-gray-400 hover:text-customgpt-primary transition-colors">
              <span className="sr-only">{social.name}</span>
              {social.icon}
            </Link>
          ))}
        </div>

        {/* Copyright */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 ">
            © Copyright 2025 – CustomGPT.ai – All Rights Reserved
          </p>
        </div>

        {/* Policy Links */}
        <div className="mt-4 flex justify-center space-x-4">
          <Link href="https://customgpt.ai/terms-and-conditions?utm_source=starterkit_page" className="text-sm text-gray-500 hover:underline hover:text-customgpt-primary transition-colors">
            Terms &amp; Conditions
          </Link>
          <Link href="https://customgpt.ai/privacy-policy?utm_source=starterkit_page" className="text-sm text-gray-500 hover:underline hover:text-customgpt-primary transition-colors">
            Privacy Policy
          </Link>
          <Link href="https://customgpt.ai/cookie-policy?utm_source=starterkit_page" className="text-sm text-gray-500 hover:underline hover:text-customgpt-primary transition-colors">
            Cookie Policy
          </Link>
        </div>


      </div>
    </footer>
  )
}

export default Footer