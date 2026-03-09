'use client';

import { useEffect, useState } from 'react';
import { portalApi } from '@/lib/api';
import { HeroSection } from '@/components/homepage/hero-section';
import { StatsSection } from '@/components/homepage/stats-section';
import { PlatformOverview } from '@/components/homepage/platform-overview';
import { ActiveRequests } from '@/components/homepage/active-requests';
import { CtaBanner } from '@/components/homepage/cta-banner';
import { AppDownload } from '@/components/homepage/app-download';
import { Footer } from '@/components/homepage/footer';

// Define types here or import from a shared types file if available.
// For now, mirroring the types used in components.
interface WalletInfo {
  balance: number;
  totalCredits: number;
  donorCount: number;
}

interface DonationRequest {
  _id: string;
  title: string;
  description: string;
  donationType: 'cash' | 'item';
  amount?: number;
  fulfilledAmount?: number;
  deadline?: string;
  proofImages?: string[];
}

export default function HomePage() {
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [requests, setRequests] = useState<DonationRequest[]>([]);
  const [requestCount, setRequestCount] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [walletRes, requestsRes] = await Promise.all([
          portalApi.getWalletInfo(),
          portalApi.getPublicDonationRequests({ limit: 3 }),
        ]);

        if (walletRes.data.success) {
          setWalletInfo(walletRes.data.data);
        }
        if (requestsRes.data.success) {
          setRequests(requestsRes.data.data || []);
          setRequestCount(requestsRes.data.pagination?.total || 0);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="flex flex-col -mx-4 md:-mx-6 lg:-mx-8">
      <HeroSection donorCount={walletInfo?.donorCount || 0} />

      <StatsSection
        walletInfo={walletInfo}
        requestCount={requestCount}
      />

      <PlatformOverview
        donorCount={walletInfo?.donorCount || 0}
        requestCount={requestCount}
      />

      <ActiveRequests requests={requests} />

      <CtaBanner donorCount={walletInfo?.donorCount || 0} />

      <AppDownload />

      <Footer />
    </div>
  );
}
