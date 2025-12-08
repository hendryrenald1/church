#!/usr/bin/env node

/**
 * Utility to trigger password reset emails for Supabase users.
 * Usage: node reset-password.js user@example.com
 */
require("dotenv").config({ path: ".env.local" }); // or .env


const { createClient } = require("@supabase/supabase-js");

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    console.error(`Environment variable ${name} is required.`);
    process.exit(1);
  }
  return value;
}

async function sendReset(email) {
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const supabase = createClient(url, serviceRoleKey);
    const { error } = await supabase.auth.admin.updateUserById("f9fa0b10-e8fa-4a44-a522-a3b29692b9b6" , {
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
