"use client";

/**
 * ============================================================================
 * File:        components/SearchPage.tsx
 * Created By:  Catalina Huynh
 * Component:   SearchPage
 * Purpose:     Search / Filter page for the Pokemon Stats Analyzer.
 *              Search by name/Pokedex number, filter by type, filter by
 *              generation/region, and sort the results. Data from PokeAPI.
 *
 *              Pokemon that are forms/variants of the same species are
 *              grouped under a single "family" card. Clicking the card's
 *              sprite/name/ID expands a Pokedex entry (description, genus,
 *              habitat, capture rate, generation, legendary/mythical status)
 *              fetched from PokeAPI's /pokemon-species endpoint, plus a
 *              "Read more" link to the matching Pokemon Wiki (Fandom) page.
 *
 * External APIs:
 *   - https://pokeapi.co/api/v2        (Pokemon list, types, species detail)
 *   - https://pokemon.fandom.com/wiki  (external "read more" link only)
 *
 * Dependencies: react, styled-components, next/font (Press Start 2P)
 *
 * Styling/Design Inspiration:
 *   Matches components/DetailPage.tsx. Palette:
 *   https://coolors.co/2d728f-d2e8ee-f5ee9e-f49e4c-ab3428
 *
 * Why "use client":
 *   Uses useState / useEffect / useMemo and browser fetch().
 *
 * Why PokeAPI species instead of Fandom's MediaWiki API for the info panel:
 *   pokemon.fandom.com has the TextExtracts extension disabled, so there is
 *   no clean "intro paragraph" endpoint. Its parse endpoint returns infobox
 *   HTML that would need fragile per-Pokemon stripping. PokeAPI's
 *   /pokemon-species/{id} returns the same canonical data as clean JSON.
 *   The wiki link lets users jump to the full article when they want more.
 * ============================================================================
 */

import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { Press_Start_2P } from "next/font/google";

/* ---------------------------------------------------------------------------
 * Theme (shared with DetailPage.tsx)
 * ------------------------------------------------------------------------- */
const pixelFont = Press_Start_2P({ weight: "400", subsets: ["latin"] });
const PIXEL = pixelFont.style.fontFamily;

const BRICK_RED = "#ab3428";
const DARK_BRICK_RED = "#73231c";
const PAGE_BG = "#cbedef";

/* ---------------------------------------------------------------------------
 * Types
 * ------------------------------------------------------------------------- */
type NamedResource = { name: string; url: string };
type PokemonRow = { id: number; name: string };
type SortOrder = "id-asc" | "id-desc" | "name-asc" | "name-desc";

type PokemonGroup = {
    base: PokemonRow;
    variants: PokemonRow[];
};

/** Shape of the fields we read from PokeAPI /pokemon-species/{id}. */
type SpeciesApiResponse = {
    genera?: { genus: string; language: { name: string } }[];
    flavor_text_entries?: { flavor_text: string; language: { name: string } }[];
    habitat?: { name: string } | null;
    capture_rate?: number;
    is_legendary?: boolean;
    is_mythical?: boolean;
    generation?: { name: string };
};

/** Cleaned species info displayed in the card's info panel. */
type SpeciesInfo = {
    genus: string;
    flavorText: string;
    habitat: string;
    captureRate: number;
    isLegendary: boolean;
    isMythical: boolean;
    generation: string;
};

/* ---------------------------------------------------------------------------
 * Constants
 * ------------------------------------------------------------------------- */
const API_BASE = "https://pokeapi.co/api/v2";
const VARIANT_ID_THRESHOLD = 10000;

