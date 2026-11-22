/**
 * ============================================================================
 * File:        app/pokemon/loading.tsx
 * Created By:  Sydney Stokes
 * Purpose:     Loading message for the /pokemon route. Next.js automatically
 *              wraps page.tsx in a <Suspense> boundary and shows this while
 *              the Pokemon data is being fetched. (source: https://nextjs.org/
 *              docs/app/api-reference/file-conventions/loading)
 * ============================================================================
 */

export default function Loading() {
  return <p>Loading Pokemon...</p>;
}