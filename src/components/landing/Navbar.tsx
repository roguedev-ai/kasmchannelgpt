'use client'

import React, { useState } from "react";
import Link from "next/link";
import DropdownMenu from "./DropdownMenu";
// Replaced react-icons with SVG icons
import Image from "next/image";

interface NavItem {
  label: string;
  href?: string;
  dropdown?: {
    type: "simple" | "nested";
    items: any[];
  };
}

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleMobileMenu = () => setMobileOpen((prev) => !prev);

  // Sample nav items – adjust as needed.
  const navItems: NavItem[] = [
    {
      label: "Use Cases",
      dropdown: {
        type: "nested",
        items: [
          {
            category: "Customer Engagement",
            items: [
              {
                label: "Customer Service",
                href: "https://customgpt.ai/solution/customer-service?utm_source=starterkit_page",
              },
              {
                label: "Engagement Analytics",
                href: "https://customgpt.ai/use-case-lead-generation?utm_source=starterkit_page",
              },
            ],
          },
          {
            category: "Topic Research",
            items: [
              {
                label: "Research Assistance",
                href: "https://customgpt.ai/use-case-topic-research?utm_source=starterkit_page",
              },
              {
                label: "Site Search",
                href: "https://customgpt.ai/use-case/site-search?utm_source=starterkit_page",
              },
            ],
          },
          {
            category: "Knowledge Management",
            items: [
              {
                label: "Onboarding & Training",
                href: "https://customgpt.ai/use-case/onboarding-and-training?utm_source=starterkit_page",
              },
              {
                label: "Internal Search Tool",
                href: "https://customgpt.ai/use-case/internal-search?utm_source=starterkit_page",
              },
              {
                label: "Competitive Analysis",
                href: "https://customgpt.ai/use-case/competitive-analysis?utm_source=starterkit_page",
              },
            ],
          },
        ],
      },
    },



    {
      label: "Industries",
      dropdown: {
        type: "nested",
        items: [
          {
            category: "Professional Services",
            items: [
              { label: "Law", href: "https://customgpt.ai/use-case/legal?utm_source=starterkit_page" },
              { label: "Tax", href: "https://customgpt.ai/use-case/tax?utm_source=starterkit_page" },
              {
                label: "Insurance",
                href: "https://customgpt.ai/use-case/insurance?utm_source=starterkit_page",
              },
            ],
          },
          {
            category: "Technology",
            items: [
              {
                label: "Startups & SaaS",
                href: "https://customgpt.ai/use-case/startup?utm_source=starterkit_page",
              },
              {
                label: "Information Technology",
                href: "https://customgpt.ai/use-case/it-and-helpdesks?utm_source=starterkit_page",
              },
            ],
          },
          {
            category: "Public Sector",
            items: [
              {
                label: "Education",
                href: "https://customgpt.ai/use-case/education?utm_source=starterkit_page",
              },
              {
                label: "Government",
                href: "https://customgpt.ai/use-case/government?utm_source=starterkit_page",
              },
            ],
          },
          {
            category: "Manufacturing & Industrial",
            items: [
              {
                label: "Industrial Automation",
                href: "https://customgpt.ai/use-case/industrial?utm_source=starterkit_page",
              },
              {
                label: "Manufacturing",
                href: "https://customgpt.ai/use-case/manufacturing?utm_source=starterkit_page",
              },
            ],
          },
          {
            category: "Life Sciences",
            items: [
              {
                label: "Pharmaceuticals",
                href: "https://customgpt.ai/use-case/pharma?utm_source=starterkit_page",
              },
              {
                label: "Biotechnology",
                href: "https://customgpt.ai/use-case/biotech?utm_source=starterkit_page",
              },
            ],
          },
          {
            category: "Other Sectors",
            items: [
              {
                label: "Retail & E-commerce",
                href: "https://customgpt.ai/use-case/ecommerce?utm_source=starterkit_page",
              },
              {
                label: "Finance & Banking",
                href: "https://customgpt.ai/use-case/finance-and-banking?utm_source=starterkit_page",
              },
              {
                label: "Healthcare",
                href: "https://customgpt.ai/use-case/healthcare?utm_source=starterkit_page",
              },
            ],
          },
        ],
      },
    },
    { label: "Pricing", href: "https://customgpt.ai/pricing?utm_source=starterkit_page" },

    {
      label: "Resources",
      dropdown: {
        type: "simple",
        items: [
          { label: "Case Studies", href: "https://customgpt.ai/customers?utm_source=starterkit_page" },
          { label: "FAQs", href: "https://customgpt.ai/faq?utm_source=starterkit_page" },
          {
            label: "Partner Directory",
            href: "https://customgpt.ai/partner-directory",
          },
          { label: "Blog", href: "https://customgpt.ai/blog" },
          { label: "Security & Trust", href: "https://customgpt.ai/security?utm_source=starterkit_page" },
          { label: "GDPR", href: "https://customgpt.ai/gdpr-compliance?utm_source=starterkit_page" },
          { label: "Documentation", href: "https://docs.customgpt.ai?utm_source=starterkit_page" },
          { label: "Free Tools", href: "https://customgpt.ai/free-tools?utm_source=starterkit_page" },
          { label: "API", href: "https://customgpt.ai/api?utm_source=starterkit_page" },
        ],
      },
    },
    {
      label: "Company",
      dropdown: {
        type: "simple",
        items: [
          { label: "About Us", href: "https://customgpt.ai/about-us?utm_source=starterkit_page" },
          { label: "Testimonials", href: "https://customgpt.ai/testimonials?utm_source=starterkit_page" },
          { label: "Affiliate Program", href: "https://customgpt.ai/partners?utm_source=starterkit_page" },
          { label: "Contact Us", href: "https://customgpt.ai/contact-us?utm_source=starterkit_page" },
        ],
      },
    },

    {
      label: "Enterprise",
      href: "https://customgpt.ai/enterprise-solutions-customgpt?utm_source=comparison_blog_navbar",
    },
    {
      label: "Login",
      href: "https://app.customgpt.ai?utm_source=comparison_blog_navbar",
    },
  ];

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <div className="flex-shrink-0 cursor-pointer">
            <Link href="/">
              <Image
                width={160}
                height={40}
                alt="CustomGPT.ai Logo"
                lang="en"
                src="/favicon/logo.svg"
                className="h-8 sm:h-10 w-auto"
              />
            </Link>
          </div>
          {/* Desktop Menu */}
          <div className="hidden lg:flex space-x-2 xl:space-x-4 items-center z-999">
            {navItems.map((item, index) =>
              item.dropdown ? (
                <DropdownMenu
                  key={index}
                  title={item.label}
                  items={item.dropdown.items}
                  type={item.dropdown.type}
                />
              ) : (
                <Link key={index} href={item.href!} className="px-2 xl:px-3 py-2 text-sm xl:text-base text-gray-700 hover:bg-gray-100 rounded cursor-pointer whitespace-nowrap">
                  {item.label}
                </Link>
              )
            )}
          </div>
          {/* Right Button */}
          <div className="hidden lg:block">
            <Link
              href="https://app.customgpt.ai/register?utm_source=starterkit_navbar"
              className="px-4 xl:px-8 py-2 xl:py-3 text-sm xl:text-base bg-gray-200 rounded-4xl cursor-pointer text-white bg-gradient-to-r from-customgpt-primary to-customgpt-secondary transition-colors duration-300 hover:from-customgpt-secondary hover:to-customgpt-primary whitespace-nowrap"
            >
              Try for free
            </Link>
          </div>
          {/* Mobile Menu Button */}
          <div className="lg:hidden">
            <button
              onClick={toggleMobileMenu}
              className="text-gray-700 focus:outline-none"
              aria-label="Toggle mobile menu"
            >
              {mobileOpen ? (
                <svg className="cursor-pointer w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.3 5.71a.996.996 0 0 0-1.41 0L12 10.59 7.11 5.7A.996.996 0 1 0 5.7 7.11L10.59 12 5.7 16.89a.996.996 0 1 0 1.41 1.41L12 13.41l4.89 4.89a.996.996 0 0 0 1.41-1.41L13.41 12l4.89-4.89c.38-.38.38-1.02 0-1.4z" />
                </svg>
              ) : (
                <svg className="cursor-pointer w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="lg:hidden bg-white border-t border-gray-200">
          <div className="px-4 pt-4 pb-3 space-y-2 w-full">
            {navItems.map((item, index) =>
              item.dropdown ? (
                // Reuse DropdownMenu for mobile (tap to toggle dropdown)
                <DropdownMenu
                  key={index}
                  title={item.label}
                  items={item.dropdown.items}
                  type={item.dropdown.type}
                />
              ) : (
                <Link 
                  key={index} 
                  href={item.href!} 
                  className="block px-3 py-3 text-base font-medium text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer"
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </Link>
              )
            )}
            <div className="pt-4 border-t border-gray-200 mt-4">
              <Link
                href="https://app.customgpt.ai/register?utm_source=starterkit_navbar"
                className="block w-full text-center px-6 py-3 bg-gray-200 rounded-2xl cursor-pointer text-white bg-gradient-to-r from-customgpt-primary to-customgpt-secondary transition-colors duration-300 hover:from-customgpt-secondary hover:to-customgpt-primary"
                onClick={() => setMobileOpen(false)}
              >
                Try for free
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;