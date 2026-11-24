import type { Pokemon } from "@/types/pokemon";

const API_URL = "https://pokeapi.co/api/v2/";

// type for storing different features of Pokemon and their endpoints
export type PokeField = {
    name: string;
    url: string;
};

// type for fetching Pokemon by specific feature
// example: if name: limber for ability, pokemon == an array of all Pokemon with the limber ability
export type PokeGroup = {
    name: string;
    pokemon: Pokemon[];
};


// type for outlining categories by name/URL arg, label to be rendered in nav bar, and list of current featured items
export type Category = {
    name: string;
    label: string;
    featuredCtgs: string[];
}

// sample categories to filter featured Pokemon by (can add more and expand!)
export const categoryList: Category[] = [
    {
        name: "ability",
        label: "Ability",
        featuredCtgs: ["stench", "immunity", "levitate"]
    },

    {
        name: "type",
        label: "Type",
        featuredCtgs: ["fire", "water", "electric"]
    }

];

// fetches
export async function fetchFeaturedCategories(category: Category) {
    const results = await Promise.all(
        category.featuredCtgs.map(async (n) => fetchOption(category.name, n))
    );
    return results
}

async function fetchOption(categoryName: string, option: string): Promise<PokeGroup> {
    const res = await fetch(`${API_URL}/${categoryName}/${option}`)
    // error checking in case fetch fails
    if (!res.ok) {
        throw new Error(`Could not fetch ${categoryName}/${option}: ${res.status}`);
    }
    const data = await res.json();

    // iterating over pokemon that are a part of the category and extracting name and url (based on the PokeField type)
    const matchedPokemon: PokeField[] = data.pokemon.map(
        (poke: {pokemon: PokeField}) => poke.pokemon);

    // fetching details for first three matchedPokemon and fetching direct URL endpoints for them (could replace with detail link?)
    const pokemon: Pokemon[] = await Promise.all(
        matchedPokemon.slice(0, 3).map(async (poke) => {
            const pokeDetail = await fetch(`${API_URL}/pokemon/${poke.name}`);
            // error checking in case pokedetail link fails (replace with Detail URL)
            if (!res.ok) {
                throw new Error(`Could not fetch ${categoryName}/${option}: ${res.status}`);
            }

            return pokeDetail.json();
        })
    );

    return {name: option,
        pokemon: pokemon};

}