const GENERATIONS = [
    { label: "All generations",           value: 0, min: 0,    max: 99999 },
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

const PAGE_SIZE = 60;

const spriteUrl = (id: number) =>
    `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;

/* ---------------------------------------------------------------------------
 * Helpers
 * ------------------------------------------------------------------------- */

/** "pikachu-rock-star" -> "Pikachu Rock Star"; "hp" -> "HP"; "phd" -> "PhD". */
function formatName(name: string): string {
    return name
        .split("-")
        .map((word) => {
            if (word === "hp") return "HP";
            if (word === "phd") return "PhD";
            return word.charAt(0).toUpperCase() + word.slice(1);
        })
        .join(" ");
}

/**
 * Link to the matching Pokemon Wiki article. Fandom auto-capitalizes the
 * first letter and follows redirects, so "pikachu" -> /wiki/Pikachu and
 * "mr-mime" -> /wiki/Mr-mime (redirects to "Mr. Mime"). Good enough for a
 * "read more" jump; structured info on the card comes from PokeAPI.
 */
function wikiUrl(name: string): string {
    const title = name
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join("-");
    return `https://pokemon.fandom.com/wiki/${encodeURIComponent(title)}`;
}

/** Fetch + clean the species data we show in the info panel. */
async function fetchSpeciesInfo(id: number): Promise<SpeciesInfo> {
    const res = await fetch(`${API_BASE}/pokemon-species/${id}`);
    if (!res.ok) throw new Error("Species endpoint failed");

    const json = (await res.json()) as SpeciesApiResponse;

    const englishGenus =
        json.genera?.find((g) => g.language.name === "en")?.genus ?? "";

    const englishFlavor =
        json.flavor_text_entries?.find((f) => f.language.name === "en")
            ?.flavor_text ?? "";

    // PokeAPI flavor text contains form feeds and newlines mid-sentence.
    const cleanedFlavor = englishFlavor
        .replace(/[\n\f\r]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    return {
        genus: englishGenus,
        flavorText: cleanedFlavor,
        habitat: json.habitat?.name ?? "unknown",
        captureRate: json.capture_rate ?? 0,
        isLegendary: Boolean(json.is_legendary),
        isMythical: Boolean(json.is_mythical),
        generation: json.generation?.name
            ? `Gen ${json.generation.name.replace("generation-", "").toUpperCase()}`
            : "Unknown",
    };
}

/**
 * Group base species and their variants.
 * (See the previous version's comment block for the full rationale.)
 */
function buildGroups(pokemon: PokemonRow[]): PokemonGroup[] {
    const bases = pokemon.filter((p) => p.id < VARIANT_ID_THRESHOLD);
    const variants = pokemon.filter((p) => p.id >= VARIANT_ID_THRESHOLD);

    const basesByLength = [...bases].sort((a, b) => b.name.length - a.name.length);

    const groups = new Map<string, PokemonGroup>();
    for (const base of bases) {
        groups.set(base.name, { base, variants: [] });
    }

    for (const variant of variants) {
        let matched: PokemonRow | null = null;
        for (const base of basesByLength) {
            if (variant.name.startsWith(base.name + "-")) {
                matched = base;
                break;
            }
        }

        if (matched) {
            groups.get(matched.name)!.variants.push(variant);
        } else {
            groups.set(variant.name, { base: variant, variants: [] });
        }
    }

    for (const group of groups.values()) {
        group.variants.sort((a, b) => a.id - b.id);
    }

    return Array.from(groups.values());
}

/* ===========================================================================
 * STYLED COMPONENTS
 * =========================================================================== */

const StyledPage = styled.main`
    min-height: 100vh;
    background: ${PAGE_BG};
    padding: 35px 16px;
`;

const StyledWrapper = styled.div`
    max-width: 960px;
    margin: 0 auto;
    background: #ffffff;
    border: 4px solid ${BRICK_RED};
    border-radius: 16px;
    box-shadow: 0 8px 0 ${DARK_BRICK_RED};
    overflow: hidden;
`;

const StyledTopBar = styled.div`
    height: 40px;
    background: ${BRICK_RED};
    border-bottom: 4px solid ${DARK_BRICK_RED};
`;

const StyledContent = styled.div`
    padding: 24px 28px 32px;
    font-family: system-ui, "Segoe UI", sans-serif;
`;

// Header container: full width so its children can stretch to the edges.
const PageHeader = styled.header`
    width: 100%;
    margin: 0 0 8px;

    @media (max-width: 900px) {
        text-align: center;
    }
`;

const PageTitle = styled.h1`
    margin: 0 0 8px;
    font-family: ${PIXEL};
    font-size: clamp(16px, 3.5vw, 22px);
    color: ${BRICK_RED};
`;

// FIX: removed `max-width: 60ch`. That cap was making the paragraph stop at
// ~60 characters and look like it was inside a narrow container. width:100%
// lets it fill the full content area, left wall to right wall.
const PageSubtitle = styled.p`
    margin: 0;
    width: 100%;
    line-height: 1.5;
    color: #444444;
`;

const SectionTitle = styled.h2`
    margin: 28px 0 14px;
    padding-bottom: 8px;
    font-family: ${PIXEL};
    font-size: 12px;
    color: ${BRICK_RED};
    border-bottom: 3px solid ${BRICK_RED};
`;

const Controls = styled.form`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 16px 20px;
    padding: 16px;
    background: #ffffff;
    border: 3px solid ${BRICK_RED};
    border-radius: 8px;
`;

const Field = styled.div`
    display: flex;
    flex-direction: column;
    gap: 6px;
`;

const FieldLabel = styled.label`
    font-family: ${PIXEL};
    font-size: 10px;
    letter-spacing: 0.5px;
    color: ${BRICK_RED};
`;

const TextInput = styled.input`
    padding: 8px 10px;
    font-size: 14px;
    font-family: inherit;
    color: #222222;
    background: #ffffff;
    border: 2px solid #dddddd;
    border-radius: 6px;
    outline: none;

    &:focus {
        border-color: ${BRICK_RED};
        box-shadow: 0 0 0 3px rgba(171, 52, 40, 0.15);
    }
`;

const Select = styled.select`
    padding: 8px 10px;
    font-size: 14px;
    font-family: inherit;
    color: #222222;
    background: #ffffff;
    border: 2px solid #dddddd;
    border-radius: 6px;
    outline: none;
    text-transform: capitalize;

    &:focus {
        border-color: ${BRICK_RED};
        box-shadow: 0 0 0 3px rgba(171, 52, 40, 0.15);
    }
`;

const ButtonRow = styled.div`
    display: flex;
    align-items: flex-end;
    gap: 8px;
`;

const PrimaryButton = styled.button`
    padding: 8px 14px;
    font-family: ${PIXEL};
    font-size: 10px;
    color: #ffffff;
    background: ${BRICK_RED};
    border: 2px solid ${DARK_BRICK_RED};
    border-radius: 6px;
    cursor: pointer;

    &:hover { background: ${DARK_BRICK_RED}; }
`;

const ResetButton = styled.button`
    padding: 8px 14px;
    font-family: ${PIXEL};
    font-size: 10px;
    color: ${BRICK_RED};
    background: #ffffff;
    border: 2px solid ${BRICK_RED};
    border-radius: 6px;
    cursor: pointer;

    &:hover { background: #fdf2f0; }
`;

const StatusText = styled.p`
    margin: 0 0 16px;
    color: #555555;
`;

const ErrorText = styled.p`
    margin: 0 0 16px;
    color: ${BRICK_RED};
    font-weight: 700;
`;

const ResultsGrid = styled.ul`
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 12px;
    align-items: start;
`;

const PokemonCard = styled.li<{ $isExpanded: boolean }>`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 12px 8px;
    background: #ffffff;
    border: 2px solid ${({ $isExpanded }) => ($isExpanded ? BRICK_RED : "#dddddd")};
    border-radius: 8px;
    box-shadow: ${({ $isExpanded }) =>
            $isExpanded ? `0 4px 0 ${DARK_BRICK_RED}` : "none"};
    transition: transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;

    &:hover {
        transform: translateY(-3px);
        border-color: ${BRICK_RED};
        box-shadow: 0 4px 0 ${DARK_BRICK_RED};
    }
`;

// The clickable "face" of the card. A real <button> so keyboard users can
// focus it with Tab and activate it with Enter/Space. Clicking here toggles
// the info panel.
const CardButton = styled.button`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    width: 100%;
    padding: 0;
    font: inherit;
    background: transparent;
    border: none;
    cursor: pointer;
`;

const Sprite = styled.img`
    width: 96px;
    height: 96px;
    max-width: 100%;
    image-rendering: pixelated;
`;

const PokemonName = styled.span`
    font-family: ${PIXEL};
    font-size: 11px;
    color: #222222;
    text-align: center;
    line-height: 1.4;
`;

const PokemonId = styled.span`
    font-family: ${PIXEL};
    font-size: 9px;
    color: ${BRICK_RED};
`;

// Variants chip — unchanged behavior; expands the variant panel.
const VariantToggle = styled.button`
    margin-top: 4px;
    padding: 4px 10px;
    font-family: ${PIXEL};
    font-size: 8px;
    color: ${BRICK_RED};
    background: #fdf2f0;
    border: 1px solid ${BRICK_RED};
    border-radius: 999px;
    cursor: pointer;

    &:hover {
        color: #ffffff;
        background: ${BRICK_RED};
    }
`;

// Info panel — appears below the card face when the card is clicked.
const InfoPanel = styled.div`
    width: 100%;
    margin-top: 8px;
    padding-top: 8px;
    border-top: 2px dashed ${BRICK_RED};
    text-align: left;
`;

const InfoPanelHeader = styled.p`
    margin: 0 0 8px;
    font-family: ${PIXEL};
    font-size: 9px;
    color: ${BRICK_RED};
    text-align: center;
    text-transform: uppercase;
`;

const InfoFlavor = styled.p`
    margin: 0 0 10px;
    font-size: 12px;
    line-height: 1.5;
    color: #333333;
`;

const InfoGrid = styled.dl`
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 4px 10px;
    margin: 0 0 10px;
    font-size: 11px;
`;

const InfoTerm = styled.dt`
    font-weight: 700;
    color: #555555;
`;

const InfoDesc = styled.dd`
    margin: 0;
    color: #222222;
    text-transform: capitalize;
`;

const WikiLink = styled.a`
    display: inline-block;
    font-family: ${PIXEL};
    font-size: 8px;
    color: ${BRICK_RED};
    text-decoration: none;
    border-bottom: 1px solid ${BRICK_RED};

    &:hover {
        color: ${DARK_BRICK_RED};
        border-color: ${DARK_BRICK_RED};
    }
`;

const PanelStatus = styled.p`
    margin: 0;
    font-size: 11px;
    color: #555555;
`;

const PanelError = styled.p`
    margin: 0;
    font-size: 11px;
    color: ${BRICK_RED};
    font-weight: 700;
`;

// Variant panel — unchanged from the previous version.
const VariantPanel = styled.div`
    width: 100%;
    margin-top: 8px;
    padding-top: 8px;
    border-top: 2px dashed ${BRICK_RED};
`;

const VariantPanelHeader = styled.p`
    margin: 0 0 8px;
    font-family: ${PIXEL};
    font-size: 9px;
    color: ${BRICK_RED};
    text-align: center;
    text-transform: uppercase;
`;

const VariantList = styled.ul`
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
    max-height: 260px;
    overflow-y: auto;
`;

const VariantItem = styled.li`
    display: grid;
    grid-template-columns: 32px 1fr auto;
    align-items: center;
    gap: 6px;
    padding: 4px 6px;
    background: #fafafa;
    border: 1px solid #e8e8e8;
    border-radius: 4px;
`;

const VariantSprite = styled.img`
    width: 32px;
    height: 32px;
    image-rendering: pixelated;
`;

const VariantName = styled.span`
    font-size: 11px;
    color: #222222;
`;

const VariantId = styled.span`
    font-family: ${PIXEL};
    font-size: 8px;
    color: ${BRICK_RED};
`;

const LoadMoreButton = styled.button`
    display: block;
    margin: 24px auto 0;
    padding: 10px 20px;
    font-family: ${PIXEL};
    font-size: 11px;
    color: #ffffff;
    background: ${BRICK_RED};
    border: 2px solid ${DARK_BRICK_RED};
    border-radius: 8px;
    cursor: pointer;

    &:hover { background: ${DARK_BRICK_RED}; }
`;

/* ===========================================================================
 * COMPONENT
 * =========================================================================== */
export default function SearchPage() {
    // Master data.
    const [allPokemon, setAllPokemon] = useState<PokemonRow[]>([]);
    const [typeOptions, setTypeOptions] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // User controls.
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedType, setSelectedType] = useState("all");
    const [selectedGen, setSelectedGen] = useState(0);
    const [sortOrder, setSortOrder] = useState<SortOrder>("id-asc");

    // Type filter.
    const [typeMemberNames, setTypeMemberNames] = useState<Set<string> | null>(null);
    const [isTypeLoading, setIsTypeLoading] = useState(false);

    // Pagination.
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

    // Expanded panels.
    const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());          // variants
    const [expandedInfoIds, setExpandedInfoIds] = useState<Set<number>>(new Set());  // species info

    // Species info: cache by base ID so re-opening is instant.
    const [infoCache, setInfoCache] = useState<Map<number, SpeciesInfo>>(new Map());
    const [loadingInfoId, setLoadingInfoId] = useState<number | null>(null);
    const [infoErrorId, setInfoErrorId] = useState<number | null>(null);

    // EFFECT 1: load every Pokemon name + every type name, once.
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

                const rows: PokemonRow[] = pokemonJson.results
                    .map((entry) => ({
                        id: Number(entry.url.split("/").filter(Boolean).pop()),
                        name: entry.name,
                    }))
                    .filter((row) => Number.isFinite(row.id))
                    .sort((a, b) => a.id - b.id);

                setAllPokemon(rows);

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
        return () => { cancelled = true; };
    }, []);

    // EFFECT 2: type filter fetch.
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
                setTypeMemberNames(null);

                const res = await fetch(`${API_BASE}/type/${selectedType}`);
                if (!res.ok) throw new Error("Type endpoint failed");

                const json: { pokemon: { pokemon: NamedResource }[] } = await res.json();
                if (cancelled) return;

                setTypeMemberNames(new Set(json.pokemon.map((p) => p.pokemon.name)));
            } catch {
                if (!cancelled) setTypeMemberNames(new Set());
            } finally {
                if (!cancelled) setIsTypeLoading(false);
            }
        }

        loadTypeMembers();
        return () => { cancelled = true; };
    }, [selectedType]);

    // EFFECT 3: reset pagination when filters change.
    useEffect(() => {
        setVisibleCount(PAGE_SIZE);
    }, [searchTerm, selectedType, selectedGen, sortOrder]);

    const allGroups = useMemo(() => buildGroups(allPokemon), [allPokemon]);

    // Filtered + sorted families.
    const filteredGroups = useMemo(() => {
        const gen = GENERATIONS.find((g) => g.value === selectedGen) ?? GENERATIONS[0];
        const term = searchTerm.trim().toLowerCase();

        let result = allGroups.filter(
            (group) => group.base.id >= gen.min && group.base.id <= gen.max
        );

        if (term) {
            result = result.filter((group) => {
                const baseMatches =
                    group.base.name.includes(term) || String(group.base.id) === term;
                const variantMatches = group.variants.some(
                    (v) => v.name.includes(term) || String(v.id) === term
                );
                return baseMatches || variantMatches;
            });
        }

        if (typeMemberNames) {
            result = result.filter(
                (group) =>
                    typeMemberNames.has(group.base.name) ||
                    group.variants.some((v) => typeMemberNames.has(v.name))
            );
        }

        const sorted = [...result];
        switch (sortOrder) {
            case "id-desc":   sorted.sort((a, b) => b.base.id - a.base.id); break;
            case "name-asc":  sorted.sort((a, b) => a.base.name.localeCompare(b.base.name)); break;
            case "name-desc": sorted.sort((a, b) => b.base.name.localeCompare(a.base.name)); break;
            default:          sorted.sort((a, b) => a.base.id - b.base.id);
        }
        return sorted;
    }, [allGroups, searchTerm, selectedGen, typeMemberNames, sortOrder]);

    const visibleGroups = filteredGroups.slice(0, visibleCount);

    // Toggle the variant panel (no network).
    function toggleExpanded(id: number) {
        setExpandedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }

    // Toggle the info panel. Fetches species data on first open, caches it.
    async function toggleInfo(id: number) {
        const isOpen = expandedInfoIds.has(id);

        setExpandedInfoIds((prev) => {
            const next = new Set(prev);
            if (isOpen) next.delete(id);
            else next.add(id);
            return next;
        });

        // Only fetch if we're opening and don't already have the data.
        if (isOpen || infoCache.has(id)) return;

        try {
            setLoadingInfoId(id);
            setInfoErrorId(null);
            const info = await fetchSpeciesInfo(id);
            setInfoCache((prev) => new Map(prev).set(id, info));
        } catch {
            setInfoErrorId(id);
        } finally {
            setLoadingInfoId(null);
        }
    }

    function handleReset() {
        setSearchTerm("");
        setSelectedType("all");
        setSelectedGen(0);
        setSortOrder("id-asc");
        setExpandedIds(new Set());
        setExpandedInfoIds(new Set());
    }

    return (
        <StyledPage>
            <StyledWrapper>
                <StyledTopBar />

                <StyledContent>
                    <PageHeader>
                        <PageTitle>Search Pokemon</PageTitle>
                        <PageSubtitle>
                            Look up any Pokemon by name or Pokedex number, then narrow the
                            list by type and generation. Pokemon with multiple forms
                            (costumes, caps, regional variants, etc.) are grouped under
                            their base species — click a card for a Pokedex entry, or the
                            variants chip to see every form.
                        </PageSubtitle>
                    </PageHeader>

                    <SectionTitle>Filters</SectionTitle>

                    <Controls onSubmit={(event) => event.preventDefault()}>
                        <Field>
                            <FieldLabel htmlFor="pokemon-search">NAME OR NUMBER</FieldLabel>
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
                            <FieldLabel htmlFor="type-filter">TYPE</FieldLabel>
                            <Select
                                id="type-filter"
                                value={selectedType}
                                onChange={(e) => setSelectedType(e.target.value)}
                            >
                                <option value="all">All types</option>
                                {typeOptions.map((typeName) => (
                                    <option key={typeName} value={typeName}>{typeName}</option>
                                ))}
                            </Select>
                        </Field>

                        <Field>
                            <FieldLabel htmlFor="gen-filter">GENERATION</FieldLabel>
                            <Select
                                id="gen-filter"
                                value={selectedGen}
                                onChange={(e) => setSelectedGen(Number(e.target.value))}
                            >
                                {GENERATIONS.map((gen) => (
                                    <option key={gen.value} value={gen.value}>{gen.label}</option>
                                ))}
                            </Select>
                        </Field>

                        <Field>
                            <FieldLabel htmlFor="sort-order">SORT BY</FieldLabel>
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
                                <PrimaryButton type="submit">SEARCH</PrimaryButton>
                                <ResetButton type="button" onClick={handleReset}>RESET</ResetButton>
                            </ButtonRow>
                        </Field>
                    </Controls>

                    <SectionTitle>Results</SectionTitle>

                    {isLoading && <StatusText>Loading Pokemon data...</StatusText>}
                    {errorMsg && <ErrorText>{errorMsg}</ErrorText>}

                    {!isLoading && !errorMsg && (
                        <StatusText>
                            Showing {visibleGroups.length} of {filteredGroups.length} Pokemon
                            {isTypeLoading ? " (loading type data...)" : ""}
                        </StatusText>
                    )}

                    {!isLoading && !errorMsg && filteredGroups.length === 0 && (
                        <StatusText>
                            No Pokemon matched those filters. Try a different name, type,
                            or generation.
                        </StatusText>
                    )}

                    {!isLoading && !errorMsg && filteredGroups.length > 0 && (
                        <>
                            <ResultsGrid>
                                {visibleGroups.map((group) => {
                                    const isInfoOpen = expandedInfoIds.has(group.base.id);
                                    const isVariantOpen = expandedIds.has(group.base.id);
                                    const hasVariants = group.variants.length > 0;
                                    const info = infoCache.get(group.base.id);
                                    const isLoadingInfo = loadingInfoId === group.base.id;
                                    const hasInfoError = infoErrorId === group.base.id;

                                    return (
                                        <PokemonCard
                                            key={group.base.id}
                                            $isExpanded={isInfoOpen || isVariantOpen}
                                        >
                                            {/* Clickable card face — toggles the species info panel. */}
                                            <CardButton
                                                type="button"
                                                onClick={() => toggleInfo(group.base.id)}
                                                aria-expanded={isInfoOpen}
                                                aria-controls={`info-${group.base.id}`}
                                            >
                                                <Sprite
                                                    src={spriteUrl(group.base.id)}
                                                    alt={`${group.base.name} sprite`}
                                                    loading="lazy"
                                                    width={96}
                                                    height={96}
                                                />
                                                <PokemonName>{formatName(group.base.name)}</PokemonName>
                                                <PokemonId>#{String(group.base.id).padStart(4, "0")}</PokemonId>
                                            </CardButton>

                                            {hasVariants && (
                                                <VariantToggle
                                                    type="button"
                                                    onClick={() => toggleExpanded(group.base.id)}
                                                    aria-expanded={isVariantOpen}
                                                    aria-controls={`variants-${group.base.id}`}
                                                >
                                                    {group.variants.length} variant
                                                    {group.variants.length !== 1 ? "s" : ""}{" "}
                                                    {isVariantOpen ? "▲" : "▼"}
                                                </VariantToggle>
                                            )}

                                            {/* Species info panel */}
                                            {isInfoOpen && (
                                                <InfoPanel id={`info-${group.base.id}`}>
                                                    <InfoPanelHeader>Pokedex Entry</InfoPanelHeader>

                                                    {isLoadingInfo && (
                                                        <PanelStatus>Loading entry...</PanelStatus>
                                                    )}
                                                    {hasInfoError && (
                                                        <PanelError>Could not load entry.</PanelError>
                                                    )}

                                                    {info && (
                                                        <>
                                                            <InfoFlavor>
                                                                {info.flavorText || "No Pokedex entry available."}
                                                            </InfoFlavor>
                                                            <InfoGrid>
                                                                <InfoTerm>Genus</InfoTerm>
                                                                <InfoDesc>{info.genus || "Unknown"}</InfoDesc>
                                                                <InfoTerm>Habitat</InfoTerm>
                                                                <InfoDesc>{info.habitat}</InfoDesc>
                                                                <InfoTerm>Capture rate</InfoTerm>
                                                                <InfoDesc>{info.captureRate} / 255</InfoDesc>
                                                                <InfoTerm>Introduced</InfoTerm>
                                                                <InfoDesc>{info.generation}</InfoDesc>
                                                                {(info.isLegendary || info.isMythical) && (
                                                                    <>
                                                                        <InfoTerm>Status</InfoTerm>
                                                                        <InfoDesc>
                                                                            {info.isLegendary ? "Legendary" : "Mythical"}
                                                                        </InfoDesc>
                                                                    </>
                                                                )}
                                                            </InfoGrid>
                                                            <WikiLink
                                                                href={wikiUrl(group.base.name)}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                            >
                                                                Read more on Pokemon Wiki →
                                                            </WikiLink>
                                                        </>
                                                    )}
                                                </InfoPanel>
                                            )}

                                            {/* Variant panel (unchanged) */}
                                            {hasVariants && isVariantOpen && (
                                                <VariantPanel id={`variants-${group.base.id}`}>
                                                    <VariantPanelHeader>
                                                        Variant {formatName(group.base.name)}
                                                    </VariantPanelHeader>
                                                    <VariantList>
                                                        {group.variants.map((v) => (
                                                            <VariantItem key={v.id}>
                                                                <VariantSprite
                                                                    src={spriteUrl(v.id)}
                                                                    alt={`${v.name} sprite`}
                                                                    loading="lazy"
                                                                />
                                                                <VariantName>{formatName(v.name)}</VariantName>
                                                                <VariantId>#{String(v.id).padStart(4, "0")}</VariantId>
                                                            </VariantItem>
                                                        ))}
                                                    </VariantList>
                                                </VariantPanel>
                                            )}
                                        </PokemonCard>
                                    );
                                })}
                            </ResultsGrid>

                            {visibleCount < filteredGroups.length && (
                                <LoadMoreButton
                                    type="button"
                                    onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
                                >
                                    LOAD MORE
                                </LoadMoreButton>
                            )}
                        </>
                    )}
                </StyledContent>
            </StyledWrapper>
        </StyledPage>
    );
}