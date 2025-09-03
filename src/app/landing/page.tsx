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
}

export default function Landing() {
  return <LandingPage />
}