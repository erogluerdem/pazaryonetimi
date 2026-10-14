import type { Metadata } from 'next';
import { pageMetadata } from '@/config/seo-metadata';

export const metadata: Metadata = pageMetadata['/demo'];

export default function DemoLayout({ children }: { children: React.ReactNode }) {
    return children;
}
