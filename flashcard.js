let flashcards = JSON.parse(localStorage.getItem("flashcards")) || [];
let filter = "all";
let isShuffling = false;
let deleteMode = false;

function saveFlashcards() {
  localStorage.setItem("flashcards", JSON.stringify(flashcards));
}

function addFlashcard() {
  const frontInput = document.getElementById("frontInput");
  const backInput = document.getElementById("backInput");
  const front = frontInput.value.trim();
  const back = backInput.value.trim();

  if (!front || !back) {
    alert("Enter both sides!");
    return;
  }

  const card = { id: Date.now(), front, back, mastered: false };
  flashcards.push(card);
  saveFlashcards();

  frontInput.value = "";
  backInput.value = "";
  render();
}

function toggleFlip(id) {
  if (isShuffling) return;
  if (deleteMode) return;
  document.getElementById("card-" + id).classList.toggle("flipped");
}

function toggleMastered(id) {
  const card = flashcards.find(c => c.id === id);
  if (!card) return;
  card.mastered = !card.mastered;
  saveFlashcards();
  render();
}

function setFilter(f) {
  filter = f;
  render();
}

function toggleDeleteMode() {
  deleteMode = !deleteMode;
  const btn = document.getElementById("deleteModeBtn");

  if (deleteMode) {
    btn.textContent = "Delete Mode: ON";
    document.body.classList.add("delete-mode");
  } else {
    btn.textContent = "Delete Mode: OFF";
    document.body.classList.remove("delete-mode");

    document
      .querySelectorAll(".selected-for-delete")
      .forEach(card => card.classList.remove("selected-for-delete"));
    document
      .querySelectorAll(".select-card")
      .forEach(cb => (cb.checked = false));
  }
}

function toggleSelectForDelete(id) {
  if (!deleteMode) return;
  const cardDiv = document.getElementById("card-" + id);
  const checkbox = cardDiv.querySelector(".select-card");
  const willSelect = !checkbox.checked;

  checkbox.checked = willSelect;
  if (willSelect) {
    cardDiv.classList.add("selected-for-delete");
  } else {
    cardDiv.classList.remove("selected-for-delete");
  }
}

function openDeleteConfirm() {
  if (!deleteMode) return;
  const checked = document.querySelectorAll(".select-card:checked");
  if (checked.length === 0) return;
  document.getElementById("confirmOverlay").style.display = "flex";
}

function closeDeleteConfirm() {
  document.getElementById("confirmOverlay").style.display = "none";
}

function confirmDelete() {
  const checked = document.querySelectorAll(".select-card:checked");
  if (checked.length === 0) {
    closeDeleteConfirm();
    return;
  }

  const idsToDelete = Array.from(checked).map(cb => Number(cb.dataset.id));

  flashcards = flashcards.filter(card => !idsToDelete.includes(card.id));
  saveFlashcards();
  closeDeleteConfirm();
  render();
}

function deleteAllCards() {
  if (!confirm("Delete ALL flashcards? This cannot be undone.")) return;
  flashcards = [];
  saveFlashcards();
  render();
}

function shuffleCards() {
  if (isShuffling) return;
  if (flashcards.length === 0) return;

  isShuffling = true;

  for (let i = flashcards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [flashcards[i], flashcards[j]] = [flashcards[j], flashcards[i]];
  }
  saveFlashcards();
  render();

  requestAnimationFrame(() => {
    const container = document.getElementById("flashcards");
    const cards = container.querySelectorAll(".card");

    const containerRect = container.getBoundingClientRect();
    const centerX = containerRect.left + containerRect.width / 2;
    const centerY = containerRect.top + containerRect.height / 2;

    cards.forEach(card => {
      const rect = card.getBoundingClientRect();
      const cardCenterX = rect.left + rect.width / 2;
      const cardCenterY = rect.top + rect.height / 2;

      const offsetX = centerX - cardCenterX;
      const offsetY = centerY - cardCenterY;

      card.classList.add("center-start");
      card.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
    });

    setTimeout(() => {
      cards.forEach((card, index) => {
        card.style.transform = "";
        card.classList.remove("center-start");
        card.classList.add("center-shuffle");
        const delay = (index * 100) % 500;
        card.style.animationDelay = `${delay}ms`;
      });

      setTimeout(() => {
        cards.forEach(card => {
          card.classList.remove("center-shuffle");
          card.style.animationDelay = "0ms";
        });

        requestAnimationFrame(() => {
          cards.forEach(card => {
            card.classList.add("spread");
            card.style.transform = "";
          });

          setTimeout(() => {
            cards.forEach(card => {
              card.classList.remove("spread");
              card.style.transform = "";
            });
            isShuffling = false;
          }, 400);
        });
      }, 2000);
    }, 400);
  });
}

