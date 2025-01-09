export async function fetchShopCollections(admin) {
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
              image {
                url
              }
              productsCount {
                count
                precision
            }
          }
        }
      }
    `;

    const response = await admin.graphql(GET_COLLECTIONS_QUERY, {
      variables: { first: 40 },
    });

    if (response.errors) {
      throw new Error(`GraphQL Error: ${response.errors.map(err => err.message).join(", ")}`);
    }
    const gqlres = await response.json();
    const collections = gqlres?.data?.collections?.nodes
    return collections;

  } catch (error) {
    console.error("Error fetching collections:", error.message);
    throw error;
  }
}



export async function createShopCollection(admin, { title, description, isPublished = false , products}) {
  try {
    if (!admin) {
      throw new Error("Failed to authenticate admin session.");
    }

    // Step 2: Define the GraphQL mutation
    const CREATE_COLLECTION_MUTATION = `#graphql
      mutation createCollection($input: CollectionInput!) {
        collectionCreate(input: $input) {
          collection {
            id
            title
            handle
            descriptionHtml
            updatedAt
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const response = await admin.graphql(CREATE_COLLECTION_MUTATION, {
      variables: {
        input: {
          title,
          descriptionHtml: description,
          products
        }
      }
    });

    if (!response) {
      const errors = response.body.data.collectionCreate.userErrors.map(err => err.message).join(", ");
      throw new Error(`GraphQL Error: ${errors}`);
    }
    const data = await response.json();
    return data

  } catch (error) {
    console.error("Error creating collection:", error.message);
    throw error;
  }
}


export const deleteShopCollection = async (admin, id) => {
  try {
    if (!admin) {
      throw new Error("Failed to authenticate admin session.");
    }

    const DELETE_COLLECTION_MUTATION = `#graphql
      mutation DeleteCollection($id: CollectionDeleteInput!) {
  collectionDelete (input: $id) {
    deletedCollectionId
  }
}
    `;

    const response = await admin.graphql(DELETE_COLLECTION_MUTATION, {
      variables: { id: {id} },
    });

    if (response.errors) {
      throw new Error(`GraphQL Error: ${response.errors.map(err => err.message).join(", ")}`);
    }

    return response;

  } catch (error) {
    console.error("Error deleting collection:", error.message);
    throw error;
  }
}
