'use client';

import { jsPDF } from 'jspdf';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { useState } from 'react';

interface DonationData {
    _id: string;
    donorName: string;
    donorEmail?: string;
    donationType: 'cash' | 'item';
    amount?: number;
    itemDetails?: Array<{ category: string; quantity: string; description?: string; unit?: string }>;
    transactionRef?: string;
    status: string;
    createdAt: string;
    donationRequest?: {
        title: string;
    };
    isWalletDonation?: boolean;
}

interface ReceiptGeneratorProps {
    donation: DonationData;
}

export function ReceiptGenerator({ donation }: ReceiptGeneratorProps) {
    const [isGenerating, setIsGenerating] = useState(false);

    const generateReceipt = async () => {
        setIsGenerating(true);

        try {
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();
            let y = 20;

            // Header
            doc.setFillColor(37, 99, 235); // Primary blue
            doc.rect(0, 0, pageWidth, 40, 'F');

            // Logo text
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(24);
            doc.setFont('helvetica', 'bold');
            doc.text('RelieFlow', 20, 28);

            doc.setFontSize(12);
            doc.setFont('helvetica', 'normal');
            doc.text('Donation Receipt', pageWidth - 20, 28, { align: 'right' });

            // Reset colors
            doc.setTextColor(0, 0, 0);
            y = 55;

            // Receipt info box
            doc.setFillColor(245, 245, 245);
            doc.roundedRect(15, y, pageWidth - 30, 25, 3, 3, 'F');

            doc.setFontSize(10);
            doc.setTextColor(100, 100, 100);
            doc.text('Receipt Number', 20, y + 10);
            doc.text('Date', pageWidth / 2, y + 10);

            doc.setFontSize(12);
            doc.setTextColor(0, 0, 0);
            doc.setFont('helvetica', 'bold');
            doc.text(donation._id.slice(-8).toUpperCase(), 20, y + 18);
            doc.text(new Date(donation.createdAt).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            }), pageWidth / 2, y + 18);

            y += 35;

            // Donor section
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(14);
            doc.text('Donor Information', 20, y);
            y += 8;

            doc.setDrawColor(200, 200, 200);
            doc.line(20, y, pageWidth - 20, y);
            y += 10;

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(11);

            const addRow = (label: string, value: string) => {
                doc.setTextColor(100, 100, 100);
                doc.text(label, 20, y);
                doc.setTextColor(0, 0, 0);
                doc.text(value, 80, y);
                y += 8;
            };

            addRow('Name:', donation.donorName);
            if (donation.donorEmail) {
                addRow('Email:', donation.donorEmail);
            }

            y += 5;

            // Donation details section
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(14);
            doc.text('Donation Details', 20, y);
            y += 8;

            doc.line(20, y, pageWidth - 20, y);
            y += 10;

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(11);

            const purpose = donation.isWalletDonation
                ? 'Relief Fund'
                : donation.donationRequest?.title || 'General Donation';
            addRow('Purpose:', purpose);
            addRow('Type:', donation.donationType === 'cash' ? 'Cash Donation' : 'Item Donation');

            if (donation.donationType === 'cash' && donation.amount) {
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(16);
                doc.setTextColor(37, 99, 235);
                y += 5;
                doc.text(`Amount: Rs. ${donation.amount.toLocaleString('en-IN')}`, 20, y);
                doc.setTextColor(0, 0, 0);
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(11);
                y += 10;
            }

            if (donation.donationType === 'item' && donation.itemDetails?.length) {
                y += 2;
                doc.setFont('helvetica', 'bold');
                doc.text('Items Donated:', 20, y);
                y += 8;
                doc.setFont('helvetica', 'normal');

                donation.itemDetails.forEach((item, index) => {
                    doc.text(`${index + 1}. ${item.category} - Qty: ${item.quantity} ${item.unit || 'pieces'}`, 25, y);
                    y += 6;
                });
                y += 4;
            }

            if (donation.transactionRef) {
                addRow('Transaction Ref:', donation.transactionRef);
            }
            // addRow('Status:', donation.status.replace(/_/g, ' ').toUpperCase());

            y += 10;

            // Thank you message
            doc.setFillColor(240, 253, 244); // Light green
            doc.roundedRect(15, y, pageWidth - 30, 30, 3, 3, 'F');

            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(22, 163, 74); // Green
            doc.text('Thank you for your generous donation!', pageWidth / 2, y + 12, { align: 'center' });

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100, 100, 100);
            doc.text('Your contribution helps those affected by disasters.', pageWidth / 2, y + 22, { align: 'center' });

            // Footer
            y = doc.internal.pageSize.getHeight() - 20;
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text('This is a computer-generated receipt and does not require a signature.', pageWidth / 2, y, { align: 'center' });
            doc.text(`Generated on ${new Date().toLocaleString('en-IN')}`, pageWidth / 2, y + 5, { align: 'center' });

            // Save PDF
            const fileName = `RelieFlow_Receipt_${donation._id.slice(-8).toUpperCase()}.pdf`;
            doc.save(fileName);

        } catch (error) {
            console.error('Failed to generate receipt:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <Button onClick={generateReceipt} disabled={isGenerating} variant="outline">
            {isGenerating ? (
                <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                </>
            ) : (
                <>
                    <Download className="h-4 w-4 mr-2" />
                    Download Receipt
                </>
            )}
        </Button>
    );
}