function render() {
  const container = document.getElementById("flashcards");
  container.innerHTML = "";

  let list = flashcards;
  if (filter === "mastered") list = flashcards.filter(c => c.mastered);
  if (filter === "unmastered") list = flashcards.filter(c => !c.mastered);

  list.forEach(card => {
    const wrapper = document.createElement("div");
    wrapper.className = "flashcard";

    const cardDiv = document.createElement("div");
    cardDiv.className = "card";
    cardDiv.id = "card-" + card.id;
    if (card.mastered) cardDiv.classList.add("mastered");

    cardDiv.onclick = e => {
      if (deleteMode) {
        e.stopPropagation();
        toggleSelectForDelete(card.id);
      } else {
        toggleFlip(card.id);
      }
    };

    const frontDiv = document.createElement("div");
    frontDiv.className = "front";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "select-card";
    checkbox.dataset.id = card.id;
    checkbox.style.marginBottom = "6px";
    checkbox.onclick = e => {
      e.stopPropagation();
      toggleSelectForDelete(card.id);
    };

    const frontText = document.createElement("div");
    frontText.textContent = card.front;

    frontDiv.appendChild(checkbox);
    frontDiv.appendChild(frontText);

    const backDiv = document.createElement("div");
    backDiv.className = "back";
    backDiv.innerHTML = `
      <div>${card.back}</div>
      <button style="margin-top:10px;"
        onclick="event.stopPropagation(); toggleMastered(${card.id})">
        ${card.mastered ? "Unmaster" : "Mastered"}
      </button>
    `;

    cardDiv.appendChild(frontDiv);
    cardDiv.appendChild(backDiv);
    wrapper.appendChild(cardDiv);
    container.appendChild(wrapper);
  });
}

function loadEasySet() {
  const baseId = Date.now();

  flashcards = [
    { id: baseId + 1,  front: "2 + 2 = ?",           back: "4",                 mastered: false },
    { id: baseId + 2,  front: "Capital of France?",  back: "Paris",             mastered: false },
    { id: baseId + 3,  front: "3 × 3 = ?",           back: "9",                 mastered: false },
    { id: baseId + 4,  front: "Opposite of hot?",    back: "Cold",              mastered: false },
    { id: baseId + 5,  front: "Color of the sky?",   back: "Blue (clear day)",  mastered: false },
    { id: baseId + 6,  front: "5 − 2 = ?",           back: "3",                 mastered: false },
    { id: baseId + 7,  front: "1 week = ? days",     back: "7 days",            mastered: false },
    { id: baseId + 8,  front: "Largest planet?",     back: "Jupiter",           mastered: false },
    { id: baseId + 9,  front: "H₂O is called?",      back: "Water",             mastered: false },
    { id: baseId + 10, front: "Square has ? sides",  back: "4 sides",           mastered: false },
    { id: baseId + 11, front: "Sun rises in the?",   back: "East",              mastered: false },
    { id: baseId + 12, front: "Primary colors?",     back: "Red, blue, yellow", mastered: false },
    { id: baseId + 13, front: "5 + 7 = ?",           back: "12",                mastered: false },
    { id: baseId + 14, front: "Our galaxy name?",    back: "Milky Way",         mastered: false },
    { id: baseId + 15, front: "Triangle has ? sides", back: "3 sides",          mastered: false },
    { id: baseId + 16, front: "Planet we live on?",  back: "Earth",             mastered: false },
    { id: baseId + 17, front: "First day of week?",  back: "Monday (common)",   mastered: false },
    { id: baseId + 18, front: "10 ÷ 2 = ?",          back: "5",                 mastered: false },
    { id: baseId + 19, front: "Opposite of big?",    back: "Small",             mastered: false },
    { id: baseId + 20, front: "Dog says?",           back: "Bark",              mastered: false }
  ];

  saveFlashcards();
  render();
}

render();
