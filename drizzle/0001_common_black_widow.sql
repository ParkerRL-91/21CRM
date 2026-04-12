CREATE TABLE "approval_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"rule_id" uuid,
	"entity_type" varchar(30) NOT NULL,
	"entity_id" uuid NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"step_number" integer NOT NULL,
	"requested_by" uuid,
	"decided_by" uuid,
	"decided_at" timestamp with time zone,
	"comments" text,
	"previous_approval_data" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ar_status_check" CHECK ("approval_requests"."status" IN ('pending', 'approved', 'rejected', 'skipped'))
);
--> statement-breakpoint
CREATE TABLE "approval_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"entity_type" varchar(30) DEFAULT 'quote' NOT NULL,
	"priority" integer NOT NULL,
	"conditions" jsonb NOT NULL,
	"approver_user_id" uuid,
	"approver_role" varchar(100),
	"step_number" integer DEFAULT 1 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "discount_schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" varchar(20) NOT NULL,
	"discount_unit" varchar(20) DEFAULT 'percent' NOT NULL,
	"product_id" uuid,
	"product_family" varchar(100),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ds_type_check" CHECK ("discount_schedules"."type" IN ('tiered', 'volume', 'term')),
	CONSTRAINT "ds_unit_check" CHECK ("discount_schedules"."discount_unit" IN ('percent', 'amount', 'price'))
);
--> statement-breakpoint
CREATE TABLE "discount_tiers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"schedule_id" uuid NOT NULL,
	"lower_bound" numeric(12, 2) NOT NULL,
	"upper_bound" numeric(12, 2),
	"discount_value" numeric(12, 2) NOT NULL,
	"sort_order" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice_line_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" uuid NOT NULL,
	"product_name" varchar(255) NOT NULL,
	"description" text,
	"quantity" numeric(12, 2) DEFAULT '1' NOT NULL,
	"unit_price" numeric(12, 2) NOT NULL,
	"total" numeric(12, 2) NOT NULL,
	"billing_type" varchar(20) DEFAULT 'recurring' NOT NULL,
	"billing_period_start" date,
	"billing_period_end" date,
	"sort_order" integer DEFAULT 10 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"invoice_number" varchar(50) NOT NULL,
	"contract_id" uuid,
	"quote_id" uuid,
	"account_hubspot_id" varchar(50),
	"account_name" varchar(255),
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"issue_date" date NOT NULL,
	"due_date" date NOT NULL,
	"subtotal" numeric(12, 2) DEFAULT '0' NOT NULL,
	"tax_total" numeric(12, 2) DEFAULT '0' NOT NULL,
	"total" numeric(12, 2) DEFAULT '0' NOT NULL,
	"currency_code" varchar(3) DEFAULT 'CAD' NOT NULL,
	"payment_terms" varchar(30) DEFAULT 'net_30',
	"notes" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "invoices_org_number_unique" UNIQUE("org_id","invoice_number"),
	CONSTRAINT "invoices_status_check" CHECK ("invoices"."status" IN ('draft', 'sent', 'paid', 'overdue', 'cancelled'))
);
--> statement-breakpoint
CREATE TABLE "price_book_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"price_book_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"unit_price" numeric(12, 2) NOT NULL,
	"currency_code" varchar(3) DEFAULT 'CAD' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"effective_date" date,
	"expiration_date" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pbe_pricebook_product_unique" UNIQUE("price_book_id","product_id")
);
--> statement-breakpoint
CREATE TABLE "price_books" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"is_standard" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"currency_code" varchar(3) DEFAULT 'CAD' NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"sku" varchar(100),
	"description" text,
	"product_type" varchar(30) NOT NULL,
	"family" varchar(100),
	"is_active" boolean DEFAULT true NOT NULL,
	"default_subscription_term_months" integer,
	"billing_frequency" varchar(20),
	"charge_type" varchar(20) DEFAULT 'recurring' NOT NULL,
	"default_price" numeric(12, 2),
	"hubspot_product_id" varchar(50),
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "products_type_check" CHECK ("products"."product_type" IN ('subscription', 'one_time', 'professional_service')),
	CONSTRAINT "products_charge_type_check" CHECK ("products"."charge_type" IN ('recurring', 'one_time', 'usage')),
	CONSTRAINT "products_billing_check" CHECK ("products"."billing_frequency" IS NULL OR "products"."billing_frequency" IN ('monthly', 'quarterly', 'semi_annual', 'annual'))
);
--> statement-breakpoint
CREATE TABLE "quote_attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quote_id" uuid NOT NULL,
	"file_name" varchar(500) NOT NULL,
	"file_path" varchar(1000) NOT NULL,
	"file_size" integer,
	"mime_type" varchar(100) DEFAULT 'application/pdf' NOT NULL,
	"version_number" integer NOT NULL,
	"template_id" uuid,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quote_audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quote_id" uuid NOT NULL,
	"action" varchar(50) NOT NULL,
	"field_name" varchar(100),
	"old_value" jsonb,
	"new_value" jsonb,
	"changed_by" uuid,
	"changed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quote_line_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quote_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"sort_order" integer DEFAULT 10 NOT NULL,
	"subtotal" numeric(12, 2) DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quote_line_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quote_id" uuid NOT NULL,
	"product_id" uuid,
	"price_book_entry_id" uuid,
	"group_id" uuid,
	"parent_line_id" uuid,
	"product_name" varchar(255) NOT NULL,
	"product_sku" varchar(100),
	"quantity" numeric(12, 2) DEFAULT '1' NOT NULL,
	"list_price" numeric(12, 2) NOT NULL,
	"special_price" numeric(12, 2),
	"prorated_price" numeric(12, 2),
	"regular_price" numeric(12, 2),
	"customer_price" numeric(12, 2),
	"net_unit_price" numeric(12, 2) NOT NULL,
	"net_total" numeric(12, 2) NOT NULL,
	"discount_percent" numeric(5, 2),
	"discount_amount" numeric(12, 2),
	"billing_type" varchar(20) DEFAULT 'recurring' NOT NULL,
	"billing_frequency" varchar(20),
	"subscription_term_months" integer,
	"pricing_audit" jsonb DEFAULT '[]'::jsonb,
	"sort_order" integer DEFAULT 10 NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "qli_billing_type_check" CHECK ("quote_line_items"."billing_type" IN ('recurring', 'one_time', 'usage'))
);
--> statement-breakpoint
CREATE TABLE "quote_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quote_id" uuid NOT NULL,
	"version_number" integer NOT NULL,
	"snapshot_data" jsonb NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "qs_quote_version_unique" UNIQUE("quote_id","version_number")
);
--> statement-breakpoint
CREATE TABLE "quote_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quotes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"quote_number" varchar(50) NOT NULL,
	"opportunity_hubspot_id" varchar(50),
	"account_hubspot_id" varchar(50),
	"account_name" varchar(255),
	"status" varchar(30) DEFAULT 'draft' NOT NULL,
	"type" varchar(20) DEFAULT 'new' NOT NULL,
	"version_number" integer DEFAULT 1 NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"price_book_id" uuid,
	"contract_id" uuid,
	"subscription_term_months" integer DEFAULT 12 NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date,
	"expiration_date" date NOT NULL,
	"currency_code" varchar(3) DEFAULT 'CAD' NOT NULL,
	"subtotal" numeric(12, 2) DEFAULT '0' NOT NULL,
	"discount_total" numeric(12, 2) DEFAULT '0' NOT NULL,
	"tax_total" numeric(12, 2) DEFAULT '0' NOT NULL,
	"grand_total" numeric(12, 2) DEFAULT '0' NOT NULL,
	"payment_terms" varchar(30) DEFAULT 'net_30',
	"acceptance_method" varchar(30),
	"acceptance_date" date,
	"po_number" varchar(100),
	"rejection_reason" varchar(50),
	"rejection_notes" text,
	"notes" text,
	"internal_notes" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "quotes_org_number_unique" UNIQUE("org_id","quote_number"),
	CONSTRAINT "quotes_status_check" CHECK ("quotes"."status" IN ('draft', 'in_review', 'approved', 'denied', 'presented', 'accepted', 'rejected', 'expired', 'contracted')),
	CONSTRAINT "quotes_type_check" CHECK ("quotes"."type" IN ('new', 'amendment', 'renewal'))
);
--> statement-breakpoint
CREATE TABLE "subscription_state_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subscription_id" uuid NOT NULL,
	"org_id" uuid NOT NULL,
	"from_state" varchar(30) NOT NULL,
	"to_state" varchar(30) NOT NULL,
	"triggering_event" varchar(50) NOT NULL,
	"related_entity_type" varchar(30),
	"related_entity_id" uuid,
	"changed_by" uuid,
	"changed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_rule_id_approval_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."approval_rules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discount_schedules" ADD CONSTRAINT "discount_schedules_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discount_tiers" ADD CONSTRAINT "discount_tiers_schedule_id_discount_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "public"."discount_schedules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_line_items" ADD CONSTRAINT "invoice_line_items_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_book_entries" ADD CONSTRAINT "price_book_entries_price_book_id_price_books_id_fk" FOREIGN KEY ("price_book_id") REFERENCES "public"."price_books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_book_entries" ADD CONSTRAINT "price_book_entries_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_attachments" ADD CONSTRAINT "quote_attachments_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_attachments" ADD CONSTRAINT "quote_attachments_template_id_quote_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."quote_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_audit_log" ADD CONSTRAINT "quote_audit_log_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_line_groups" ADD CONSTRAINT "quote_line_groups_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_line_items" ADD CONSTRAINT "quote_line_items_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_line_items" ADD CONSTRAINT "quote_line_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_line_items" ADD CONSTRAINT "quote_line_items_price_book_entry_id_price_book_entries_id_fk" FOREIGN KEY ("price_book_entry_id") REFERENCES "public"."price_book_entries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_line_items" ADD CONSTRAINT "quote_line_items_group_id_quote_line_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."quote_line_groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_snapshots" ADD CONSTRAINT "quote_snapshots_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_price_book_id_price_books_id_fk" FOREIGN KEY ("price_book_id") REFERENCES "public"."price_books"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ar_entity_idx" ON "approval_requests" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "ar_org_status_idx" ON "approval_requests" USING btree ("org_id","status");--> statement-breakpoint
