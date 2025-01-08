export async function fetchShopCollections( admin) {
  try {

    if (!admin) {
      throw new Error("Failed to authenticate admin session.");
    }

    const GET_COLLECTIONS_QUERY = `#graphql
      query getCollections($first: Int!) {
        collections(first: $first) {
            nodes {
              id
              title
              handle
          }
        }
      }
    `;

    const response = await admin.graphql(GET_COLLECTIONS_QUERY, {
      variables: { first: 10 }, 
    });

    if (response.errors) {
      throw new Error(`GraphQL Error: ${response.errors.map(err => err.message).join(", ")}`);
    }
    console.log("Collections fetched:", response);
    const gqlres = await response.json();
    const collections = gqlres?.data?.collections?.nodes
    return collections ;

  } catch (error) {
    console.error("Error fetching collections:", error.message);
    throw error;
  }
}
