-- CreateEnum
CREATE TYPE "publish_status" AS ENUM ('draft', 'published', 'unpublished', 'archived');

-- CreateEnum
CREATE TYPE "specification_type" AS ENUM ('text', 'number', 'boolean', 'choice');

-- CreateEnum
CREATE TYPE "placement_location_type" AS ENUM ('homepage_section', 'category', 'collection', 'campaign_page', 'related');

-- CreateEnum
CREATE TYPE "section_type" AS ENUM ('hero', 'product_carousel', 'collection_showcase', 'image_text', 'gallery', 'cta');

-- CreateEnum
CREATE TYPE "media_bucket" AS ENUM ('public', 'private');

-- CreateEnum
CREATE TYPE "product_media_role" AS ENUM ('primary', 'gallery');

-- CreateEnum
CREATE TYPE "navigation_menu" AS ENUM ('header', 'footer');

-- CreateEnum
CREATE TYPE "payment_status" AS ENUM ('pending', 'paid', 'failed', 'refunded');

-- CreateEnum
CREATE TYPE "order_status" AS ENUM ('received', 'confirmed', 'shipped', 'cancelled');

-- CreateEnum
CREATE TYPE "submission_type" AS ENUM ('contact', 'dealer');

-- CreateEnum
CREATE TYPE "submission_status" AS ENUM ('new', 'read', 'handled');

-- CreateTable
CREATE TABLE "user" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "mfa_enabled" BOOLEAN NOT NULL DEFAULT false,
    "mfa_secret" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permission" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_role" (
    "user_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_role_pkey" PRIMARY KEY ("user_id","role_id")
);

-- CreateTable
CREATE TABLE "role_permission" (
    "role_id" UUID NOT NULL,
    "permission_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_permission_pkey" PRIMARY KEY ("role_id","permission_id")
);

-- CreateTable
CREATE TABLE "product" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category_id" UUID,
    "short_description" TEXT NOT NULL DEFAULT '',
    "full_description" TEXT NOT NULL DEFAULT '',
    "price" INTEGER NOT NULL,
    "sale_price" INTEGER,
    "tax_class" TEXT NOT NULL DEFAULT 'standard',
    "is_purchasable" BOOLEAN NOT NULL DEFAULT true,
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "availability_message" TEXT,
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "is_new_arrival" BOOLEAN NOT NULL DEFAULT false,
    "is_bestseller" BOOLEAN NOT NULL DEFAULT false,
    "status" "publish_status" NOT NULL DEFAULT 'draft',
    "published_at" TIMESTAMPTZ(6),
    "seo_title" TEXT NOT NULL DEFAULT '',
    "seo_description" TEXT NOT NULL DEFAULT '',
    "seo_canonical" TEXT,
    "seo_share_image_id" UUID,
    "model_url" TEXT,
    "video_url" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "variant" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "sku_suffix" TEXT NOT NULL,
    "price_override" INTEGER,
    "swatch_hex" TEXT,
    "image_id" UUID,
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "variant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "specification" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "group" TEXT,
    "name" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "unit" TEXT,
    "type" "specification_type" NOT NULL DEFAULT 'text',
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "specification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "category" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "parent_id" UUID,
    "image_id" UUID,
    "position" INTEGER NOT NULL DEFAULT 0,
    "status" "publish_status" NOT NULL DEFAULT 'draft',
    "seo_title" TEXT NOT NULL DEFAULT '',
    "seo_description" TEXT NOT NULL DEFAULT '',
    "seo_canonical" TEXT,
    "seo_share_image_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collection" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "story" TEXT NOT NULL DEFAULT '',
    "image_id" UUID,
    "hero_media_id" UUID,
    "position" INTEGER NOT NULL DEFAULT 0,
    "status" "publish_status" NOT NULL DEFAULT 'draft',
    "seo_title" TEXT NOT NULL DEFAULT '',
    "seo_description" TEXT NOT NULL DEFAULT '',
    "seo_canonical" TEXT,
    "seo_share_image_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "collection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collection_product" (
    "collection_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "collection_product_pkey" PRIMARY KEY ("collection_id","product_id")
);

