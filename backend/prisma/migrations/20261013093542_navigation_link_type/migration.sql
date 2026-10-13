/*
  Warnings:

  - You are about to drop the column `href` on the `navigation_item` table. All the data in the column will be lost.
  - Added the required column `destination` to the `navigation_item` table without a default value. This is not possible if the table is not empty.
  - Added the required column `link_type` to the `navigation_item` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "navigation_link_type" AS ENUM ('page', 'category', 'collection', 'product', 'external');

-- AlterTable
ALTER TABLE "navigation_item" DROP COLUMN "href",
ADD COLUMN     "destination" TEXT NOT NULL,
ADD COLUMN     "link_type" "navigation_link_type" NOT NULL,
ADD COLUMN     "open_in_new_tab" BOOLEAN NOT NULL DEFAULT false;

-- Destination shape, enforced by the database as well as the API (hand-written; Prisma does not model CHECK constraints).
-- Internal link types hold the target's uuid. External links hold an absolute URL, or a mailto: or tel: link.
ALTER TABLE "navigation_item" ADD CONSTRAINT "navigation_item_destination_shape" CHECK (
  CASE "link_type"
    WHEN 'external' THEN "destination" ~* '^(https?://[^[:space:]]+|mailto:[^[:space:]]+|tel:\+?[0-9 ()-]+)$'
    ELSE "destination" ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  END
);
