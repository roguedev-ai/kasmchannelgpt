'use client'

import React, { useState, useRef } from "react";
import Link from "next/link";
import { useIsMobile } from "../../hooks/useIsMobile";

interface DropdownItem {
  label: string;
  href: string;
}

interface NestedDropdownGroup {
  category: string;
  items: DropdownItem[];
}

interface DropdownMenuProps {
  title: string;
  items: DropdownItem[] | NestedDropdownGroup[];
  type?: "simple" | "nested";
}

const DropdownMenu = ({ title, items, type = "simple" }: DropdownMenuProps) => {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (!isMobile) {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = null;
      }
      setIsOpen(true);
    }
  };

  const handleMouseLeave = () => {
    if (!isMobile) {
      closeTimeoutRef.current = setTimeout(() => {
        setIsOpen(false);
      }, 300); // 300ms delay before closing
    }
  };

  const handleToggle = () => {
    if (isMobile) setIsOpen((prev) => !prev);
  };

  return (
    <div
      className={`${isMobile ? "block text-center" : "inline-block"} relative`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        onClick={handleToggle}
        className={`flex items-center focus:outline-none cursor-pointer w-full ${
          isMobile ? "justify-center" : "text-left"
        }`}
      >
        <span className="text-gray-700 text-sm xl:text-base">{title}</span>
        <svg
          className={`w-4 h-4 ml-1 transition-transform duration-300 ${
            isOpen ? "rotate-0" : "rotate-180"
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M19 9l-7 7-7-7"
          ></path>
        </svg>
      </button>
      {isMobile ? (
        // Mobile: Render dropdown only when open to avoid gaps
        isOpen && (
          <div className="relative mt-2 bg-white border border-gray-200 w-72 sm:w-80 rounded-2xl shadow-2xl z-10 mx-auto">
            {type === "simple" && (
              <ul className="flex flex-col">
                {(items as DropdownItem[]).map((item, index) => (
                  <li
                    key={index}
                    className="px-4 py-2 text-sm hover:bg-gray-100 cursor-pointer"
                  >
                    <Link href={item.href} className="text-gray-700 block">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            {type === "nested" && (
              <div className="py-2">
                {(items as NestedDropdownGroup[]).map((group, index) => (
                  <div key={index}>
                    <div className="px-4 py-1 text-md font-semibold text-black">
                      {group.category}
                    </div>
                    <ul className="flex flex-col">
                      {group.items.map((item, idx) => (
                        <li
                          key={idx}
                          className="px-6 py-2 text-gray-700 font-extralight text-sm hover:bg-gray-100 cursor-pointer"
                        >
                          <Link href={item.href} className="text-gray-700 block">
                            {item.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      ) : (
        // Desktop: Always render dropdown with transitions
        <div
          className={`absolute left-0 mt-2 bg-white border border-gray-200 w-64 xl:w-72 rounded-2xl shadow-2xl z-50 transform transition-all duration-300 ease-out ${
            isOpen
              ? "opacity-100 scale-100"
              : "opacity-0 scale-95 pointer-events-none"
          }`}
        >
          {type === "simple" && (
            <ul className="flex flex-col">
              {(items as DropdownItem[]).map((item, index) => (
                <li
                  key={index}
                  className="px-4 py-2 text-sm hover:bg-gray-100 cursor-pointer"
                >
                  <Link href={item.href} className="text-gray-700 block">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {type === "nested" && (
            <div className="py-2">
              {(items as NestedDropdownGroup[]).map((group, index) => (
                <div key={index}>
                  <div className="px-4 py-1 text-md font-semibold text-black">
                    {group.category}
                  </div>
                  <ul className="flex flex-col">
                    {group.items.map((item, idx) => (
                      <li
                        key={idx}
                        className="px-6 py-2 text-gray-700 font-extralight text-sm hover:bg-gray-100 cursor-pointer"
                      >
                        <Link href={item.href} className="text-gray-700 block">
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DropdownMenu;