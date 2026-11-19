/**
 * File:       app/sitemap.ts
 * Created By: Catalina Huynh
 * Purpose:    This is a sitmap
 */
import type { MetadataRoute } from "next";

const BASE_URL = "https://example.com"; // TODO: replace with real domain

export default function sitemap(): MetadataRoute.Sitemap {
    return [
        { url: `${BASE_URL}/search`, lastModified: new Date(), priority: 0.8 },
    ];
}