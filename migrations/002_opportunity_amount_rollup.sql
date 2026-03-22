-- Migration 002: Opportunity amount rollup from line items
-- Makes the opportunity "amount" field a computed rollup of the SUM of associated
-- line item amounts. The amount field is already marked isUIReadOnly=true in metadata.
--
-- Line item amounts are stored as regular decimal numbers (e.g., 7300.0)
-- Opportunity amounts use the CURRENCY composite type with amountMicros (x1,000,000)
--
-- Applied: 2026-03-22

SET search_path TO workspace_3lgakiuo9asf9nwr6jwelbcww;

-- Create the rollup trigger function
CREATE OR REPLACE FUNCTION rollup_opportunity_amount()
RETURNS TRIGGER AS $$
DECLARE
    target_opp_id UUID;
    total_amount NUMERIC;
BEGIN
    -- Determine which opportunity to update
    IF TG_OP = 'DELETE' THEN
        target_opp_id := OLD."opportunityId";
    ELSIF TG_OP = 'UPDATE' AND OLD."opportunityId" IS DISTINCT FROM NEW."opportunityId" THEN
        -- If opportunity changed, update both old and new
        SELECT COALESCE(SUM(amount), 0) INTO total_amount
        FROM "_lineItem"
        WHERE "opportunityId" = OLD."opportunityId"
        AND "deletedAt" IS NULL;

        UPDATE opportunity
        SET "amountAmountMicros" = (total_amount * 1000000)::bigint
        WHERE id = OLD."opportunityId";

        target_opp_id := NEW."opportunityId";
    ELSE
        target_opp_id := NEW."opportunityId";
    END IF;

    -- Calculate the sum of line item amounts for the target opportunity
    IF target_opp_id IS NOT NULL THEN
        SELECT COALESCE(SUM(amount), 0) INTO total_amount
        FROM "_lineItem"
        WHERE "opportunityId" = target_opp_id
        AND "deletedAt" IS NULL;

        UPDATE opportunity
        SET "amountAmountMicros" = (total_amount * 1000000)::bigint
        WHERE id = target_opp_id;
    END IF;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger on the _lineItem table
DROP TRIGGER IF EXISTS trg_rollup_opportunity_amount ON "_lineItem";
CREATE TRIGGER trg_rollup_opportunity_amount
AFTER INSERT OR UPDATE OR DELETE ON "_lineItem"
FOR EACH ROW
EXECUTE FUNCTION rollup_opportunity_amount();

-- Initial rollup: update all existing opportunity amounts from their line items
UPDATE opportunity o
SET "amountAmountMicros" = sub.total_micros
FROM (
    SELECT "opportunityId",
           (COALESCE(SUM(amount), 0) * 1000000)::bigint as total_micros
    FROM "_lineItem"
    WHERE "deletedAt" IS NULL
    GROUP BY "opportunityId"
) sub
WHERE o.id = sub."opportunityId"
AND o."deletedAt" IS NULL;
