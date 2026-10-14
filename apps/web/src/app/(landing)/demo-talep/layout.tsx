import type { Metadata } from 'next';
import { pageMetadata } from '@/config/seo-metadata';

export const metadata: Metadata = pageMetadata['/demo-talep'];

export default function DemoTalepLayout({ children }: { children: React.ReactNode }) {
    return children;
}
