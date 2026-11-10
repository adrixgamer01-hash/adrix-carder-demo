
let currentFilter = "all";

function filterCards(type, button) {
  currentFilter = type;

  document.querySelectorAll(".filter").forEach(btn => {
    btn.classList.remove("active");
  });

  button.classList.add("active");
  searchCards();
}

function searchCards() {
  const search = document
    .getElementById("searchInput")
    .value.toLowerCase();

  const cards = document.querySelectorAll(".card");
  let visible = 0;

  cards.forEach(card => {
    const type = card.dataset.type;

    const matchesFilter =
      currentFilter === "all" || type === currentFilter;

    const matchesSearch =
      card.innerText.toLowerCase().includes(search);

    if (matchesFilter && matchesSearch) {
      card.style.display = "block";
      visible++;
    } else {
      card.style.display = "none";
    }
  });

  document.getElementById("emptyMessage").style.display =
    visible === 0 ? "block" : "none";
}

function openPreview(card) {
  const artwork = card.querySelector(".demo-card");

  document.getElementById("previewTitle").innerText =
    card.querySelector("h3").innerText;

  document.getElementById("previewDescription").innerText =
    card.querySelector("p").innerText;

  document.getElementById("previewArtwork").innerHTML =
    artwork.outerHTML;

  document.getElementById("preview").classList.add("show");
}

function closePreview() {
  document.getElementById("preview").classList.remove("show");
}

function closePreviewOutside(event) {
  if (event.target.id === "preview") {
    closePreview();
  }
}

document.addEventListener("keydown", function(event) {
  if (event.key === "Escape") {
    closePreview();
  }
});
