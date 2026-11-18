/**
 * ============================================================================
 * File:        types/pokemon.ts
 * Purpose:     Shared TypeScript types for Pokemon data. Describes the parts
 *              of the PokeAPI /pokemon/{name} response that the project uses,
 *              plus the props passed from app/pokemon/page.tsx to the
 *              DetailPage component.
 *
 * External API: https://pokeapi.co/api/v2  (no key required, CORS-enabled)
 * Source: https://pokeapi.co/docs/v2#pokemon
 * ============================================================================
 */

// pokemon data returned by `/pokemon/{name}`
export type Pokemon = {
    id: number;                 // pokedex number for regular Pokemon; internal ID for alternate forms
    name: string;
    height: number;             // in decimeters (divide by 10 for meters)
    weight: number;             // in hectograms (divide by 10 for kilograms)
    types: { type: { name: string } }[];   // list 1 or 2 types, e.g. "fire", "flying"
    stats: { base_stat: number; stat: { name: string } }[];          // base stats (hp, attack, defense, etc.) vals from 1 to 255
    abilities: { ability: { name: string } }[];   // list of pokemon's abilities
    is_default: boolean;          // false for alternate forms (megas, regional forms, etc.)
    species: { url: string };     // link to species data (English name, description, category)
    forms: { url: string }[];     // link to form data (form name like "Attack Forme" or "Galarian")
    sprites: {
        front_default: string | null;     // small pixel sprite, or null if none
        other: {
            "official-artwork": { front_default: string | null };   // large artwork, or null if none
        };
    };
};

// passed from pokemon page to DetailPage component:
export type PokemonDetailProps = {
    pokemon: Pokemon;       // detailed Pokemon data
    displayName: string;   // official English name, e.g. "Mr. Mime" instead of "mr-mime"
    description: string;   // pokedex entry text or "" if none
    category: string;         // category title, e.g. "Mouse Pokemon", or "" if none
};