import { Link, redirect, useFetcher, useLoaderData } from "@remix-run/react";
import { Modal, TitleBar, useAppBridge } from '@shopify/app-bridge-react';

import {
  Box,
  Button,
  ButtonGroup,
  FormLayout,
  Icon,
  Image,
  IndexTable,
  InlineStack,
  LegacyCard,
  Page,
  Text,
  TextField,
  useIndexResourceState
} from "@shopify/polaris";
import {
  ImageIcon
} from '@shopify/polaris-icons';
import { useCallback, useState } from "react";
import { createShopCollection, deleteShopCollection, fetchShopCollections } from "../server/controller/shopifyController";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const collections = await fetchShopCollections(admin);
  return { collections };
};
export const action = async ({ request }) => {
  try {
    const { admin } = await authenticate.admin(request); // Authenticate admin user
    const formData = await request.formData();
    const actionType = formData.get('actionType');

    switch (actionType) {
      case 'createCollection': {
        const title = formData.get('title');
        const description = formData.get('description');
        const products = JSON.parse(formData.get('products'));
        const collection = await createShopCollection(admin, { title, description, products });
        return {
          redirect: '/app',
          message: `Collection "${collection.title}" created successfully.`,
        };
      }
      case 'deleteCollection': {
        const id = formData.get('id');
        const collection = await deleteShopCollection(admin, id);
        if (!collection) {
          throw new Error(`Collection not found with ID: ${id}`);
        }
        return {
          redirect: '/app',
          message: `Collection deleted successfully.`,
        };
      }

      default:
        throw new Error(`Unknown actionType: ${actionType}`);
    }
  } catch (error) {
    console.error("Error processing action:", error.message);
    return {
      error: error.message,
    };
  }
};


