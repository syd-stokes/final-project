/**
 * ============================================================================
 * File:        components/DetailPage.tsx
 * Created By:  Sydney Stokes
 * Component:   DetailPage
 * Purpose:     Shows one Pokemon's number, name, category, artwork,
 *              description, types, base stats, abilities, and size,
 *              styled like a Pokedex. Receives data from app/pokemon/page.tsx.
 *              Test: visit http://localhost:3000/pokemon?name=pikachu
 *              All data comes from the public PokeAPI.
 *
 * External API: https://pokeapi.co/api/v2  (no key required, CORS-enabled)
 * Dependencies: react, styled-components (CSS-in-JS, per project rules),
 *               next/font (Press Start 2P pixel font from Google Fonts)
 * 
 * Styling/Design Inspiration: https://www.pinterest.com/pin/pokedex-template--629237379223809944/,
 *                             https://dev.to/oryam/css-pokedex-3iln,
 *                             https://www.behance.net/gallery/146710797/Pokedex-Ui-Study?tracking_source=search_projects|pokemon+ui+pokedex&l=1
 *
 * Why "use client":  
 *   Slide 3 in Lecture 13 (10/27) gives us that: "the `use client` 
 *   directive must also be added when a React Hook is used in a component."
 *   So, we need it here to use styled-components.
 * ============================================================================
 */

"use client";

import styled from "styled-components";
import { Press_Start_2P } from "next/font/google";
import type { PokemonDetailProps } from "@/types/pokemon";

// blocky/pixelated font for headings and labels (meant to resemble
// old pokemon games) (sources: https://nextjs.org/docs/app/getting-started/fonts,
// https://fonts.google.com/specimen/Press+Start+2P):
const pixelFont = Press_Start_2P({ weight: "400", subsets: ["latin"] });
const PIXEL = pixelFont.style.fontFamily;

// color palette constants:
const BRICK_RED = "#ab3428";        // main brick red (agreed upon accent color for cohesive page styling throughout project)
const DARK_BRICK_RED = "#73231c";   // darker red for borders and shadows

// light blue background that fills whole screen:
const StyledPage = styled.main`
  min-height: 100vh;
  background: #cbedef;
  padding: 35px 16px;
`;

// "Pokedex" box: white box w/ a brick red frame:
const StyledWrapper = styled.div`
  max-width: 800px;
  margin: 0 auto;
  background: #ffffff;
  border: 4px solid ${BRICK_RED};
  border-radius: 16px;
  box-shadow: 0 8px 0 ${DARK_BRICK_RED};
  overflow: hidden;
`;

// thicker red bar across top of the box to mimic a Pokedex
// (https://www.pinterest.com/pin/pokedex-template--629237379223809944/):
const StyledTopBar = styled.div`
  height: 40px;
  background: ${BRICK_RED};
  border-bottom: 4px solid ${DARK_BRICK_RED};
`;

// all content below the thick top bar (text font from 
// https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/font-family):
const StyledContent = styled.div`
  padding: 24px 28px 32px;
  font-family: system-ui, "Segoe UI", sans-serif;
`;

// Pokedex number:
const StyledNumber = styled.p`
  margin: 0 0 8px;
  font-family: ${PIXEL};
  font-size: 14px;
  color: ${BRICK_RED};
`;

// Pokemon name:
const StyledName = styled.h1`
  margin: 0 0 8px;
  font-family: ${PIXEL};
  font-size: 24px;
  padding: 5px 0px;
`;

// category title under the name, e.g. "Mouse Pokemon"
const StyledCategory = styled.p`
  margin: 0;
  color: #777777;
  font-style: italic;
`;

// Pokedex inner "screen" with the Pokemon's image (light green
// color to mimic a Pokedex --> https://dev.to/oryam/css-pokedex-3iln):
const StyledScreen = styled.div`
  display: flex;
  justify-content: center;
  margin: 20px 0;
  padding: 16px;
  background: #e2f0dd;
  border: 3px solid #000000;
  border-radius: 8px;
`;

// Pokemon image:
const StyledImage = styled.img`
  width: 260px;
  max-width: 100%;
  height: auto;
`;

// Pokedex entry text
const StyledDescription = styled.p`
  line-height: 1.6;
`;

// row that holds the Pokemon's type(s):
const StyledTypesRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 20px 0 8px;
`;

// single type bubble (source used: https://www.w3schools.com/cssref/pr_text_text-transform.php):
const StyledSingleType = styled.span`
  padding: 8px 12px;
  font-family: ${PIXEL};
  font-size: 10px;
  text-transform: uppercase;
  color: ${BRICK_RED};
  background: #ffffff;
  border: 2px solid ${BRICK_RED};
  border-radius: 999px;
`;

// Pokedex section headings (ie. "Base Stats", "Abilities", "Size"):
const StyledSectionTitle = styled.h2`
  margin: 28px 0 14px;
  padding-bottom: 8px;
  font-family: ${PIXEL};
  font-size: 14px;
  color: ${BRICK_RED};
  border-bottom: 3px solid ${BRICK_RED};
