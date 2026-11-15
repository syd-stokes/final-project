import type { Pokemon } from "@/types/pokemon";

const API_URL = "https://pokeapi.co/api/v2";

// function structure comes from Lecture 13, slide 5, as well as the example repo
// (https://github.com/tazmanianDeviloper/csr-ssr-ssg-isr-app/blob/main/lib/getCharacters.ts):
async function fetchJson(url: string) {
  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) throw new Error(`PokeAPI request failed (${res.status})`);
  return res.json();
}

// same as fetchJson, but returns null on a 404 so we can try a fallback:
async function tryFetchJson(url: string) {
  const res = await fetch(url, { cache: "no-store" });

  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`PokeAPI request failed (${res.status})`);
  return res.json();
}

export async function getPokemonSSR(name: string): Promise<Pokemon | null> {
  const key = name.toLowerCase().trim();   

  // try the name directly:
  const pokemon = await tryFetchJson(`${API_URL}/pokemon/${key}`);
  if (pokemon) return pokemon;

  // some Pokemon only exist as forms (e.g. "deoxys" is really "deoxys-normal"),
  // so look up the species and load its default form instead
  const species = await tryFetchJson(`${API_URL}/pokemon-species/${key}`);
  if (!species) return null;    // species not found

  // find the default form:
  const defaultVariety = species.varieties.find(
    (v: { is_default: boolean }) => v.is_default
  );
  if (!defaultVariety) return null;   // no default form found

  // return the default form:
  return fetchJson(defaultVariety.pokemon.url);
}

// builds the official English name for the DetailPage 
// (ex. for displaying "Mr. Mime" instead of "mr-mime"):
export async function getDisplayNameSSR(pokemon: Pokemon): Promise<string> {
  const species = await fetchJson(pokemon.species.url);

  // species.names has the name in every language, so find the English one
  const englishEntry = species.names.find((entry: { name: string; language: { name: string } }) => entry.language.name === "en");

  // use the official English name if found, 
  // o/w use the API name (e.g. "mr-mime")
  let speciesName = pokemon.name;
  if (englishEntry) {
    speciesName = englishEntry.name;
  }

  // regular Pokemon just use the species name
  if (pokemon.is_default) return speciesName;

  // alternate forms add their form name in parentheses, if PokeAPI has one
  const form = await fetchJson(pokemon.forms[0].url);
  
  // form_names works the same way as species names
  const englishForm = form.form_names.find((entry: { name: string; language: { name: string } }) => entry.language.name === "en");

  if (englishForm) {
    // some form names already include the species name (like "Pikachu Rock Star"),
    // so show those on their own instead of repeating it (like "Pikachu (Pikachu Rock Star)")
    if (englishForm.name.includes(speciesName)) {
      return englishForm.name;
    }
    
    return `${speciesName} (${englishForm.name})`;
  }

  return speciesName;
}