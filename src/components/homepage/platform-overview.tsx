import { Smartphone, Users, Heart } from 'lucide-react';

interface PlatformOverviewProps {
    donorCount: number;
    requestCount: number;
}

export function PlatformOverview({ donorCount, requestCount }: PlatformOverviewProps) {
    return (
        <section id="how-it-works" className="py-12 px-4 md:px-6 lg:px-8">
            <div className="container max-w-6xl mx-auto">
                <div className="bg-mint rounded-[2.5rem] p-8 md:p-16 relative overflow-hidden">
                    {/* Grid Pattern Background */}
                    <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                            backgroundImage: `
                linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)
              `,
                            backgroundSize: '40px 40px',
                            maskImage: 'linear-gradient(to bottom, black 40%, transparent 100%)',
                            WebkitMaskImage: 'linear-gradient(to bottom, black 40%, transparent 100%)'
                        }}
                    />

                    {/* Decorative Elements */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 relative z-10">
                        {/* Left Content */}
                        <div>
                            <h2 className="text-2xl md:text-4xl font-semibold mb-12 text-mint-foreground leading-tight">
                                Discover the Impact<br />of Helping Others
                            </h2>

                            <div className="space-y-6">
                                {[
                                    {
                                        icon: Smartphone,
                                        title: "Request Aid",
                                        description: "An invitation for affected individuals to request help through our public app during emergencies."
                                    },
                                    {
                                        icon: Users,
                                        title: "Volunteer Network",
                                        description: "A call for volunteers to join our network and help with relief distribution efforts."
                                    },
                                    {
                                        icon: Heart,
                                        title: "Donate & Track",
                                        description: "A reminder that every donation counts. Contribute and track your positive impact."
                                    }
                                ].map((card, index) => (
                                    <div key={index} className="bg-white rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex flex-col gap-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0">
                                                    <card.icon className="h-6 w-6 text-black" />
                                                </div>
                                                <h3 className="font-semibold text-xl">{card.title}</h3>
                                            </div>
                                            <p className="text-muted-foreground text-md leading-relaxed font-semibold">
                                                {card.description}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right Content */}
                        <div className="flex flex-col h-full">
                            {/* Top Description */}
                            <div className="mb-auto ml-auto max-w-sm text-right">
                                <p className="text-mint-foreground/80 mb-6 text-sm md:text-base">
                                    Together, we can make a real impact in communities around the world. Help us bring hope and support.
                                </p>

                                {/* Floating Badge */}
                                { /* <div className="inline-flex items-center gap-3 bg-white rounded-full pl-2 pr-6 py-2 shadow-sm">
                                    <div className="flex -space-x-2">
                                        <div className="w-8 h-8 rounded-full bg-coral border-2 border-white flex items-center justify-center text-[10px] text-white font-bold">R</div>
                                        <div className="w-8 h-8 rounded-full bg-sand border-2 border-white flex items-center justify-center text-[10px] text-white font-bold">S</div>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Lives Changed</p>
                                        <p className="text-xs font-bold text-foreground">By Your Support</p>
                                    </div>
                                </div>*/}
                            </div>

                            {/* Center - ReliefFlow Branding Circle */}
                            <div className="relative mt-12 lg:mt-0 flex items-center justify-center flex-grow">
                                {/* Main Circle */}
                                <div className="relative w-[300px] h-[300px] md:w-[400px] md:h-[400px] rounded-full bg-mint-foreground/5 flex flex-col items-center justify-center text-center p-8 backdrop-blur-sm">

                                    <Heart className="h-20 w-20 md:h-24 md:w-24 text-coral fill-coral mb-4" />

                                    <h3 className="text-3xl md:text-4xl font-bold text-mint-foreground mb-2">RelieFlow</h3>
                                    <p className="text-mint-foreground/60 font-medium uppercase tracking-widest text-xs md:text-sm mb-8">Disaster Relief Platform</p>

                                    <div className="grid grid-cols-2 gap-8 w-full max-w-[200px] border-t border-mint-foreground/10 pt-6">
                                        <div>
                                            <p className="text-2xl font-bold text-mint-foreground mb-1">{donorCount}+</p>
                                            <p className="text-xs text-mint-foreground/60 font-medium uppercase">Donors</p>
                                        </div>
                                        <div>
                                            <p className="text-2xl font-bold text-mint-foreground mb-1">{requestCount}+</p>
                                            <p className="text-xs text-mint-foreground/60 font-medium uppercase">Requests</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
