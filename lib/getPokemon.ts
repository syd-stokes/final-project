/**
 * ============================================================================
 * File:        lib/getPokemon.ts
 * Purpose:     Shared data-fetching functions for PokeAPI. Keeps all API calls
 *              for the detail page in one place so components stay focused on
 *              displaying data.
 *
 * Exports:
 *   getPokemonSSR(name)       - gets one Pokemon by name or ID. If the name
 *                               only exists as a species (e.g. "deoxys"),
 *                               loads its default form instead. Returns null
 *                               if no Pokemon is found.
 *   getSpeciesInfoSSR(pokemon) - gets the official English name, newest
 *                               Pokedex description, and category for a
 *                               Pokemon (e.g. "Mr. Mime", "Mouse Pokemon").
 *
 * Used by:     app/pokemon/page.tsx (Pokemon detail route)
 *
 * Why "SSR":
 *   These functions run on the server when the page is requested, and use
 *   cache: "no-store" so every request fetches fresh data (server-side
 *   rendering, as per Lecture 13).
 *
 * External API: https://pokeapi.co/api/v2  (no key required)
 * Sources:      https://pokeapi.co/docs/v2#pokemon
 *               https://pokeapi.co/docs/v2#pokemon-species
 * ============================================================================
 */

import type { Pokemon } from "@/types/pokemon";

const API_URL = "https://pokeapi.co/api/v2";

// function structure comes from Lecture 13, slide 5, as well as the example repo
// (https://github.com/tazmanianDeviloper/csr-ssr-ssg-isr-app/blob/main/lib/getCharacters.ts)
// (but returns null on a 404 so we can try a fallback):
async function fetchJson(url: string) {
  const res = await fetch(url, { cache: "no-store" });

  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`PokeAPI request failed (${res.status})`);
  return res.json();
}

// function to get a pokemon by its name:
export async function getPokemonSSR(name: string): Promise<Pokemon | null> {
  const key = name.toLowerCase().trim();   

  // try the name directly:
  const pokemon = await fetchJson(`${API_URL}/pokemon/${key}`);
  if (pokemon) return pokemon;

  // some Pokemon only exist as forms (e.g. "deoxys" is really "deoxys-normal"),
  // so look up the species and load its default form instead
  const species = await fetchJson(`${API_URL}/pokemon-species/${key}`);
  if (!species) return null;    // species not found

  // find the default form:
  const defaultVariety = species.varieties.find((v: { is_default: boolean }) => v.is_default);
  if (!defaultVariety) return null;   // no default form found

  // return the default form:
  return fetchJson(defaultVariety.pokemon.url);
}

// helper function that returns true if a PokeAPI 
// entry is in English (used with .find and .findLast):
const isEnglish = (entry: { language: { name: string } }) => entry.language.name === "en";

// function to get the official English name (ex. for displaying "Mr. Mime" 
// instead of "mr-mime"), Pokedex description, and category for the DetailPage:
export async function getSpeciesInfoSSR(pokemon: Pokemon): Promise<{ displayName: string; description: string; category: string }> {
  const species = await fetchJson(pokemon.species.url);
  if (!species) {
    return { displayName: pokemon.name, description: "", category: "" };   // species not found
  }

  // species.names has the name in every language, so find the English one:
  const englishEntry = species.names.find(isEnglish);

  // use the official English name if found, 
  // o/w use the API name (e.g. "mr-mime")
  let speciesName = pokemon.name;
  if (englishEntry) {
    speciesName = englishEntry.name;
  }

  let displayName = speciesName;

  // if pokemon is an alternate form, add their form name if PokeAPI has one:
  if (!pokemon.is_default) {
    const form = await fetchJson(pokemon.forms[0].url);

    // if form data found:
    if (form) {
      // form_names works the same way as species names:
      const englishForm = form.form_names.find(isEnglish);

      if (englishForm) {
        // some form names already include the species name (like "Pikachu Rock Star"),
        // so show those on their own instead of repeating it (like "Pikachu (Pikachu Rock Star)")
        if (englishForm.name.includes(speciesName)) {
          displayName = englishForm.name;
        } else {
          displayName = `${speciesName} (${englishForm.name})`;
        }
      }
    }
  }

  // pokedex description: pick the newest English entry
  // (PokeAPI calls these "flavor_text_entries"):
  const englishPokedexEntry = species.flavor_text_entries.findLast(isEnglish);

  // raw text contains line-break and page-break chars from
  // original games, so replace them with spaces (source:
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_expressions/Character_classes):
  let description = "";
  if (englishPokedexEntry) {
    description = englishPokedexEntry.flavor_text.replace(/[\n\f]/g, " ");
  }

  // pokemon's category title (ie. "Mouse Pokemon" or "Lizard Pokemon")
  // (PokeAPI calls these "genera"; each entry's text is in "genus"):
  const englishCategory = species.genera.find(isEnglish);

  let category = "";
  if (englishCategory) {
    category = englishCategory.genus;
  }

  // return all info for DetailPage:
  return { displayName, description, category };
}