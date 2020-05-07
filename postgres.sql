-- Module to generate UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- Create Orders Table
CREATE TABLE public.orders(
	order_id serial PRIMARY KEY,
	ext_order_id uuid DEFAULT uuid_generate_v4 (),
	first_name VARCHAR NOT NULL,
    last_name VARCHAR NOT NULL,
	email VARCHAR NOT NULL,
	is_gift BOOLEAN DEFAULT false,
	gift_recipient VARCHAR,
	ship_address VARCHAR NOT NULL,
	ship_address2 VARCHAR,
	ship_city VARCHAR NOT NULL,
	ship_state VARCHAR NOT NULL,
	ship_zip VARCHAR NOT NULL,
	notes TEXT,
	album_link VARCHAR NOT NULL,
	back_id VARCHAR NOT NULL,
	created_on TIMESTAMP NOT NULL);
