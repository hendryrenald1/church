"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Search } from "lucide-react";

export type Country = "UK" | "IN";

export interface AddressData {
  addressLine1: string;
  addressLine2: string;
  city: string;
  stateCounty: string;
  postcode: string;
  country: Country;
}

interface AddressInputProps {
  value: AddressData;
  onChange: (address: AddressData) => void;
  disabled?: boolean;
}

const COUNTRY_CONFIG = {
  UK: { postcodeLabel: "Postcode", stateLabel: "County", placeholder: "SW1A 1AA" },
  IN: { postcodeLabel: "Pincode", stateLabel: "State", placeholder: "110001" }
};

export function AddressInput({ value, onChange, disabled }: AddressInputProps) {
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const config = COUNTRY_CONFIG[value.country];

  const handleFieldChange = (field: keyof AddressData, fieldValue: string) => {
    onChange({ ...value, [field]: fieldValue });
    if (field === "postcode") {
      setLookupError(null);
    }
  };

  const handleCountryChange = (country: Country) => {
    onChange({
      ...value,
      country,
      postcode: "",
      city: "",
      stateCounty: ""
    });
    setLookupError(null);
  };

  const handleLookup = async () => {
    if (!value.postcode.trim()) return;

    setIsLookingUp(true);
    setLookupError(null);

    try {
      const response = await fetch("/api/postcode-lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postcode: value.postcode.trim(),
          country: value.country
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setLookupError(data.error || "Lookup failed");
        return;
      }

      onChange({
        ...value,
        city: data.city || value.city,
        stateCounty: data.stateCounty || value.stateCounty,
        postcode: data.postcode || value.postcode
      });
    } catch (err) {
      console.error("Postcode lookup error:", err);
      setLookupError("Network error. Please enter address manually.");
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleLookup();
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        <label className="text-sm font-medium">Country</label>
        <Select
          value={value.country}
          onValueChange={(v) => handleCountryChange(v as Country)}
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="UK">United Kingdom</SelectItem>
            <SelectItem value="IN">India</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-medium">{config.postcodeLabel}</label>
        <div className="flex gap-2">
          <Input
            placeholder={config.placeholder}
            value={value.postcode}
            onChange={(e) => handleFieldChange("postcode", e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleLookup}
            disabled={disabled || isLookingUp || !value.postcode.trim()}
          >
            {isLookingUp ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            <span className="ml-2 hidden sm:inline">Lookup</span>
          </Button>
        </div>
        {lookupError && (
          <p className="text-sm text-destructive">{lookupError}</p>
        )}
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-medium">Address Line 1</label>
        <Input
          placeholder="House number and street name"
          value={value.addressLine1}
          onChange={(e) => handleFieldChange("addressLine1", e.target.value)}
          disabled={disabled}
        />
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-medium">Address Line 2</label>
        <Input
          placeholder="Apartment, suite, unit, etc. (optional)"
          value={value.addressLine2}
          onChange={(e) => handleFieldChange("addressLine2", e.target.value)}
          disabled={disabled}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <label className="text-sm font-medium">City</label>
          <Input
            placeholder="City or town"
            value={value.city}
            onChange={(e) => handleFieldChange("city", e.target.value)}
            disabled={disabled}
          />
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium">{config.stateLabel}</label>
          <Input
            placeholder={config.stateLabel}
            value={value.stateCounty}
            onChange={(e) => handleFieldChange("stateCounty", e.target.value)}
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  );
}

export function getEmptyAddress(country: Country = "UK"): AddressData {
  return {
    addressLine1: "",
    addressLine2: "",
    city: "",
    stateCounty: "",
    postcode: "",
    country
  };
}
