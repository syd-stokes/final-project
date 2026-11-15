/**
 * ============================================================================
 * File:        components/SearchPage.tsx
 * Created By:  Catalina Huynh
 * Component:   SearchPage
 * Purpose:     Search / Filter page for the Pokemon Stats Analyzer.
 *              Lets a user (1) search Pokemon by name or Pokedex number,
 *              (2) filter by type, (3) filter by generation/region, and
 *              (4) sort the results. All data comes from the public PokeAPI.
 *
 * External API: https://pokeapi.co/api/v2  (no key required, CORS-enabled)
 * Dependencies: react, styled-components (CSS-in-JS, per project rules)
 *
 * Why "use client":
 *   We use useState / useEffect / useMemo and browser fetch(), so this must
 *   be a Client Component under the Next.js App Router.
 * ============================================================================
 */

"use client";

import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";

/* ---------------------------------------------------------------------------
 * Types
 * Kept local to this file so the component is self-contained. If
 * types/pokemon.ts already exports an equivalent shape, import that instead
 * to avoid duplicate type definitions across the project.
 * ------------------------------------------------------------------------- */
type NamedResource = { name: string; url: string };

/** One row in the master Pokemon list. */
type PokemonRow = { id: number; name: string };

type SortOrder = "id-asc" | "id-desc" | "name-asc" | "name-desc";

/* ---------------------------------------------------------------------------
 * Constants
 * ------------------------------------------------------------------------- */
const API_BASE = "https://pokeapi.co/api/v2";

/**
 * Generations expressed as Pokedex-ID ranges.
 * "value" is used as the <select> option value; min/max do the filtering.
 */
const GENERATIONS = [
    { label: "All generations",      value: 0, min: 0,    max: 99999 },
    { label: "Gen I - Kanto (1-151)",     value: 1, min: 1,    max: 151 },
    { label: "Gen II - Johto (152-251)",  value: 2, min: 152,  max: 251 },
    { label: "Gen III - Hoenn (252-386)", value: 3, min: 252,  max: 386 },
    { label: "Gen IV - Sinnoh (387-493)", value: 4, min: 387,  max: 493 },
    { label: "Gen V - Unova (494-649)",   value: 5, min: 494,  max: 649 },
    { label: "Gen VI - Kalos (650-721)",  value: 6, min: 650,  max: 721 },
    { label: "Gen VII - Alola (722-809)", value: 7, min: 722,  max: 809 },
    { label: "Gen VIII - Galar (810-905)",value: 8, min: 810,  max: 905 },
    { label: "Gen IX - Paldea (906-1025)",value: 9, min: 906,  max: 1025 },
];

/** How many cards to render at a time (perf + UX on long result lists). */
const PAGE_SIZE = 60;

/**
 * PokeAPI does not return sprite URLs in the list endpoint, but the sprite
 * repo follows a predictable path. This avoids ~1300 extra fetches.
 */
const spriteUrl = (id: number) =>
    `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;

/* ===========================================================================
 * STYLED COMPONENTS  (all styling lives here - no .css files, no inline styles)
 * =========================================================================== */

const PageWrapper = styled.section`
  padding: 2rem 1.5rem 3rem;
  font-family: "Segoe UI", "Helvetica Neue", Helvetica, Arial, sans-serif;
  color: #1f2430;
`;

const PageTitle = styled.h1`
  margin: 0 0 0.25rem;
  font-size: clamp(1.6rem, 4vw, 2.4rem); /* clamp() = responsive type */
  color: #2b3a67;
`;

const PageSubtitle = styled.p`
  margin: 0 0 2rem;
  max-width: 60ch;
  color: #5a6178;
  line-height: 1.5;
`;

/** The control bar. auto-fit + minmax keeps it usable down to phone widths. */
const Controls = styled.form`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem 1.25rem;
  padding: 1.25rem;
  background: #ffffff;
  border: 1px solid #e2e5ee;
  border-radius: 12px;
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
`;

const FieldLabel = styled.label`
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #5a6178;
`;

const sharedInputStyles = `
  padding: 0.55rem 0.7rem;
  font-size: 0.95rem;
  font-family: inherit;
  color: #1f2430;
  background: #f7f8fb;
  border: 1px solid #cfd4e2;
  border-radius: 8px;
  outline: none;

  &:focus {
    border-color: #2b3a67;
    box-shadow: 0 0 0 3px rgba(43, 58, 103, 0.15);
  }
