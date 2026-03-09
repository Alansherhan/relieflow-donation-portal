import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Users } from 'lucide-react';

interface CtaBannerProps {
    donorCount: number;
}

export function CtaBanner({ donorCount }: CtaBannerProps) {
    return (
        <section className="py-20 px-4 md:px-6 lg:px-8 bg-coral">
            <div className="container max-w-6xl mx-auto">
                <div className="text-center mb-8">
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-coral-foreground mb-4">
                        Together, We Can Make a Difference
                    </h2>
                    <p className="text-coral-foreground/80 max-w-xl mx-auto">
                        Your support empowers us to provide essential resources to those affected by disasters
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                    <Button size="lg" className="rounded-full px-8 bg-dark text-dark-foreground hover:bg-dark/90" asChild>
                        <Link href="/requests">
                            Donate Now
                        </Link>
                    </Button>
                    <Button size="lg" variant="outline" className="rounded-full px-8 bg-white/90 border-0 hover:bg-white" asChild>
                        <Link href="#volunteer-app">
                            Become a Volunteer
                        </Link>
                    </Button>
                </div>

                <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                    {/* Left Stats */}
                    <div className="text-coral-foreground">
                        <p className="font-medium text-sm mb-1">Total people involved</p>
                        <p className="text-sm opacity-80">Building Brighter Futures</p>
                        <p className="text-sm opacity-80">Through Community Support</p>
                        <div className="flex items-center gap-2 mt-3">
                            <div className="flex -space-x-2">
                                <div className="w-8 h-8 rounded-full bg-white/30 border-2 border-coral" />
                                <div className="w-8 h-8 rounded-full bg-white/30 border-2 border-coral" />
                                <div className="w-8 h-8 rounded-full bg-white/30 border-2 border-coral" />
                            </div>
                            <span className="font-bold text-xl">{donorCount > 0 ? `${(donorCount / 1000).toFixed(0)}K+` : '16K+'} peoples</span>
                        </div>
                    </div>

                    {/* Center Image Placeholder */}
                    <div className="relative">
                        <div className="bg-coral/50 rounded-full w-64 h-64 absolute -top-8 left-1/2 -translate-x-1/2 opacity-30" />
                        <div className="relative z-10 flex items-end justify-center h-48">
                            <div className="text-center">
                                <Users className="h-20 w-20 mx-auto text-coral-foreground/60" />
                                <p className="text-coral-foreground/80 text-sm mt-2">Our volunteer community</p>
                            </div>
                        </div>
                    </div>

                    {/* Right Stats */}
                    <div className="space-y-2">
                        <div className="bg-white/90 rounded-lg px-3 py-1.5 text-sm text-coral-foreground">
                            Total people involved
                        </div>
                        <div className="bg-white/90 rounded-lg px-3 py-1.5 text-sm text-coral-foreground">
                            for vulnerable families
                        </div>
                        <div className="bg-white/90 rounded-lg px-3 py-1.5 text-sm text-coral-foreground">
                            and individuals
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
