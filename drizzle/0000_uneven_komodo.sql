CREATE TABLE "contract_amendments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contract_id" uuid NOT NULL,
	"org_id" uuid NOT NULL,
	"amendment_number" integer NOT NULL,
	"amendment_type" varchar(30) NOT NULL,
	"description" text NOT NULL,
	"subscription_id" uuid,
	"changes" jsonb NOT NULL,
	"delta_value" numeric(12, 2) DEFAULT '0' NOT NULL,
	"effective_date" date NOT NULL,
	"deal_hubspot_id" varchar(50),
	"quote_id" uuid,
	"amended_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "amendments_contract_number_unique" UNIQUE("contract_id","amendment_number"),
	CONSTRAINT "amendments_type_check" CHECK ("contract_amendments"."amendment_type" IN ('add_subscription', 'remove_subscription', 'quantity_change', 'price_change', 'term_extension', 'early_renewal', 'cancellation', 'product_upgrade'))
);
--> statement-breakpoint
CREATE TABLE "contract_renewals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contract_id" uuid NOT NULL,
	"org_id" uuid NOT NULL,
	"renewal_number" integer DEFAULT 1 NOT NULL,
	"opportunity_hubspot_id" varchar(50),
	"opportunity_created_at" timestamp with time zone,
	"renewal_quote_id" uuid,
	"quote_generated_at" timestamp with time zone,
	"proposed_start_date" date NOT NULL,
	"proposed_end_date" date NOT NULL,
	"proposed_term_months" integer NOT NULL,
	"proposed_total_value" numeric(12, 2),
	"pricing_method_used" varchar(30) NOT NULL,
	"proposed_subscriptions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" varchar(30) DEFAULT 'pending' NOT NULL,
	"outcome_date" date,
	"outcome_notes" text,
	"new_contract_id" uuid,
	"risk_score" integer,
	"risk_level" varchar(10),
	"risk_signals" jsonb DEFAULT '[]'::jsonb,
	"risk_assessed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "renewals_contract_number_unique" UNIQUE("contract_id","renewal_number"),
	CONSTRAINT "renewals_status_check" CHECK ("contract_renewals"."status" IN ('pending', 'in_progress', 'won', 'lost', 'cancelled')),
	CONSTRAINT "renewals_pricing_method_check" CHECK ("contract_renewals"."pricing_method_used" IN ('same_price', 'current_list', 'uplift_percentage')),
	CONSTRAINT "renewals_risk_level_check" CHECK ("contract_renewals"."risk_level" IS NULL OR "contract_renewals"."risk_level" IN ('low', 'medium', 'high', 'critical'))
);
--> statement-breakpoint
CREATE TABLE "contract_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contract_id" uuid NOT NULL,
	"org_id" uuid NOT NULL,
	"product_hubspot_id" varchar(50),
	"product_name" varchar(255) NOT NULL,
	"line_item_hubspot_id" varchar(50),
	"quantity" numeric(12, 2) DEFAULT '1' NOT NULL,
	"unit_price" numeric(12, 2) NOT NULL,
	"discount_percentage" numeric(5, 2) DEFAULT '0',
	"annual_value" numeric(12, 2) NOT NULL,
	"billing_frequency" varchar(20) DEFAULT 'annual' NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"status" varchar(30) DEFAULT 'active' NOT NULL,
	"cancel_at_period_end" boolean DEFAULT false NOT NULL,
	"cancelled_at" timestamp with time zone,
	"cancelled_reason" text,
	"renewal_pricing_method" varchar(30),
	"renewal_uplift_percentage" numeric(5, 2),
	"charge_type" varchar(20) DEFAULT 'recurring' NOT NULL,
	"subscription_type" varchar(20) DEFAULT 'renewable' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "subscriptions_dates_check" CHECK ("contract_subscriptions"."end_date" > "contract_subscriptions"."start_date"),
	CONSTRAINT "subscriptions_status_check" CHECK ("contract_subscriptions"."status" IN ('active', 'pending', 'suspended', 'pending_amendment', 'pending_renewal', 'pending_cancellation', 'renewed', 'cancelled', 'expired')),
	CONSTRAINT "subscriptions_billing_check" CHECK ("contract_subscriptions"."billing_frequency" IN ('monthly', 'quarterly', 'semi_annual', 'annual')),
	CONSTRAINT "subscriptions_charge_type_check" CHECK ("contract_subscriptions"."charge_type" IN ('recurring', 'one_time', 'usage')),
	CONSTRAINT "subscriptions_sub_type_check" CHECK ("contract_subscriptions"."subscription_type" IN ('renewable', 'evergreen', 'one_time')),
	CONSTRAINT "subscriptions_renewal_method_check" CHECK ("contract_subscriptions"."renewal_pricing_method" IS NULL OR "contract_subscriptions"."renewal_pricing_method" IN ('same_price', 'current_list', 'uplift_percentage'))
);
--> statement-breakpoint
CREATE TABLE "contracts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"contract_number" varchar(50) NOT NULL,
	"contract_name" varchar(255) NOT NULL,
	"account_hubspot_id" varchar(50),
	"account_name" varchar(255),
	"deal_hubspot_id" varchar(50),
	"quote_id" uuid,
	"status" varchar(30) DEFAULT 'draft' NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"total_value" numeric(12, 2) DEFAULT '0' NOT NULL,
	"currency_code" varchar(3) DEFAULT 'CAD' NOT NULL,
	"renewal_status" varchar(30),
	"renewal_opportunity_hubspot_id" varchar(50),
	"renewal_lead_days" integer DEFAULT 90,
	"renewal_pricing_method" varchar(30),
	"renewal_uplift_percentage" numeric(5, 2),
	"owner_hubspot_id" varchar(50),
	"owner_name" varchar(255),
	"cancelled_at" timestamp with time zone,
	"cancelled_reason" text,
	"notes" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	CONSTRAINT "contracts_org_number_unique" UNIQUE("org_id","contract_number"),
	CONSTRAINT "contracts_dates_check" CHECK ("contracts"."end_date" > "contracts"."start_date"),
	CONSTRAINT "contracts_status_check" CHECK ("contracts"."status" IN ('draft', 'active', 'amended', 'pending_renewal', 'renewed', 'expired', 'cancelled')),
	CONSTRAINT "contracts_renewal_method_check" CHECK ("contracts"."renewal_pricing_method" IS NULL OR "contracts"."renewal_pricing_method" IN ('same_price', 'current_list', 'uplift_percentage'))
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"type" varchar(50) NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"entity_type" varchar(50),
	"entity_id" varchar(100),
	"action_url" varchar(500),
	"is_read" boolean DEFAULT false NOT NULL,
	"read_at" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "renewal_config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"default_lead_days" integer DEFAULT 90 NOT NULL,
	"lead_days_options" jsonb DEFAULT '[30,60,90,120]'::jsonb NOT NULL,
	"default_pricing_method" varchar(30) DEFAULT 'same_price' NOT NULL,
	"default_uplift_percentage" numeric(5, 2) DEFAULT '3.00',
	"renewal_pipeline_id" varchar(50),
	"renewal_stage_id" varchar(50),
	"renewal_deal_prefix" varchar(50) DEFAULT 'Renewal:',
	"notify_owner_on_creation" boolean DEFAULT true NOT NULL,
	"notify_additional_users" jsonb DEFAULT '[]'::jsonb,
	"job_enabled" boolean DEFAULT true NOT NULL,
	"job_last_run_at" timestamp with time zone,
	"job_last_result" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "renewal_config_org_id_unique" UNIQUE("org_id")
);
--> statement-breakpoint
ALTER TABLE "contract_amendments" ADD CONSTRAINT "contract_amendments_contract_id_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_amendments" ADD CONSTRAINT "contract_amendments_subscription_id_contract_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."contract_subscriptions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_renewals" ADD CONSTRAINT "contract_renewals_contract_id_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_renewals" ADD CONSTRAINT "contract_renewals_new_contract_id_contracts_id_fk" FOREIGN KEY ("new_contract_id") REFERENCES "public"."contracts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_subscriptions" ADD CONSTRAINT "contract_subscriptions_contract_id_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "amendments_contract_idx" ON "contract_amendments" USING btree ("contract_id","amendment_number");--> statement-breakpoint
CREATE INDEX "amendments_org_date_idx" ON "contract_amendments" USING btree ("org_id","effective_date");--> statement-breakpoint
CREATE INDEX "renewals_contract_idx" ON "contract_renewals" USING btree ("contract_id");--> statement-breakpoint
CREATE INDEX "renewals_org_status_idx" ON "contract_renewals" USING btree ("org_id","status");--> statement-breakpoint
CREATE INDEX "renewals_org_start_date_idx" ON "contract_renewals" USING btree ("org_id","proposed_start_date");--> statement-breakpoint
CREATE INDEX "renewals_opportunity_idx" ON "contract_renewals" USING btree ("opportunity_hubspot_id");--> statement-breakpoint
CREATE INDEX "renewals_org_outcome_date_idx" ON "contract_renewals" USING btree ("org_id","outcome_date");--> statement-breakpoint
CREATE INDEX "subscriptions_contract_idx" ON "contract_subscriptions" USING btree ("contract_id");--> statement-breakpoint
CREATE INDEX "subscriptions_org_status_idx" ON "contract_subscriptions" USING btree ("org_id","status");--> statement-breakpoint
CREATE INDEX "subscriptions_org_product_idx" ON "contract_subscriptions" USING btree ("org_id","product_hubspot_id");--> statement-breakpoint
CREATE INDEX "contracts_org_status_idx" ON "contracts" USING btree ("org_id","status");--> statement-breakpoint
CREATE INDEX "contracts_org_status_enddate_idx" ON "contracts" USING btree ("org_id","status","end_date");--> statement-breakpoint
CREATE INDEX "contracts_org_account_idx" ON "contracts" USING btree ("org_id","account_hubspot_id");--> statement-breakpoint
CREATE INDEX "contracts_org_owner_idx" ON "contracts" USING btree ("org_id","owner_hubspot_id");--> statement-breakpoint
CREATE INDEX "notifications_user_unread_idx" ON "notifications" USING btree ("user_id","is_read","created_at");--> statement-breakpoint
CREATE INDEX "notifications_org_type_idx" ON "notifications" USING btree ("org_id","type","created_at");--> statement-breakpoint
CREATE INDEX "notifications_expires_idx" ON "notifications" USING btree ("expires_at");