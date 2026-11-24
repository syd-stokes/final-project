/**
 * ============================================================================
 * File:        app/pokemon/page.tsx
 * Created By:  Sydney Stokes
 *
 * Route:       /pokemon?name={pokemonName}
 * Example:     /pokemon?name=pikachu
 *
 * Purpose:     - Read the Pokemon name from the URL query string (searchParams).
 *              - Fetch that Pokemon from PokeAPI using getPokemonSSR in lib/getPokemon.ts.
 *              - Show the 404 page if the name is missing or not a real Pokemon.
 *                (source: https://nextjs.org/docs/app/api-reference/functions/not-found)
 *              - Pass data to the DetailPage component (components/DetailPage.tsx),
 *                which displays artwork, types, base stats, abilities, height and weight.
 *              - The loading message is handled by app/pokemon/loading.tsx.
 *
 * Teammates:   link to a Pokemon's detail page with /pokemon?name={name}
 * ============================================================================
 */

import { notFound } from "next/navigation";
import { getPokemonSSR, getSpeciesInfoSSR } from "@/lib/getPokemon";
import DetailPage from "@/components/DetailPage";

// props for the pokemon content:
type Props = {
  searchParams: Promise<{ name?: string }>;
};

// reads the URL, fetches the data, and passes it to the DetailPage:
export default async function PokemonContent({ searchParams }: Props) {
  // get Pokemon name from the query string:
  const { name } = await searchParams;
  if (!name) notFound();    // if no name is found, show 404

  // fetch the Pokemon data
  const pokemon = await getPokemonSSR(name).catch(() => null);
  if (!pokemon) notFound();   // if Pokemon is not found, show 404

  // if the species lookup fails, fall back to the API name so the page still loads
  const info = await getSpeciesInfoSSR(pokemon).catch(() => ({
    displayName: pokemon.name,
    description: "",
    category: "",
  }));

  // return the DetailPage component with the fetched data:
  return <DetailPage pokemon={pokemon} displayName={info.displayName} description={info.description} category={info.category}/>
}