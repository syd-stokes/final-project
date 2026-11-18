/**
 * ============================================================================
 * File:        components/DetailPage.tsx
 * Created By:  Sydney Stokes
 * Component:   DetailPage
 * Purpose:     Shows one Pokemon's artwork, types, base stats, abilities,
 *              and size. Receives data from app/pokemon/[name]/page.tsx.
 *              test: visit `http://localhost:3000/pokemon?name=pikachu`. 
 *              All data comes from the public PokeAPI.
 *
 * External API: https://pokeapi.co/api/v2  (no key required, CORS-enabled)
 * Dependencies: react, styled-components (CSS-in-JS, per project rules)
 *
 * Why "use client":
 *   Slide 3 in Lecture 13 (10/27) gives us that: "the `use client` 
 *   directive must also be added when a React Hook is used in a component."
 *   So, we need it here to use styled-components.
 * ============================================================================
 */

"use client";

import styled from "styled-components";
import type { PokemonDetailProps } from "@/types/pokemon";

const StyledWrapper = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 32px;
`;

// category title under the name, e.g. "Mouse Pokemon"
const StyledCategory = styled.p`
  margin-top: 0;
  color: #666;
  font-style: italic;
`;

// pokedex entry text
const StyledDescription = styled.p`
  max-width: 50%;
  line-height: 1.5;
`;

const StyledArtwork = styled.img`
  width: 300px;
  max-width: 100%;
  height: auto;
  margin-bottom: 30px;
`;

const StyledTypeBubble = styled.span`
  padding: 4px 12px;
  margin-right: 8px;
  border-radius: 999px;
  background: #ddd;
`;

// sources for styling the grid: https://www.geeksforgeeks.org/css/css-grid-layout-the-fr-unit/#google_vignette,
// https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/grid-template-columns
const StyledStatRow = styled.div`
  display: grid;
  grid-template-columns: 140px 40px 1fr;
  align-items: center;
  gap: 5px;
`;

// 255 is the highest possible base stat, so the 
// length of the bar is the stat as a percentage of 255
// (takes the base stat as input and divides it by 255)
const StyledStatBar = styled.div<{ $stat: number }>`
  height: 10px;
  width: ${({ $stat }) => ($stat / 255) * 100}%;
  background: #428fe6ff;
  border-radius: 5px;
`;    // source for prop function syntax: https://styled-components.com/docs/basics#adapting-based-on-props

// turns API names into display names 
// (ie. "lightning-rod" -> "Lightning Rod"):
function formatName(name: string): string {
  if (name === "hp") return "HP";

  return name
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function DetailPage({ pokemon, displayName, description, category }: PokemonDetailProps) {
  // get the artwork URL:
  const artwork = pokemon.sprites.other["official-artwork"].front_default;

  // PokeAPI uses decimeters and hectograms, so divide by 10 for m and kg
  const heightM = pokemon.height / 10;
  const weightKg = pokemon.weight / 10;

  return (
    <StyledWrapper>
      <h1>
        #{String(pokemon.id).padStart(4, "0")} {displayName}    {/* display the pokemon's number and name */}
      </h1>

      {/* only show the category and description if PokeAPI has them */}
      {category ? <StyledCategory>{category}</StyledCategory> : null}
      {description ? <StyledDescription>{description}</StyledDescription> : null}

      {/* show the artwork if PokeAPI has an image for this Pokemon: */}
      {artwork ? <StyledArtwork src={artwork} alt={displayName} /> : null}

      <div>
        {/* map over all of the Pokemon's types and display them */}
        {pokemon.types.map((t) => (
          <StyledTypeBubble key={t.type.name}>{formatName(t.type.name)}</StyledTypeBubble>
        ))}
      </div>

      <h2>Base Stats</h2>
      {pokemon.stats.map((s) => (
        <StyledStatRow key={s.stat.name}>
          {/* each stat row is 3-cols side by side: label, number, bar */}
          <span>{formatName(s.stat.name)}</span>
          <span>{s.base_stat}</span> 
          <StyledStatBar $stat={s.base_stat} /> 
        </StyledStatRow>
      ))}

      <h2>Abilities</h2>
      <ul>
        {/* map over all of the Pokemon's abilities and display them */}
        {pokemon.abilities.map((a) => (
          <li key={a.ability.name}>{formatName(a.ability.name)}</li>
        ))}
      </ul>

      <p>
        Height: {heightM} m | Weight: {weightKg} kg
      </p>
    </StyledWrapper>
  );
}