/*
  app/pokemon/page.tsx
  Owner: Sydney Stokes

  Route: /pokemon?name={pokemonName}
  Example: /pokemon?name=pikachu

  Plan:
  - Read the Pokemon name from the URL query string (searchParams).
  - Fetch that Pokemon from PokeAPI using getPokemonSSR in lib/getPokemon.ts.
  - Show the 404 page if the name is missing or not a real Pokemon.
  - Pass the data to the DetailPage component (components/DetailPage.tsx),
    which displays artwork, types, base stats, abilities, height and weight.
  - Wrapped in <Suspense> so a loading message shows while data is fetched.

  Teammates: link to a Pokemon's detail page with /pokemon?name={name}
*/

export default function PokemonRoute() {
  return <p>Pokemon detail page coming soon.</p>;
}