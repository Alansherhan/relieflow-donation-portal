import Link from 'next/link';
import { Heart } from 'lucide-react';

export function Footer() {
    return (
        <footer className="py-12 px-4 md:px-6 lg:px-8 border-t">
            <div className="container max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2">
                        <Heart className="h-6 w-6 text-coral fill-coral" />
                        <span className="font-bold text-xl">RelieFlow</span>
                    </div>

                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                        <Link href="/requests" className="hover:text-foreground transition-colors">
                            Donation Requests
                        </Link>
                        <Link href="/donate/wallet" className="hover:text-foreground transition-colors">
                            Relief Fund
                        </Link>
                        <Link href="#how-it-works" className="hover:text-foreground transition-colors">
                            How It Works
                        </Link>
                    </div>

                    <p className="text-sm text-muted-foreground">
                        © 2026 RelieFlow. Supporting disaster relief efforts.
                    </p>
                </div>
            </div>
        </footer>
    );
}