export default function Index() {
  const shop = window.location.href.split('/')[4]
  const [modalData, setModalData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const createCollectionFetcher = useFetcher({ key: 'createCollection' });
  const deleteCollectionFetcher = useFetcher({ key: 'deleteCollection' });
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const shopify = useAppBridge();
  const { collections } = useLoaderData() || {};
  const selectProduct = async (type) => {
    const preSelectedIds = selectedProducts?.map((id) => ({ id }))
    return await shopify.resourcePicker({
      type,
      action: "add",
      multiple: true,
      selectionIds: preSelectedIds,
      filter: {
        variants: false
      }
    });
  }
  const handleCreateCollection = useCallback(async () => {
    try {
      setIsLoading(true);

      createCollectionFetcher.submit(
        {
          actionType: 'createCollection',
          title,
          description,
          products: JSON.stringify(selectedProducts),
        },
        { method: 'post' }
      );

      if (createCollectionFetcher.state === 'idle') {
        setIsLoading(false);
        shopify.modal.hide('my-modal')
      }
    } catch (error) {
      console.error("Error creating collection:", error.message);
    }
  }, [createCollectionFetcher, title, description, selectedProducts]);
  const handleDeleteCollection = useCallback(async (id) => {
    try {
      setIsLoading(true);

      deleteCollectionFetcher.submit(
        {
          actionType: 'deleteCollection',
          id
        },
        { method: 'post' }
      );
      if (deleteCollectionFetcher.state === 'idle') {
        setIsLoading(false);
        shopify.modal.hide('delete-collection-modal')
      }
    } catch (error) {
      console.error("Error deleting collection:", error.message);
    }
  }, [deleteCollectionFetcher]);



  const resourceName = {
    singular: "order",
    plural: "collections",
  };
  const { selectedResources, allResourcesSelected, handleSelectionChange } =
    useIndexResourceState(collections);

  const rowMarkup = collections.map(
    (
      { handle, title, productsCount, image, id },
      index,
    ) => (
      <IndexTable.Row
        id={handle}
        key={handle}
        selected={selectedResources.includes(handle)}
        position={index}
      >
        <IndexTable.Cell>
          <Box maxWidth="40px" width="40px" minHeight="40px" >
            {
              image ? <Image width={"40px"} alt={title} source={image?.url} /> : <Icon source={ImageIcon} />
            }
          </Box>
        </IndexTable.Cell>
        <IndexTable.Cell>{title}</IndexTable.Cell>
        <IndexTable.Cell>
          <Text as="span" alignment="start" numeric>
            {productsCount?.count}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <InlineStack align="end" >
            <ButtonGroup>
              <Button onClick={(e) => {
                e.stopPropagation();
                setModalData({ id })
                // shopify.modal.show('edit-modal')
              }}>
                <Link style={{
                  textDecoration: "none",
                  color: "inherit"
                }} target="_blank" to={`https://admin.shopify.com/store/${shopify.config.shop.replace('.myshopify.com', '')}/collections/${id.split('/').pop()}`} >Edit</Link>
              </Button>
              <Button
                onClick={(e) => {
                  setModalData({ id })
                  e.stopPropagation();
                  shopify.modal.show('delete-collection-modal')
                }}
              >Delete</Button>
            </ButtonGroup>
          </InlineStack>
        </IndexTable.Cell>

      </IndexTable.Row>
    ),
  );

  return (
    <Page>
      <LegacyCard>
        <Box padding={"100"}>
          <InlineStack align="end">
            <Button onClick={() => shopify.modal.show('my-modal')}>Add new Collection</Button>

          </InlineStack>
        </Box>
        <IndexTable
          resourceName={resourceName}
          itemCount={collections.length}
          selectedItemsCount={
            allResourcesSelected ? "All" : selectedResources.length
          }
          onSelectionChange={handleSelectionChange}
          headings={[
            { title: "" },
            { title: "Title" },
            { title: "Products" },
            { title: "" },
          ]}
        >
          {rowMarkup}
        </IndexTable>
      </LegacyCard>


      <Modal id="my-modal">
        <Box padding="200">
          <FormLayout>
            <TextField label="Title" value={title} onChange={setTitle} />
            <TextField label="Description" value={description} onChange={setDescription} multiline={4} />
            <Button
              onClick={async () => {
                const selected = await selectProduct('product');
                if (selected) {
                  setSelectedProducts((prev) => {
                    return [
                      ...prev,
                      ...selected?.map(item => item.id
                      ),
                    ];
                  });
                }
              }}
            >
              Select products ({selectedProducts.length})
            </Button>
            {/* <Checkbox
                    label="Publish?"
                    checked={isPublished}
                    onChange={setIsPublished}
                  /> */}
          </FormLayout>
        </Box>
        <TitleBar title="Create Collection">
          <button variant={"primary"} loading={isLoading} onClick={() => {
            handleCreateCollection()
          }}>Create</button>
          <button onClick={() => {
            shopify.modal.hide('my-modal')
          }} >Cancel</button>
        </TitleBar>
      </Modal>
      <Modal id="edit-modal">
        <Box padding="200">
          <FormLayout>
            <TextField label="Title" value={title} onChange={setTitle} />
            <TextField label="Description" value={description} onChange={setDescription} multiline={4} />
            <Button
              onClick={async () => {
                const selected = await selectProduct('product');
                if (selected) {
                  setSelectedProducts((prev) => {
                    return [
                      ...prev,
                      ...selected?.map(item => item.id
                      ),
                    ];
                  });
                }
              }}
            >
              Select products ({selectedProducts.length})
            </Button>
            {/* <Checkbox
                    label="Publish?"
                    checked={isPublished}
                    onChange={setIsPublished}
                  /> */}
          </FormLayout>
        </Box>
        <TitleBar title="Edit Collection">
          <button variant={"primary"} loading={isLoading} onClick={() => {
            handleCreateCollection()
          }}>Update</button>
          <button onClick={() => {
            shopify.modal.hide('edit-modal')
          }} >Cancel</button>
        </TitleBar>
      </Modal>
      <Modal id="delete-collection-modal"   >
        <p style={{
          margin: "15px",
        }}>
          Are you sure you want to delete this collection?
        </p>
        <TitleBar title="Delete this collection?" >
          <button onClick={() => {
            shopify.modal.hide('delete-collection-modal')
          }} >Cancel</button>
          <button variant={"primary"} onClick={() => {
            handleDeleteCollection(modalData.id)
            // shopify.modal.hide('delete-collection-modal')
          }} >Delete</button>
        </TitleBar>
      </Modal>
    </Page>
  );
}
