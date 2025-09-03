import { Metadata } from 'next'
import LandingPage from '@/components/landing/LandingPage'

export const metadata: Metadata = {
  title: 'CustomGPT Developer Starter Kit - Open Source UI for RAG Applications',
  description: 'Build production-ready RAG interfaces in minutes, not months. Complete UI replacement for CustomGPT.ai with voice mode, multi-deployment options, and 9 social platform integrations.',
  keywords: ['CustomGPT', 'RAG', 'AI', 'Chatbot', 'Open Source', 'Developer Tools', 'UI Kit'],
  openGraph: {
    title: 'CustomGPT Developer Starter Kit',
    description: 'Build production-ready RAG interfaces in minutes, not months',
    type: 'website',
  },
  alternates: {
    types: {
      'application/json+oembed': `/api/oembed?url=${encodeURIComponent('https://starterkit.customgpt.ai/landing')}&format=json`,
      'text/xml+oembed': `/api/oembed?url=${encodeURIComponent('https://starterkit.customgpt.ai/landing')}&format=xml`,
    },
  },
}

export default function Landing() {
  return <LandingPage />
}