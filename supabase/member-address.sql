-- Migration: Add address fields to member table
-- Supports UK and India addresses with postcode/pincode

ALTER TABLE member
ADD COLUMN address_line1 text,
ADD COLUMN address_line2 text,
ADD COLUMN city text,
ADD COLUMN state_county text,
ADD COLUMN postcode text,
ADD COLUMN country text DEFAULT 'UK' CHECK (country IN ('UK', 'IN'));

-- Index for postcode searches (useful for reporting/filtering)
CREATE INDEX idx_member_postcode ON member(postcode) WHERE postcode IS NOT NULL;
CREATE INDEX idx_member_country ON member(country);

COMMENT ON COLUMN member.address_line1 IS 'Street address line 1';
COMMENT ON COLUMN member.address_line2 IS 'Street address line 2 (optional)';
COMMENT ON COLUMN member.city IS 'City or town';
COMMENT ON COLUMN member.state_county IS 'County (UK) or State (India)';
COMMENT ON COLUMN member.postcode IS 'Postcode (UK) or Pincode (India)';
COMMENT ON COLUMN member.country IS 'Country code: UK or IN';
