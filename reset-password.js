#!/usr/bin/env node

/**
 * Utility to trigger password reset emails for Supabase users.
 * Usage: node reset-password.js user@example.com
 */
require("dotenv").config({ path: ".env.local" }); // or .env


const { createClient } = require("@supabase/supabase-js");

function requireEnv(userId) {
  const value = process.env[userId];
  if (!value) {
    console.error(`Environment variable ${userId} is required.`);
    process.exit(1);
  }
  return value;
}

async function sendReset(email) {
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const supabase = createClient(url, serviceRoleKey);
    const { error } = await supabase.auth.admin.updateUserById(value , {
    password: "StrongPassword123"
  });
  if (error) {
    console.error(`Failed to send reset email: ${error.message}`);
    process.exit(1);
  }
  // const { error } = await supabase.auth.resetPasswordForEmail(email, {
  //   redirectTo: process.env.SUPABASE_RESET_REDIRECT || undefined
  // });
  // if (error) {
  //   console.error(`Failed to send reset email: ${error.message}`);
  //   process.exit(1);
  // }
  // console.log(`Password reset email sent to ${email}`);
}

const emailArg = process.argv[2];
if (!emailArg) {
  console.error("Usage: node reset-password.js user@example.com");
  process.exit(1);
}

sendReset(emailArg).catch((error) => {
  console.error("Unexpected error sending reset email:", error);
  process.exit(1);
});