`;

// each base stat row: stat label (150 px) | number (40 px) | percentage bar (remaining width)
// (sources for styling the grid: https://www.geeksforgeeks.org/css/css-grid-layout-the-fr-unit/,
// https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/grid-template-columns)
const StyledStatRow = styled.div`
  display: grid;
  grid-template-columns: 150px 40px 1fr;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
`;

// empty gray bar behind each red stat bar, 
// so you can see how full it is:
const StyledEmptyBar = styled.div`
  height: 12px;
  background: #ece8e4;
  border-radius: 6px;
  overflow: hidden;
`;

// 255 is the highest possible base stat, so the
// length of the bar is the stat as a percentage of 255
// (source for prop function syntax: https://styled-components.com/docs/basics#adapting-based-on-props)
const StyledStatBar = styled.div<{ $stat: number }>`
  height: 100%;
  width: ${
    ({ $stat }) => ($stat / 255) * 100
  }%;
  background: ${BRICK_RED};
`;

// list that holds the pokemon's abilities 
// (side by side in a horizontal row):
const StyledAbilitiesList = styled.ul`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
`;

// each ability displayed as a box:
const StyledSingleAbility = styled.li`
  padding: 6px 10px;
  border: 2px solid #dddddd;
  border-radius: 6px;
`;

// Pokemon's height and weight:
const StyledSize = styled.div`
  display: flex;
  gap: 24px;
  font-family: ${PIXEL};
  font-size: 11px;
`;

// helper function turns API names into display names (e.g. "lightning-rod" -> "Lightning Rod"):
function formatName(name: string): string {
  // "hp" is a special case that should be in all-caps:
  if (name === "hp")
    return "HP";  

  // else, split each at the hyphens, capitalize the new words, and join them with spaces:
  return name
    .split("-")                                                    // "lightning-rod" -> ["lightning", "rod"]
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))   // ["lightning", "rod"] -> ["Lightning", "Rod"]
    .join(" ");                                                    // ["Lightning", "Rod"] -> "Lightning Rod"
}

export default function DetailPage({ pokemon, displayName, description, category }: PokemonDetailProps) {
  // get the artwork URL:
  const artwork = pokemon.sprites.other["official-artwork"].front_default;

  // PokeAPI uses decimeters and hectograms, so divide by 10 for m and kg
  const heightM = pokemon.height / 10;
  const weightKg = pokemon.weight / 10;

  return (
    <StyledPage>
      <StyledWrapper>
        {/* red top bar (decoration only): */}
        <StyledTopBar/>

        <StyledContent>

          {/* Pokedex number (padded to 4 digits (e.g. 25 -> #0025) for consistency), name, and category if there is one
          (padStart source: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/padStart) */}
          <StyledNumber>#{String(pokemon.id).padStart(4, "0")}</StyledNumber>
          <StyledName>{displayName}</StyledName>
          {category ? <StyledCategory>{category}</StyledCategory> : null}

          {/* show the pokemon's artwork in the pokedex "screen" if there is one: */}
          {artwork ? (
            <StyledScreen>
              <StyledImage src={artwork} alt={displayName}/>
            </StyledScreen>
          ) : null}

          {/* show pokemon's description if PokeAPI has one: */}
          {description ? <StyledDescription>{description}</StyledDescription> : null}

          {/* map over all of the Pokemon's types and display them */}
          <StyledTypesRow>
            {pokemon.types.map((t) => (
              <StyledSingleType key={t.type.name}>{formatName(t.type.name)}</StyledSingleType>
            ))}
          </StyledTypesRow>

          {/* display the pokemon's stats: */}
          <StyledSectionTitle>Base Stats</StyledSectionTitle>
          {/* map over all of the Pokemon's stats and display them: */}
          {pokemon.stats.map((s) => (
            <StyledStatRow key={s.stat.name}>
              {/* each stat row is 3 columns side by side: label, number, bar 
              (source: https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/span) */}
              <span>{formatName(s.stat.name)}</span>
              <span>{s.base_stat}</span>

              <StyledEmptyBar>
                <StyledStatBar $stat={s.base_stat}/>
              </StyledEmptyBar>

            </StyledStatRow>
          ))}

          {/* display the pokemon's abilities: */}
          <StyledSectionTitle>Abilities</StyledSectionTitle>
          <StyledAbilitiesList>
            {/* map over all of the Pokemon's abilities and display them: */}
            {pokemon.abilities.map((a) => (
              <StyledSingleAbility key={a.ability.name}>{formatName(a.ability.name)}</StyledSingleAbility>
            ))}
          </StyledAbilitiesList>

          {/* display the pokemon's size (height/weight): */}
          <StyledSectionTitle>Size</StyledSectionTitle>
          <StyledSize>
            <span>HT {heightM} m</span>
            <span>WT {weightKg} kg</span>
          </StyledSize>

        </StyledContent>
      </StyledWrapper>
    </StyledPage>
  );
}