-- CreateTable
CREATE TABLE "related_product" (
    "product_id" UUID NOT NULL,
    "related_product_id" UUID NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "related_product_pkey" PRIMARY KEY ("product_id","related_product_id")
);

-- CreateTable
CREATE TABLE "placement" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "location_type" "placement_location_type" NOT NULL,
    "location_id" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "label" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "active_from" TIMESTAMPTZ(6),
    "active_to" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "placement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "page" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "template" TEXT NOT NULL DEFAULT 'default',
    "status" "publish_status" NOT NULL DEFAULT 'draft',
    "published_at" TIMESTAMPTZ(6),
    "scheduled_at" TIMESTAMPTZ(6),
    "seo_title" TEXT NOT NULL DEFAULT '',
    "seo_description" TEXT NOT NULL DEFAULT '',
    "seo_canonical" TEXT,
    "seo_share_image_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "page_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "section" (
    "id" UUID NOT NULL,
    "page_id" UUID NOT NULL,
    "type" "section_type" NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "config" JSONB NOT NULL,
    "scheduled_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "section_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journal_article" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" TEXT,
    "excerpt" TEXT NOT NULL DEFAULT '',
    "body" TEXT NOT NULL DEFAULT '',
    "hero_image_id" UUID,
    "status" "publish_status" NOT NULL DEFAULT 'draft',
    "published_at" TIMESTAMPTZ(6),
    "seo_title" TEXT NOT NULL DEFAULT '',
    "seo_description" TEXT NOT NULL DEFAULT '',
    "seo_canonical" TEXT,
    "seo_share_image_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "journal_article_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "article_product" (
    "article_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "article_product_pkey" PRIMARY KEY ("article_id","product_id")
);

-- CreateTable
CREATE TABLE "navigation_item" (
    "id" UUID NOT NULL,
    "menu" "navigation_menu" NOT NULL,
    "label" TEXT NOT NULL,
    "href" TEXT NOT NULL,
    "parent_id" UUID,
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "navigation_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_asset" (
    "id" UUID NOT NULL,
    "filename" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "bucket" "media_bucket" NOT NULL,
    "storage_key" TEXT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "alt_text" TEXT NOT NULL DEFAULT '',
    "variants" JSONB NOT NULL DEFAULT '{}',
    "uploaded_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_media" (
    "product_id" UUID NOT NULL,
    "media_asset_id" UUID NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "role" "product_media_role" NOT NULL DEFAULT 'gallery',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_media_pkey" PRIMARY KEY ("product_id","media_asset_id")
);

-- CreateTable
CREATE TABLE "product_document" (
    "product_id" UUID NOT NULL,
    "media_asset_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_document_pkey" PRIMARY KEY ("product_id","media_asset_id")
);

-- CreateTable
CREATE TABLE "order" (
    "id" UUID NOT NULL,
    "reference" TEXT NOT NULL,
    "customer_name" TEXT NOT NULL,
    "customer_email" TEXT NOT NULL,
    "customer_phone" TEXT NOT NULL,
    "delivery_address_line1" TEXT NOT NULL,
    "delivery_address_line2" TEXT,
    "delivery_city" TEXT NOT NULL,
    "delivery_state" TEXT NOT NULL,
    "delivery_pin" TEXT NOT NULL,
    "delivery_landmark" TEXT,
    "delivery_notes" TEXT,
    "subtotal" INTEGER NOT NULL,
    "shipping" INTEGER NOT NULL,
    "tax" INTEGER NOT NULL,
    "total" INTEGER NOT NULL,
    "payment_status" "payment_status" NOT NULL DEFAULT 'pending',
    "payment_gateway_id" TEXT,
    "payment_verified_at" TIMESTAMPTZ(6),
    "order_status" "order_status" NOT NULL DEFAULT 'received',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_item" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "variant_id" UUID,
    "product_name" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "variant_name" TEXT,
    "unit_price" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "line_total" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "submission" (
    "id" UUID NOT NULL,
    "type" "submission_type" NOT NULL,
    "payload" JSONB NOT NULL,
    "reference" TEXT NOT NULL,
    "status" "submission_status" NOT NULL DEFAULT 'new',
    "email_sent" BOOLEAN NOT NULL DEFAULT false,
    "email_error" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "submission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "setting" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updated_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "setting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_event" (
    "id" UUID NOT NULL,
    "actor_id" UUID,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_event_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "role_name_key" ON "role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "permission_key_key" ON "permission"("key");

-- CreateIndex
CREATE INDEX "user_role_role_id_idx" ON "user_role"("role_id");

-- CreateIndex
CREATE INDEX "role_permission_permission_id_idx" ON "role_permission"("permission_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_sku_key" ON "product"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "product_slug_key" ON "product"("slug");

-- CreateIndex
CREATE INDEX "product_category_id_idx" ON "product"("category_id");

-- CreateIndex
CREATE INDEX "product_status_idx" ON "product"("status");

-- CreateIndex
CREATE UNIQUE INDEX "variant_product_id_sku_suffix_key" ON "variant"("product_id", "sku_suffix");

-- CreateIndex
CREATE UNIQUE INDEX "variant_one_default_per_product" ON "variant"("product_id") WHERE ("is_default" = true);

-- CreateIndex
CREATE INDEX "specification_product_id_position_idx" ON "specification"("product_id", "position");

-- CreateIndex
CREATE UNIQUE INDEX "category_slug_key" ON "category"("slug");

-- CreateIndex
CREATE INDEX "category_parent_id_position_idx" ON "category"("parent_id", "position");

-- CreateIndex
CREATE UNIQUE INDEX "collection_slug_key" ON "collection"("slug");

-- CreateIndex
CREATE INDEX "collection_position_idx" ON "collection"("position");

-- CreateIndex
CREATE INDEX "collection_product_collection_id_position_idx" ON "collection_product"("collection_id", "position");

-- CreateIndex
CREATE INDEX "collection_product_product_id_idx" ON "collection_product"("product_id");

-- CreateIndex
CREATE INDEX "related_product_related_product_id_idx" ON "related_product"("related_product_id");

-- CreateIndex
CREATE INDEX "placement_location_type_location_id_position_idx" ON "placement"("location_type", "location_id", "position");

-- CreateIndex
CREATE UNIQUE INDEX "placement_product_id_location_type_location_id_key" ON "placement"("product_id", "location_type", "location_id");

-- CreateIndex
CREATE UNIQUE INDEX "page_slug_key" ON "page"("slug");

-- CreateIndex
CREATE INDEX "section_page_id_position_idx" ON "section"("page_id", "position");

-- CreateIndex
CREATE UNIQUE INDEX "journal_article_slug_key" ON "journal_article"("slug");

-- CreateIndex
CREATE INDEX "journal_article_status_published_at_idx" ON "journal_article"("status", "published_at");

-- CreateIndex
CREATE INDEX "article_product_product_id_idx" ON "article_product"("product_id");

-- CreateIndex
CREATE INDEX "navigation_item_menu_parent_id_position_idx" ON "navigation_item"("menu", "parent_id", "position");

-- CreateIndex
CREATE UNIQUE INDEX "media_asset_storage_key_key" ON "media_asset"("storage_key");

-- CreateIndex
CREATE INDEX "media_asset_bucket_created_at_idx" ON "media_asset"("bucket", "created_at");

-- CreateIndex
CREATE INDEX "product_media_product_id_position_idx" ON "product_media"("product_id", "position");

-- CreateIndex
CREATE INDEX "product_media_media_asset_id_idx" ON "product_media"("media_asset_id");

-- CreateIndex
CREATE INDEX "product_document_product_id_position_idx" ON "product_document"("product_id", "position");

-- CreateIndex
CREATE INDEX "product_document_media_asset_id_idx" ON "product_document"("media_asset_id");

-- CreateIndex
CREATE UNIQUE INDEX "order_reference_key" ON "order"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "order_payment_gateway_id_key" ON "order"("payment_gateway_id");

-- CreateIndex
CREATE INDEX "order_created_at_idx" ON "order"("created_at");

-- CreateIndex
CREATE INDEX "order_payment_status_idx" ON "order"("payment_status");

-- CreateIndex
CREATE INDEX "order_order_status_idx" ON "order"("order_status");

-- CreateIndex
CREATE INDEX "order_customer_email_idx" ON "order"("customer_email");

-- CreateIndex
CREATE INDEX "order_item_order_id_idx" ON "order_item"("order_id");

-- CreateIndex
CREATE INDEX "order_item_product_id_idx" ON "order_item"("product_id");

-- CreateIndex
CREATE INDEX "order_item_variant_id_idx" ON "order_item"("variant_id");

-- CreateIndex
CREATE UNIQUE INDEX "submission_reference_key" ON "submission"("reference");

-- CreateIndex
CREATE INDEX "submission_type_status_created_at_idx" ON "submission"("type", "status", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "setting_key_key" ON "setting"("key");

-- CreateIndex
CREATE INDEX "audit_event_actor_id_created_at_idx" ON "audit_event"("actor_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_event_entity_type_entity_id_idx" ON "audit_event"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_event_action_created_at_idx" ON "audit_event"("action", "created_at");

-- CreateIndex
CREATE INDEX "audit_event_created_at_idx" ON "audit_event"("created_at");

-- AddForeignKey
ALTER TABLE "user_role" ADD CONSTRAINT "user_role_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_role" ADD CONSTRAINT "user_role_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permission" ADD CONSTRAINT "role_permission_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permission" ADD CONSTRAINT "role_permission_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product" ADD CONSTRAINT "product_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product" ADD CONSTRAINT "product_seo_share_image_id_fkey" FOREIGN KEY ("seo_share_image_id") REFERENCES "media_asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variant" ADD CONSTRAINT "variant_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variant" ADD CONSTRAINT "variant_image_id_fkey" FOREIGN KEY ("image_id") REFERENCES "media_asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "specification" ADD CONSTRAINT "specification_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "category" ADD CONSTRAINT "category_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "category" ADD CONSTRAINT "category_image_id_fkey" FOREIGN KEY ("image_id") REFERENCES "media_asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "category" ADD CONSTRAINT "category_seo_share_image_id_fkey" FOREIGN KEY ("seo_share_image_id") REFERENCES "media_asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collection" ADD CONSTRAINT "collection_image_id_fkey" FOREIGN KEY ("image_id") REFERENCES "media_asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collection" ADD CONSTRAINT "collection_hero_media_id_fkey" FOREIGN KEY ("hero_media_id") REFERENCES "media_asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collection" ADD CONSTRAINT "collection_seo_share_image_id_fkey" FOREIGN KEY ("seo_share_image_id") REFERENCES "media_asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collection_product" ADD CONSTRAINT "collection_product_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collection_product" ADD CONSTRAINT "collection_product_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "related_product" ADD CONSTRAINT "related_product_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "related_product" ADD CONSTRAINT "related_product_related_product_id_fkey" FOREIGN KEY ("related_product_id") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "placement" ADD CONSTRAINT "placement_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "page" ADD CONSTRAINT "page_seo_share_image_id_fkey" FOREIGN KEY ("seo_share_image_id") REFERENCES "media_asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "section" ADD CONSTRAINT "section_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "page"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_article" ADD CONSTRAINT "journal_article_hero_image_id_fkey" FOREIGN KEY ("hero_image_id") REFERENCES "media_asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_article" ADD CONSTRAINT "journal_article_seo_share_image_id_fkey" FOREIGN KEY ("seo_share_image_id") REFERENCES "media_asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_product" ADD CONSTRAINT "article_product_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "journal_article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_product" ADD CONSTRAINT "article_product_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "navigation_item" ADD CONSTRAINT "navigation_item_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "navigation_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_asset" ADD CONSTRAINT "media_asset_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_media" ADD CONSTRAINT "product_media_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_media" ADD CONSTRAINT "product_media_media_asset_id_fkey" FOREIGN KEY ("media_asset_id") REFERENCES "media_asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_document" ADD CONSTRAINT "product_document_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_document" ADD CONSTRAINT "product_document_media_asset_id_fkey" FOREIGN KEY ("media_asset_id") REFERENCES "media_asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_item" ADD CONSTRAINT "order_item_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_item" ADD CONSTRAINT "order_item_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_item" ADD CONSTRAINT "order_item_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "variant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "setting" ADD CONSTRAINT "setting_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_event" ADD CONSTRAINT "audit_event_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
