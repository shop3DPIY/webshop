import type { CollectionSlug } from "@/lib/config/colors";

/**
 * Core product data model for 3DPIY digital designs.
 *
 * This schema is the single source of truth for a product, independent of
 * where it is stored (today: local JSON files in src/content/products) and
 * independent of the commerce provider (today: Payhip). It is designed so
 * that a future migration to a CMS/database, or a future local publishing
 * assistant (see src/lib/commerce and docs), only needs to produce objects
 * matching this shape.
 */

export type FileFormat = "STL" | "3MF";

export type LicenseType =
  | "personal"
  | "commercial"
  | "enterprise"
  | "free";

export type PublicationStatus = "draft" | "published" | "archived";

export interface DownloadFile {
  format: FileFormat;
  /** File name as delivered to the customer, e.g. "aptitlig-holder-4slot.stl" */
  fileName: string;
  /** Optional note, e.g. which printer profile a 3MF targets */
  note?: string;
}

export interface Dimensions {
  /** Millimeters */
  width: number;
  /** Millimeters */
  depth: number;
  /** Millimeters */
  height: number;
}

export interface PrintSettings {
  /** Recommended layer height in millimeters, e.g. 0.2 */
  layerHeightMm?: number;
  /** Recommended materials, e.g. ["PLA", "PETG"] */
  recommendedMaterials?: string[];
  /** Whether support material is required */
  supportsRequired?: boolean;
  /** Free-form printing instructions / tips */
  instructions?: string;
  /** Printers this design is explicitly confirmed compatible with */
  compatiblePrinters?: string[];
}

export interface ProductImage {
  src: string;
  alt: string;
}

export interface Product {
  /** Stable internal identifier, e.g. "ikea-aptitlig-holder-4slot" */
  id: string;
  /** URL-friendly slug for routing, usually equal to id */
  slug: string;
  title: string;
  description: string;
  /** Primary collection this product belongs to */
  category: CollectionSlug;
  /** Freeform tags for search/filtering */
  tags: string[];
  images: ProductImage[];
  downloadFiles: DownloadFile[];
  dimensions?: Dimensions;
  printSettings?: PrintSettings;
  /** Semantic version of the design, e.g. "1.0.0" */
  version: string;
  /** ISO date string, e.g. "2026-10-13" */
  lastUpdated: string;
  licenseType: LicenseType;
  /** true for free downloads, false for paid products */
  isFree: boolean;
  /**
   * Identifier used by the active commerce provider (e.g. a Payhip product
   * permalink/id). Null when the product has not been listed with a
   * commerce provider yet (e.g. drafts, free downloads with no checkout).
   * Never used elsewhere in the app except by the commerce layer.
   */
  externalCommerceId: string | null;
  publicationStatus: PublicationStatus;
  /** Related product ids, shown on the product detail page */
  relatedProductIds?: string[];
  /** Optional direct links to the same free design on other platforms */
  externalLinks?: {
    printables?: string;
    makerWorld?: string;
  };
}
