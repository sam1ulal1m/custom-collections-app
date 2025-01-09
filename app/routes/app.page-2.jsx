import { TitleBar } from "@shopify/app-bridge-react";
import {
  BlockStack,
  Card,
  Layout,
  Page,
  Text
} from "@shopify/polaris";

export default function AdditionalPage() {
  return (
    <Page>
      <TitleBar title="Page 2" />
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="300">
              <Text>
                Page 2
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