CREATE INDEX "ar_org_active_idx" ON "approval_rules" USING btree ("org_id","is_active","priority");--> statement-breakpoint
CREATE INDEX "ds_org_active_idx" ON "discount_schedules" USING btree ("org_id","is_active");--> statement-breakpoint
CREATE INDEX "ds_product_idx" ON "discount_schedules" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "dt_schedule_order_idx" ON "discount_tiers" USING btree ("schedule_id","sort_order");--> statement-breakpoint
CREATE INDEX "ili_invoice_idx" ON "invoice_line_items" USING btree ("invoice_id","sort_order");--> statement-breakpoint
CREATE INDEX "invoices_org_status_idx" ON "invoices" USING btree ("org_id","status");--> statement-breakpoint
CREATE INDEX "invoices_contract_idx" ON "invoices" USING btree ("contract_id");--> statement-breakpoint
CREATE INDEX "pbe_product_idx" ON "price_book_entries" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "pbe_pricebook_active_idx" ON "price_book_entries" USING btree ("price_book_id","is_active");--> statement-breakpoint
CREATE INDEX "price_books_org_active_idx" ON "price_books" USING btree ("org_id","is_active");--> statement-breakpoint
CREATE INDEX "products_org_active_idx" ON "products" USING btree ("org_id","is_active");--> statement-breakpoint
CREATE INDEX "products_org_type_idx" ON "products" USING btree ("org_id","product_type");--> statement-breakpoint
CREATE INDEX "products_org_family_idx" ON "products" USING btree ("org_id","family");--> statement-breakpoint
CREATE INDEX "products_hubspot_idx" ON "products" USING btree ("org_id","hubspot_product_id");--> statement-breakpoint
CREATE INDEX "qa_quote_idx" ON "quote_attachments" USING btree ("quote_id","version_number");--> statement-breakpoint
CREATE INDEX "qal_quote_idx" ON "quote_audit_log" USING btree ("quote_id","changed_at");--> statement-breakpoint
CREATE INDEX "qlg_quote_idx" ON "quote_line_groups" USING btree ("quote_id","sort_order");--> statement-breakpoint
CREATE INDEX "qli_quote_order_idx" ON "quote_line_items" USING btree ("quote_id","sort_order");--> statement-breakpoint
CREATE INDEX "qli_group_idx" ON "quote_line_items" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "qli_product_idx" ON "quote_line_items" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "quotes_org_status_idx" ON "quotes" USING btree ("org_id","status");--> statement-breakpoint
CREATE INDEX "quotes_org_account_idx" ON "quotes" USING btree ("org_id","account_hubspot_id");--> statement-breakpoint
CREATE INDEX "quotes_org_type_idx" ON "quotes" USING btree ("org_id","type");--> statement-breakpoint
CREATE INDEX "quotes_expiration_idx" ON "quotes" USING btree ("org_id","expiration_date");--> statement-breakpoint
CREATE INDEX "quotes_opportunity_idx" ON "quotes" USING btree ("opportunity_hubspot_id");--> statement-breakpoint
CREATE INDEX "ssl_subscription_idx" ON "subscription_state_log" USING btree ("subscription_id","changed_at");--> statement-breakpoint
CREATE INDEX "ssl_org_idx" ON "subscription_state_log" USING btree ("org_id","changed_at");