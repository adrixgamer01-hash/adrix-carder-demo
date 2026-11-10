
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://xgbjjrwdagdjnybwpiis.supabase.co";
const SUPABASE_KEY = "sb_publishable_ZdrIJqkv8f3fdIeyHsO89g_YBJQWt6o";

const ADMIN_UID = "241e1bce-78d0-4941-accf-473d095a1df2";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const $ = (id) => document.getElementById(id);

function status(id, message) {
  $(id).textContent = message;
}

function showDashboard() {
  $("loginSection").hidden = true;
  $("dashboard").hidden = false;
}

function showLogin() {
  $("loginSection").hidden = false;
  $("dashboard").hidden = true;
}

async function verifyAdmin() {
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user || user.id !== ADMIN_UID) {
    await supabase.auth.signOut();
    showLogin();
    return false;
  }

  showDashboard();
  await loadSettings();
  await loadGallery();
  return true;
}

// LOGIN
$("loginForm").addEventListener("submit", async (event) => {
  event.preventDefault();

  status("loginStatus", "Logging in...");

  const email = $("adminEmail").value.trim();
  const password = $("adminPassword").value;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    status("loginStatus", "Login failed: " + error.message);
    return;
  }

  const success = await verifyAdmin();

  if (success) {
    status("loginStatus", "Login successful!");
  } else {
    status("loginStatus", "This account is not authorized as admin.");
  }
});

// LOAD WEBSITE SETTINGS
async function loadSettings() {
  const { data, error } = await supabase
    .from("site_settings")
    .select("site_title, hero_description, about_text")
    .eq("id", 1)
    .maybeSingle();

  if (error) {
    status("settingsStatus", "Could not load settings: " + error.message);
    return;
  }

  if (data) {
    $("siteTitle").value = data.site_title || "";
    $("heroDescription").value = data.hero_description || "";
    $("aboutText").value = data.about_text || "";
  }
}

// SAVE WEBSITE SETTINGS
$("saveSettings").addEventListener("click", async () => {
  status("settingsStatus", "Saving...");

  const updates = {
    site_title: $("siteTitle").value.trim(),
    hero_description: $("heroDescription").value.trim(),
    about_text: $("aboutText").value.trim(),
    updated_at: new Date().toISOString()
  };

  const { error } = await supabase
    .from("site_settings")
    .update(updates)
    .eq("id", 1);

  status(
    "settingsStatus",
    error ? "Save failed: " + error.message : "Settings saved successfully!"
  );
});

// CHECK ARTWORK IMAGE URL
function validImageUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

// ADD GALLERY ARTWORK
$("addArtwork").addEventListener("click", async () => {
  const title = $("artTitle").value.trim();
  const category = $("artCategory").value;
  const description = $("artDescription").value.trim();
  const image_url = $("artImage").value.trim();

  if (!title || !description || !image_url) {
    status("galleryStatus", "Please fill in all artwork fields.");
    return;
  }

  if (!validImageUrl(image_url)) {
    status("galleryStatus", "Please enter a valid HTTPS image URL.");
    return;
  }

  status("galleryStatus", "Adding artwork...");

  const { error } = await supabase.from("gallery").insert({
    title,
    category,
    description,
    image_url,
    is_published: true,
    sort_order: 0
  });

  if (error) {
    status("galleryStatus", "Could not add artwork: " + error.message);
    return;
  }

  $("artTitle").value = "";
  $("artDescription").value = "";
  $("artImage").value = "";

  status("galleryStatus", "Artwork added successfully!");
  await loadGallery();
});

// LOAD AND DISPLAY GALLERY
async function loadGallery() {
  const list = $("galleryList");
  list.replaceChildren();

  const { data, error } = await supabase
    .from("gallery")
    .select("id, title, category, description, image_url, is_published")
    .order("created_at", { ascending: false });

  if (error) {
    status("galleryStatus", "Could not load gallery: " + error.message);
    return;
  }

  if (!data || data.length === 0) {
    list.textContent = "No artwork added yet.";
    return;
  }

  data.forEach((art) => {
    const item = document.createElement("div");
    item.className = "admin-box";

    const heading = document.createElement("h3");
    heading.textContent = art.title;

    const details = document.createElement("p");
    details.textContent = art.category + " • " +
      (art.is_published ? "Published" : "Hidden");

    const description = document.createElement("p");
    description.textContent = art.description || "";

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.textContent = "EDIT";

    editButton.addEventListener("click", async () => {
      const title = prompt("Artwork title:", art.title);
      if (title === null) return;

      const description = prompt("Artwork description:", art.description || "");
      if (description === null) return;

      const { error } = await supabase
        .from("gallery")
        .update({
          title: title.trim(),
          description: description.trim()
        })
        .eq("id", art.id);

      status(
        "galleryStatus",
        error ? "Edit failed: " + error.message : "Artwork updated!"
      );

      if (!error) await loadGallery();
    });

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.textContent = "DELETE";

    deleteButton.addEventListener("click", async () => {
      if (!confirm("Delete this artwork?")) return;

      const { error } = await supabase
        .from("gallery")
        .delete()
        .eq("id", art.id);

      status(
        "galleryStatus",
        error ? "Delete failed: " + error.message : "Artwork deleted!"
      );

      if (!error) await loadGallery();
    });

    item.append(heading, details, description, editButton, deleteButton);
    list.appendChild(item);
  });
}

// LOGOUT
$("logoutButton").addEventListener("click", async () => {
  await supabase.auth.signOut();
  showLogin();
  status("loginStatus", "You have logged out.");
});

// RESTORE EXISTING LOGIN SESSION
verifyAdmin();
