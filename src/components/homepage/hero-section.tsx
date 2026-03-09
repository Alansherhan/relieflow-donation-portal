import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface HeroSectionProps {
    donorCount: number;
}

export function HeroSection({ donorCount }: HeroSectionProps) {
    return (
        <section className="relative py-20 lg:py-28 px-4 md:px-6 lg:px-8 overflow-hidden">
            <div className="container max-w-6xl mx-auto">
                <div className="flex flex-col lg:flex-row items-center gap-12">
                    {/* Left Content */}
                    <div className="flex-1 text-center lg:text-left">
                        <Badge variant="secondary" className="mb-6 rounded-full px-4 py-2 text-sm font-medium">
                            <span className="mr-2">👥</span>
                            {donorCount}+ Active donors helping communities
                        </Badge>

                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 leading-tight">
                            Together for{' '}
                            <span className="block">disaster relief</span>
                            <span className="block">and recovery</span>
                        </h1>

                        <p className="text-lg text-muted-foreground mb-8 max-w-lg">
                            Request aid, volunteer your time, or donate to help communities rebuild after natural disasters.
                        </p>

                        <div className="text-center lg:text-left">
                            <Button size="lg" className="rounded-full px-8 gap-2 group cursor-pointer" asChild>
                                <Link href="/requests">
                                    Donate Now
                                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                </Link>
                            </Button>
                        </div>

                    </div>

                    {/* Right Content - Floating Cards */}
                    <div className="flex-1 relative hidden lg:block">
                        <div className="relative h-[500px]">
                            {/* Main Image */}
                            <div className="absolute inset-0 rounded-3xl overflow-hidden">
                                <img
                                    src="/images/volunteers.jpg"
                                    alt="Relief volunteers in action"
                                    width={600}
                                    height={500}
                                    className="w-full h-full object-cover"
                                    // priority
                                />
                            </div>

                            {/* Floating Testimonial */}
                            <div className="absolute -top-4 right-8 bg-white rounded-2xl shadow-lg p-4 max-w-[250px] border">
                                <p className="text-sm">"Because of this organization, I was given hope and a second chance."</p>
                            </div>

                            {/* Stats Badge */}
                            {/* <div className="absolute -bottom-4 left-8 bg-white rounded-2xl shadow-lg p-4 border">
                                <p className="text-sm font-medium">Real lives changed</p>
                                <p className="text-xs text-muted-foreground">by your support</p>
                                <div className="flex items-center gap-2 mt-2">
                                    <div className="flex -space-x-2">
                                        <div className="w-8 h-8 rounded-full bg-coral flex items-center justify-center text-xs font-medium text-coral-foreground">A</div>
                                        <div className="w-8 h-8 rounded-full bg-sand flex items-center justify-center text-xs font-medium text-sand-foreground">B</div>
                                        <div className="w-8 h-8 rounded-full bg-mint flex items-center justify-center text-xs font-medium text-mint-foreground">C</div>
                                    </div>
                                    <span className="font-bold">{donorCount > 0 ? `${(donorCount / 1000).toFixed(0)}k` : '9k'}</span>
                                </div>
                            </div>*/}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
