/*
  DetailPage.tsx
  Owner: Sydney Stokes
  Purpose: Shows one Pokemon's artwork, types, base stats, abilities,
  and size. Receives data from app/pokemon/[name]/page.tsx.
  test: visit `http://localhost:3000/pokemon?name=pikachu`
*/
"use client";

import styled from "styled-components";
import type { PokemonDetailProps } from "@/types/pokemon";

const StyledWrapper = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
`;

const StyledTypeBadge = styled.span`
  padding: 0.25rem 0.75rem;
  margin-right: 0.5rem;
  border-radius: 999px;
  background: #ddd;
  text-transform: capitalize;
`;

const StyledStatRow = styled.div`
  display: grid;
  grid-template-columns: 140px 40px 1fr;
  align-items: center;
  gap: 0.5rem;
`;

// the $ prefix keeps "width" from being passed to the HTML element
const StyledStatBar = styled.div<{ $width: number }>`
  height: 10px;
  width: ${(props) => props.$width}%;
  background: #4a90e2;
  border-radius: 5px;
`;

export default function DetailPage({ pokemon }: PokemonDetailProps) {
  const artwork = pokemon.sprites.other["official-artwork"].front_default;

  // PokeAPI uses decimeters and hectograms, so divide by 10 for m and kg
  const heightM = pokemon.height / 10;
  const weightKg = pokemon.weight / 10;

  return (
    <StyledWrapper>
      <h1>
        #{pokemon.id} {pokemon.name}
      </h1>

      {artwork ? <img src={artwork} alt={pokemon.name} width={300} /> : null}

      <div>
        {pokemon.types.map((t) => (
          <StyledTypeBadge key={t.type.name}>{t.type.name}</StyledTypeBadge>
        ))}
      </div>

      <h2>Base Stats</h2>
      {pokemon.stats.map((s) => (
        <StyledStatRow key={s.stat.name}>
          <span>{s.stat.name}</span>
          <span>{s.base_stat}</span>
          {/* 255 is the highest possible base stat */}
          <StyledStatBar $width={(s.base_stat / 255) * 100} />
        </StyledStatRow>
      ))}

      <h2>Abilities</h2>
      <ul>
        {pokemon.abilities.map((a) => (
          <li key={a.ability.name}>{a.ability.name}</li>
        ))}
      </ul>

      <p>
        Height: {heightM} m | Weight: {weightKg} kg
      </p>
    </StyledWrapper>
  );
}