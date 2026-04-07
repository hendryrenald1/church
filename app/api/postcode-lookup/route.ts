import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const lookupSchema = z.object({
  postcode: z.string().min(1),
  country: z.enum(["UK", "IN"])
});

interface UKPostcodeResponse {
  status: number;
  result: {
    postcode: string;
    admin_district: string;
    admin_county: string | null;
    region: string;
    country: string;
  } | null;
}

interface IndiaPostcodeResponse {
  Status: string;
  PostOffice: Array<{
    Name: string;
    District: string;
    State: string;
    Country: string;
  }> | null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = lookupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request. Provide postcode and country (UK or IN)." },
        { status: 400 }
      );
    }

    const { postcode, country } = parsed.data;
    const cleanPostcode = postcode.trim().replace(/\s+/g, "");

    if (country === "UK") {
      const response = await fetch(
        `https://api.postcodes.io/postcodes/${encodeURIComponent(cleanPostcode)}`,
        { cache: "no-store" }
      );

      if (!response.ok) {
        if (response.status === 404) {
          return NextResponse.json({ error: "Postcode not found" }, { status: 404 });
        }
        console.error("UK postcode API error:", response.status, response.statusText);
        return NextResponse.json({ error: "Lookup service error" }, { status: 502 });
      }

      const data: UKPostcodeResponse = await response.json();

      if (!data.result) {
        return NextResponse.json({ error: "Postcode not found" }, { status: 404 });
      }

      return NextResponse.json({
        city: data.result.admin_district,
        stateCounty: data.result.admin_county || data.result.region,
        postcode: data.result.postcode,
        country: "UK"
      });
    } else {
      // India pincode lookup
      const response = await fetch(
        `https://api.postalpincode.in/pincode/${encodeURIComponent(cleanPostcode)}`,
        { cache: "no-store" }
      );

      if (!response.ok) {
        console.error("India pincode API error:", response.status, response.statusText);
        return NextResponse.json({ error: "Lookup service error" }, { status: 502 });
      }

      const data: IndiaPostcodeResponse[] = await response.json();

      if (!data[0] || data[0].Status !== "Success" || !data[0].PostOffice?.length) {
        return NextResponse.json({ error: "Pincode not found" }, { status: 404 });
      }

      const firstResult = data[0].PostOffice[0];

      return NextResponse.json({
        city: firstResult.District,
        stateCounty: firstResult.State,
        postcode: cleanPostcode,
        country: "IN"
      });
    }
  } catch (error) {
    console.error("Postcode lookup failed:", error);
    return NextResponse.json(
      { error: "Lookup service unavailable. Please enter address manually." },
      { status: 503 }
    );
  }
}
