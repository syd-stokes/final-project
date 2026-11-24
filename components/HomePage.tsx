/**
 * ============================================================================
 * File:        components/HomePage.tsx
 * Created By:  Yawavi Nougloze
 * Component:   HomePage
 * Purpose:     Homepage/landing page for the Pokemon Guide.
 *              Features a blurb about the guide, Pokemon by pre-selected categories, detail cards,
 *              and a link to the Search component.
 *
 * External API: https://pokeapi.co/api/v2
 * Dependencies: react, styled-components (CSS-in-JS, per project rules)
 *
 * ============================================================================
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import styled from "styled-components";
import { categoryList, fetchFeaturedCategories, type Category, type PokeGroup} from '@/lib/pokeCategories';


export default function HomePage() {
    const [groups, setCategories] = useState<PokeGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [currCategory, setCurrCategory] = useState<string | null>(null);

    // function to fetch Pokemon according to the selected category in the nav sidebar
    // currently fetches 3 Pokemon per type or ability
    async function selectCategory(category: Category) {
        // set loading state to True while data is fetched
        setLoading(true);
        // set current category according to what is clicked on front-end
        setCurrCategory(category.label);

        try {
            // should try to fetch categories using lib function and set returned Pokemon to empty if fetching fails
            const results: PokeGroup[] = await fetchFeaturedCategories(category);

            // sets current groups of Pokemon according to fetched categories
            setCategories(results);

        } catch (error) {
            // if there's an error with the fetch, log it to console and groups to empty (nothing returned)
            setCategories([]);
            console.error(error);
        } finally {
            setLoading(false);
        }

    }

    return (
        <>
            <nav>
                <Link href="/">Home</Link>
                <Link href="/search">Search</Link>

                <ul>
                    {categoryList.map((cat) => (
                        <li key={cat.name}>
                            <button onClick={() => selectCategory(cat)}>{cat.label}</button>
                        </li>
                    ))}
                </ul>

            </nav>

            <main>
                <h1>Welcome to the PokeGuide</h1>
                <h2>Start browsing Pokemon by category:</h2>

                {!currCategory && (
                    <div>
                        <div>Pokemon 1</div>
                        <div>Pokemon 2</div>
                        <div>Pokemon 3</div>
                    </div>)}

                {currCategory && (
                    <div>
                        <p>Featured {currCategory}:</p>
                        <div>
                            {groups.map((opt) => (
                                <div key={opt.name}>
                                    <h3>{opt.name}</h3>
                                    <ul>
                                        {opt.pokemon.map((pokemon) => (
                                            <li key={pokemon.name}>
                                                <Link href={`/pokemon?name=${pokemon.name}`}>{pokemon.name}</Link>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </div>)}

                <p>OR</p>
                <Link href="/search">Search</Link>
            </main>
        </>

    )



}