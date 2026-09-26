import {
  type CategoryPage,
  type CategoryPageId,
  categoryPageSchema,
  type EditionManifest,
  editionManifestKey,
  editionManifestSchema,
  type FrontPage,
  frontPageSchema,
  latestEditionKey,
  latestEditionSchema,
  ObjectNotFoundError,
  S3JsonStore,
  type StoredObject,
} from "@repo/engine";

import {
  s3AccessKeyId,
  s3BucketName,
  s3Endpoint,
  s3Region,
  s3SecretAccessKey,
} from "@/config/env";

type Page = FrontPage | CategoryPage;

class EditionStore {
  private readonly store = new S3JsonStore({
    endpoint: s3Endpoint,
    accessKeyId: s3AccessKeyId,
    secretAccessKey: s3SecretAccessKey,
    region: s3Region,
    bucketName: s3BucketName,
    forcePathStyle: true,
  });

  async getFrontPage(): Promise<FrontPage> {
    return (await this.getPage("front")) as FrontPage;
  }

  async getCategoryPage(categoryId: CategoryPageId): Promise<CategoryPage> {
    if (categoryId === "front") {
      throw new Error("The front page is not a category page.");
    }
    return (await this.getPage(categoryId)) as CategoryPage;
  }

  async getLatestEditionManifest(): Promise<EditionManifest> {
    const latest = latestEditionSchema.parse(
      await this.store.getJson<unknown>(latestEditionKey),
    );
    return editionManifestSchema.parse(
      await this.store.getJson<unknown>(editionManifestKey(latest.editionId)),
    );
  }

  async getFrontPageIllustration(storyId: string): Promise<StoredObject> {
    return this.getIllustration("front", storyId);
  }

  async getCategoryPageIllustration(
    categoryId: CategoryPageId,
    storyId: string,
  ): Promise<StoredObject> {
    if (categoryId === "front") {
      throw new Error("The front page is not a category page.");
    }
    return this.getIllustration(categoryId, storyId);
  }

  private async getPage(pageId: CategoryPageId): Promise<Page> {
    const manifest = await this.getLatestEditionManifest();
    const page = manifest.pages.find((candidate) => candidate.id === pageId);
    if (page?.status !== "published") {
      throw new ObjectNotFoundError(
        `Edition ${manifest.editionId} page: ${pageId}`,
      );
    }

    const document = await this.store.getJson<unknown>(page.objectKey);
    return pageId === "front"
      ? (frontPageSchema.parse(document) as FrontPage)
      : (categoryPageSchema.parse(document) as CategoryPage);
  }

  private async getIllustration(
    pageId: CategoryPageId,
    storyId: string,
  ): Promise<StoredObject> {
    const page = await this.getPage(pageId);
    const story = [page.leadStory, ...page.secondaryStories].find(
      (candidate) => candidate.id === storyId,
    );
    const asset = story?.illustration?.asset;
    if (!asset) {
      throw new ObjectNotFoundError(`${pageId} illustration: ${storyId}`);
    }
    return this.store.getObject(asset.objectKey);
  }
}

export const editionStore = new EditionStore();