`;

const TextInput = styled.input`
  ${sharedInputStyles}
`;

const Select = styled.select`
  ${sharedInputStyles}
  text-transform: capitalize;
`;

const ButtonRow = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 0.75rem;
`;

const PrimaryButton = styled.button`
  padding: 0.55rem 1.1rem;
  font-size: 0.95rem;
  font-weight: 600;
  font-family: inherit;
  color: #ffffff;
  background: #2b3a67;
  border: none;
  border-radius: 8px;
  cursor: pointer;

  &:hover { background: #1f2b4d; }
`;

const ResetButton = styled.button`
  padding: 0.55rem 1.1rem;
  font-size: 0.95rem;
  font-weight: 600;
  font-family: inherit;
  color: #2b3a67;
  background: transparent;
  border: 1px solid #2b3a67;
  border-radius: 8px;
  cursor: pointer;

  &:hover { background: #eef0f8; }
`;

const StatusText = styled.p`
  margin: 1.5rem 0 0;
  color: #5a6178;
`;

const ErrorText = styled.p`
  margin: 1.5rem 0 0;
  color: #b3261e;
  font-weight: 600;
`;

const ResultsGrid = styled.ul`
  list-style: none;          /* remove default bullets */
  margin: 1.5rem 0 0;
  padding: 0;                /* remove default indentation */
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 1rem;
`;

const PokemonCard = styled.li`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
  padding: 1rem 0.5rem;
  text-align: center;
  background: #ffffff;
  border: 1px solid #e2e5ee;
  border-radius: 12px;
  transition: transform 0.15s ease, box-shadow 0.15s ease;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 16px rgba(43, 58, 103, 0.12);
  }
`;

const Sprite = styled.img`
  width: 96px;
  height: 96px;
  max-width: 100%;      /* keeps sprites inside their card on tiny screens */
  image-rendering: pixelated;
`;

const PokemonName = styled.span`
  font-weight: 600;
  text-transform: capitalize;
`;

const PokemonId = styled.span`
  font-size: 0.78rem;
  color: #7a8195;
`;

const LoadMoreButton = styled.button`
  display: block;
  margin: 2rem auto 0;
  padding: 0.65rem 1.6rem;
  font-size: 0.95rem;
  font-weight: 600;
  font-family: inherit;
  color: #ffffff;
  background: #4a6fa5;
  border: none;
  border-radius: 999px;
  cursor: pointer;

  &:hover { background: #3a5a8a; }
`;

/* ===========================================================================
 * COMPONENT
 * =========================================================================== */
