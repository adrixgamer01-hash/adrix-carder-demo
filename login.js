
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://xgbjjrwdagdjnybwpiis.supabase.co";
const SUPABASE_KEY = "sb_publishable_ZdrIJqkv8f3fdIeyHsO89g_YBJQWt6o";

const ADMIN_UID = "241e1bce-78d0-4941-accf-473d095a1df2";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const $ = (id) => document.getElementById(id);

let mode = "login";

function message(text) {
  $("authMessage").textContent = text;
}

function setLoading(loading) {
  $("submitButton").disabled = loading;
  $("googleLogin").disabled = loading;
  $("submitButton").textContent = loading
    ? "PLEASE WAIT..."
    : mode === "login" ? "SIGN IN →" : "CREATE ACCOUNT →";
}

function showMode(nextMode) {
  mode = nextMode;

  const signup = mode === "signup";

  $("formHeading").textContent = signup ? "Create Account" : "Welcome Back";
  $("formSubtitle").textContent = signup
    ? "Join the ADRIX CARDER community"
    : "Sign in to your visitor account";

  $("nameGroup").hidden = !signup;
  $("fullName").required = signup;
  $("forgotRow").hidden = signup;

  $("switchText").textContent = signup
    ? "Already have an account?"
    : "New here?";

  $("switchMode").textContent = signup ? "Sign In" : "Create Account";

  $("password").autocomplete = signup
    ? "new-password"
    : "current-password";

  setLoading(false);
  message("");
}

async function goToHomeIfVisitor() {
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) return false;

  if (data.user.id === ADMIN_UID) {
    await supabase.auth.signOut();
    message("Please use the separate administrator login.");
    return false;
  }

  window.location.href = "index.html";
  return true;
}

// Toggle password visibility
$("togglePassword").addEventListener("click", () => {
  const input = $("password");
  const visible = input.type === "password";

  input.type = visible ? "text" : "password";
  $("togglePassword").textContent = visible ? "HIDE" : "SHOW";
});

// Switch login/signup
$("switchMode").addEventListener("click", () => {
  showMode(mode === "login" ? "signup" : "login");
});

// Email login and account creation
$("authForm").addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = $("email").value.trim();
  const password = $("password").value;

  setLoading(true);
  message(mode === "login" ? "Signing in..." : "Creating your account...");

  try {
    if (mode === "signup") {
      const fullName = $("fullName").value.trim();

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: window.location.origin + "/login.html"
        }
      });

      if (error) throw error;

      if (data.session) {
        if (await goToHomeIfVisitor()) return;
      }

      message("Account created! Check your email to confirm your account, then sign in.");
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      if (await goToHomeIfVisitor()) return;
    }
  } catch (error) {
    message(error.message || "Something went wrong. Please try again.");
  } finally {
    setLoading(false);
  }
});

// Forgot password
$("forgotPassword").addEventListener("click", async () => {
  const email = $("email").value.trim();

  if (!email) {
    message("Enter your email address first.");
    $("email").focus();
    return;
  }

  message("Sending password reset email...");

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + "/login.html"
  });

  message(error
    ? error.message
    : "If an account exists for this email, a password reset link will be sent.");
});

// Google login
$("googleLogin").addEventListener("click", async () => {
  message("Connecting to Google...");
  $("googleLogin").disabled = true;

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: window.location.origin + "/login.html"
    }
  });

  if (error) {
    message(error.message);
    $("googleLogin").disabled = false;
  }
});

// If already logged in, send visitor to Home
goToHomeIfVisitor();
