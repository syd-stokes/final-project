// source: https://pokeapi.co/docs/v2#pokemon

// pokemon data returned by `/pokemon/{name}`
// can add more fields if there are more we want to use!
export type Pokemon = {
    id: number;                 // pokedex number
    name: string;
    height: number;             // in decimeters (divide by 10 for meters)
    weight: number;             // in hectograms (divide by 10 for kilograms)
    types: { type: { name: string } }[];   // list 1 or 2 types, e.g. "fire", "flying"
    stats: { base_stat: number; stat: { name: string } }[];          // base stats (hp, attack, defense, etc.) valus from 1 to 255
    abilities: { ability: { name: string } }[];   // list of pokemon's abilities
    sprites: {
        front_default: string | null;     // small pixel sprite, or null if none
        other: {
            "official-artwork": { front_default: string | null };   // large artwork, or null if none
        };
    };
};

// passed from pokemon page to DetailPage component:
export type PokemonDetailProps = {
    pokemon: Pokemon;
};