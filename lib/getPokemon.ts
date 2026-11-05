import type { Pokemon } from "@/types/pokemon";

const API_URL = "https://pokeapi.co/api/v2";

// function structure comes from Lecture 13, slide 5, as well as the example repo
// (https://github.com/tazmanianDeviloper/csr-ssr-ssg-isr-app/blob/main/lib/getCharacters.ts):
async function fetchJson(url: string) {
  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) throw new Error(`PokeAPI request failed (${res.status})`);
  return res.json();
}

export async function getPokemonSSR(name: string): Promise<Pokemon> {
  return fetchJson(`${API_URL}/pokemon/${name.toLowerCase()}`);
}