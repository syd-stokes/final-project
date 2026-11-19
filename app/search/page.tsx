/**
 * File:       app/search/page.tsx
 * Created By: Catalina Huynh
 * Purpose:    Route entry for /search. Delegates all UI to SearchPage so
 *             the route file stays thin. Title uses child|parent format
 *             per the course's SEO convention.
 *
 * Test using: http://localhost:3000/search
 */
import type { Metadata } from "next";
import SearchPage from "@/components/SearchPage";

export const metadata: Metadata = {
    title: "Search | Pokemon Stats Analyzer",
    description:
        "Search and filter Pokemon by name, Pokedex number, type, and generation. Powered by PokeAPI.",
};

export default function SearchRoute() {
    return <SearchPage />;
}