export default function SearchPage() {
    /* ---------- Master data (fetched once on mount) ---------- */
    const [allPokemon, setAllPokemon] = useState<PokemonRow[]>([]);
    const [typeOptions, setTypeOptions] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    /* ---------- User controls ---------- */
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedType, setSelectedType] = useState("all");
    const [selectedGen, setSelectedGen] = useState(0);
    const [sortOrder, setSortOrder] = useState<SortOrder>("id-asc");

    /* ---------- Type-filter results (separate fetch) ---------- */
    // null means "no type filter is active"
    const [typeMemberNames, setTypeMemberNames] = useState<Set<string> | null>(null);
    const [isTypeLoading, setIsTypeLoading] = useState(false);

    /* ---------- Pagination ---------- */
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

    /* ------------------------------------------------------------------
     * EFFECT 1: load every Pokemon name + every type name, once.
     * The `cancelled` flag prevents setting state after unmount
     * (React will warn about this otherwise).
     * ------------------------------------------------------------------ */
    useEffect(() => {
        let cancelled = false;

        async function loadInitialData() {
            try {
                setIsLoading(true);

                const [pokemonRes, typeRes] = await Promise.all([
                    fetch(`${API_BASE}/pokemon?limit=2000`),
                    fetch(`${API_BASE}/type`),
                ]);

                if (!pokemonRes.ok || !typeRes.ok) {
                    throw new Error("PokeAPI responded with a non-OK status");
                }

                const pokemonJson: { results: NamedResource[] } = await pokemonRes.json();
                const typeJson: { results: NamedResource[] } = await typeRes.json();

                if (cancelled) return;

                /* The list endpoint gives no ID field; it's the last URL segment,
                 * e.g. ".../pokemon/25/" -> 25 */
                const rows: PokemonRow[] = pokemonJson.results
                    .map((entry) => ({
                        id: Number(entry.url.split("/").filter(Boolean).pop()),
                        name: entry.name,
                    }))
                    .filter((row) => Number.isFinite(row.id))
                    .sort((a, b) => a.id - b.id);

                setAllPokemon(rows);

                /* "unknown" and "shadow" are internal PokeAPI pseudo-types, not real
                 * Pokemon types, so we drop them from the dropdown. */
                setTypeOptions(
                    typeJson.results
                        .map((t) => t.name)
                        .filter((name) => name !== "unknown" && name !== "shadow")
                );
            } catch {
                if (!cancelled) {
                    setErrorMsg(
                        "Could not load Pokemon data. Check your internet connection and refresh the page."
                    );
                }
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }

        loadInitialData();
        return () => {
            cancelled = true;
        };
    }, []);

    /* ------------------------------------------------------------------
     * EFFECT 2: when the type dropdown changes, fetch that type's members.
     * Runs only when selectedType changes; "all" short-circuits to null.
     * ------------------------------------------------------------------ */
    useEffect(() => {
        let cancelled = false;

        if (selectedType === "all") {
            setTypeMemberNames(null);
            setIsTypeLoading(false);
            return;
        }

        async function loadTypeMembers() {
            try {
                setIsTypeLoading(true);
                setTypeMemberNames(null); // clear stale results while loading

                const res = await fetch(`${API_BASE}/type/${selectedType}`);
                if (!res.ok) throw new Error("Type endpoint failed");

                const json: { pokemon: { pokemon: NamedResource }[] } = await res.json();
                if (cancelled) return;

                // A Set gives O(1) lookups during filtering.
                setTypeMemberNames(new Set(json.pokemon.map((p) => p.pokemon.name)));
            } catch {
                if (!cancelled) setTypeMemberNames(new Set()); // empty set = "no matches"
            } finally {
                if (!cancelled) setIsTypeLoading(false);
            }
        }

        loadTypeMembers();
        return () => {
            cancelled = true;
        };
    }, [selectedType]);

    /* ------------------------------------------------------------------
     * EFFECT 3: reset pagination whenever any filter changes, so the user
     * always starts at the top of a fresh result set.
     * ------------------------------------------------------------------ */
    useEffect(() => {
        setVisibleCount(PAGE_SIZE);
    }, [searchTerm, selectedType, selectedGen, sortOrder]);

    /* ------------------------------------------------------------------
     * DERIVED STATE: the filtered + sorted list.
     * useMemo so we don't recompute on unrelated re-renders.
     * ------------------------------------------------------------------ */
    const filteredPokemon = useMemo(() => {
        const gen = GENERATIONS.find((g) => g.value === selectedGen) ?? GENERATIONS[0];
        const term = searchTerm.trim().toLowerCase();

        // 1. Generation filter (ID range)
        let result = allPokemon.filter((p) => p.id >= gen.min && p.id <= gen.max);

        // 2. Name / Pokedex-number search
        if (term) {
            result = result.filter(
                (p) => p.name.includes(term) || String(p.id) === term
            );
        }

        // 3. Type filter (only if a type is selected and its members loaded)
        if (typeMemberNames) {
            result = result.filter((p) => typeMemberNames.has(p.name));
        }

        // 4. Sort on a COPY so we never mutate the array from state
        const sorted = [...result];
        switch (sortOrder) {
            case "id-desc":
                sorted.sort((a, b) => b.id - a.id);
                break;
            case "name-asc":
                sorted.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case "name-desc":
                sorted.sort((a, b) => b.name.localeCompare(a.name));
                break;
            default: // "id-asc"
                sorted.sort((a, b) => a.id - b.id);
        }

        return sorted;
    }, [allPokemon, searchTerm, selectedGen, typeMemberNames, sortOrder]);

    /* Slice for pagination - only render what fits on screen. */
    const visiblePokemon = filteredPokemon.slice(0, visibleCount);

    /* Reset every control back to its default. */
    function handleReset() {
        setSearchTerm("");
        setSelectedType("all");
        setSelectedGen(0);
        setSortOrder("id-asc");
    }

    /* ------------------------------------------------------------------
     * RENDER
     * ------------------------------------------------------------------ */
    return (
        <PageWrapper>
            <PageTitle>Search Pokemon</PageTitle>
            <PageSubtitle>
                Look up any Pokemon by name or Pokedex number, then narrow the list by
                type and generation. Data is provided live by PokeAPI.
            </PageSubtitle>

            {/* A <form> gives us free keyboard support: Enter submits the search. */}
            <Controls
                onSubmit={(event) => {
                    event.preventDefault(); // stop the page from reloading
                }}
            >
                <Field>
                    <FieldLabel htmlFor="pokemon-search">Name or number</FieldLabel>
                    <TextInput
                        id="pokemon-search"
                        type="search"
                        placeholder="e.g. pikachu or 25"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        autoComplete="off"
                    />
                </Field>

                <Field>
                    <FieldLabel htmlFor="type-filter">Type</FieldLabel>
                    <Select
                        id="type-filter"
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value)}
                    >
                        <option value="all">All types</option>
                        {typeOptions.map((typeName) => (
                            <option key={typeName} value={typeName}>
                                {typeName}
                            </option>
                        ))}
                    </Select>
                </Field>

                <Field>
                    <FieldLabel htmlFor="gen-filter">Generation / region</FieldLabel>
                    <Select
                        id="gen-filter"
                        value={selectedGen}
                        onChange={(e) => setSelectedGen(Number(e.target.value))}
                    >
                        {GENERATIONS.map((gen) => (
                            <option key={gen.value} value={gen.value}>
                                {gen.label}
                            </option>
                        ))}
                    </Select>
                </Field>

                <Field>
                    <FieldLabel htmlFor="sort-order">Sort by</FieldLabel>
                    <Select
                        id="sort-order"
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value as SortOrder)}
                    >
                        <option value="id-asc">Pokedex # (low to high)</option>
                        <option value="id-desc">Pokedex # (high to low)</option>
                        <option value="name-asc">Name (A to Z)</option>
                        <option value="name-desc">Name (Z to A)</option>
                    </Select>
                </Field>

                <Field>
                    <ButtonRow>
                        <PrimaryButton type="submit">Search</PrimaryButton>
                        <ResetButton type="button" onClick={handleReset}>
                            Reset
                        </ResetButton>
                    </ButtonRow>
                </Field>
            </Controls>

            {/* ---------- Status messages ---------- */}
            {isLoading && <StatusText>Loading Pokemon data...</StatusText>}
            {errorMsg && <ErrorText>{errorMsg}</ErrorText>}

            {!isLoading && !errorMsg && (
                <StatusText>
                    Showing {visiblePokemon.length} of {filteredPokemon.length} Pokemon
                    {isTypeLoading ? " (loading type data...)" : ""}
                </StatusText>
            )}

            {/* ---------- Results ---------- */}
            {!isLoading && !errorMsg && filteredPokemon.length === 0 && (
                <StatusText>
                    No Pokemon matched those filters. Try a different name, type, or
                    generation.
                </StatusText>
            )}

            {!isLoading && !errorMsg && filteredPokemon.length > 0 && (
                <>
                    <ResultsGrid>
                        {visiblePokemon.map((pokemon) => (
                            <PokemonCard key={pokemon.id}>
                                <Sprite
                                    src={spriteUrl(pokemon.id)}
                                    alt={`${pokemon.name} sprite`}
                                    loading="lazy"
                                    width={96}
                                    height={96}
                                />
                                <PokemonName>{pokemon.name}</PokemonName>
                                <PokemonId>#{String(pokemon.id).padStart(4, "0")}</PokemonId>
                            </PokemonCard>
                        ))}
                    </ResultsGrid>

                    {visibleCount < filteredPokemon.length && (
                        <LoadMoreButton
                            type="button"
                            onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
                        >
                            Load more
                        </LoadMoreButton>
                    )}
                </>
            )}
        </PageWrapper>
    );
}