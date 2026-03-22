-- Migration 001: Fix custom object table names
-- Twenty CRM expects custom object tables to have an underscore prefix (_)
-- The HubSpot migration created them without the prefix, causing all queries to fail
-- with "Data validation error" when trying to SELECT FROM "_lineItem" / "_product"
--
-- Applied: 2026-03-22

SET search_path TO workspace_3lgakiuo9asf9nwr6jwelbcww;

ALTER TABLE "lineItem" RENAME TO "_lineItem";
ALTER TABLE "product" RENAME TO "_product";
