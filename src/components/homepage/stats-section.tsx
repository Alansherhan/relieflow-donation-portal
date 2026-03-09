import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface WalletInfo {
    balance: number;
    totalCredits: number;
    donorCount: number;
}

interface StatsSectionProps {
    walletInfo: WalletInfo | null;
    requestCount: number;
}

export function StatsSection({ walletInfo, requestCount }: StatsSectionProps) {
    return (
        <section className="py-20 px-4 md:px-6 lg:px-8">
            <div className="container max-w-6xl mx-auto">
                <div className="text-center mb-16">
                    <Badge variant="secondary" className="mb-4 rounded-full px-4 py-2 bg-green-100 text-green-800 hover:bg-green-100 border-0">
                        <span className="mr-2">⚡</span>
                        Impactful metrics
                    </Badge>
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight">
                        Programs that change lives
                    </h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
                        Together, we can make a real impact in communities around the
                        world. Help us bring hope and support.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                    {/* Card 1 - Total Donations (Coral) */}
                    <div className="bg-coral rounded-[2.5rem] p-8 relative overflow-hidden h-[500px] flex flex-col group">
                        <div className="relative z-10">
                            <h3 className="text-6xl md:text-7xl font-bold text-white mb-2">
                                ₹{walletInfo?.totalCredits?.toLocaleString() || '0'}
                            </h3>
                            <p className="text-white/90 font-medium text-lg mb-8">Total Donations</p>

                            <div className="bg-white rounded-[2rem] p-4 max-w-[200px] shadow-sm">
                                <p className="text-sm font-medium leading-relaxed">
                                    Supporting disaster relief for vulnerable families.
                                </p>
                            </div>
                        </div>

                        <div className="mt-auto relative z-10">
                            <Button size="icon" className="rounded-full h-12 w-12 bg-white text-black hover:bg-white/90">
                                <ArrowRight className="h-5 w-5" />
                            </Button>
                        </div>

                        <div className="absolute -bottom-10 right-0 w-[80%] h-[80%] translate-x-[-12%] translate-y-[22%] pointer-events-none">
                            <Image
                                src="/images/donation-hand.png"
                                alt="Donation hand"
                                fill
                                className="object-contain object-bottom scale-y-[-1]"
                            />
                        </div>
                    </div>

                    {/* Card 2 - Active Donors (Dark) */}
                    <div className="bg-black rounded-[2.5rem] p-8 relative overflow-hidden h-[500px] flex flex-col text-white">
                        <div className="relative z-10 text-center mx-auto">
                            <h3 className="text-6xl md:text-7xl font-bold mb-2">
                                {walletInfo?.donorCount || 0}+
                            </h3>
                            <p className="text-white/80 font-medium text-lg mb-8">Active Donors</p>

                            <div className="bg-white rounded-full py-2 px-6 shadow-sm inline-block mx-auto mb-4">
                                <p className="text-xs font-bold text-black uppercase tracking-wide">
                                    Generous donors making impact
                                </p>
                            </div>
                        </div>

                        <div className="mt-auto absolute -bottom-12 left-0 right-0 h-[60%] w-full">
                            <Image
                                src="/images/people.avif"
                                alt="Group of donors"
                                fill
                                className="object-cover object-top grayscale"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
                        </div>
                    </div>

                    {/* Card 3 - Requests Fulfilled (Sand) */}
                    <div className="bg-sand rounded-[2.5rem] p-8 relative overflow-hidden h-[500px] flex flex-col">
                        <div className="relative z-10">
                            <h3 className="text-6xl md:text-7xl font-bold text-sand-foreground mb-2">
                                {requestCount || 0}+
                            </h3>
                            <p className="text-sand-foreground/80 font-medium text-lg mb-8">Requests Fulfilled</p>

                            <div className="bg-white/80 backdrop-blur-sm rounded-[2rem] p-4 max-w-[220px] shadow-sm">
                                <p className="text-sm font-medium leading-relaxed text-sand-foreground">
                                    Relief requests successfully delivered to communities.
                                </p>
                            </div>
                        </div>

                        <div className="absolute -bottom-12 right-0 left-0 h-[50%] w-full pointer-events-none">
                            <Image
                                src="/images/home.avif"
                                alt="Relief delivery"
                                fill
                                className="object-cover object-center grayscale opacity-80 mix-blend-multiply"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
