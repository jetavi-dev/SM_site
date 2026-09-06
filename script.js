const yesButton = document.getElementById("yesButton");
const noButton = document.getElementById("noButton");
const hint = document.getElementById("hint");
const success = document.getElementById("success");

let yesScale = 1;
let noAttempts = 0;
let timer;

// --------------------------------------------------
// YES BUTTON
// --------------------------------------------------

yesButton.addEventListener("click", () => {

    success.classList.remove("hidden");

    hint.textContent = "Good answer. I knew you were reasonable. ❤️";

    yesButton.style.display = "none";
    noButton.style.display = "none";

    // Little celebration
    document.body.style.backgroundColor = "#ff6fa3";
});


// --------------------------------------------------
// NO BUTTON
// --------------------------------------------------

noButton.addEventListener("click", () => {

    noAttempts++;

    // Make YES grow
    growYesButton();

    // Move the NO button
    dodgeNoButton();

    updateHint();
});


// --------------------------------------------------
// MAKE YES BUTTON GROW
// --------------------------------------------------

function growYesButton() {

    yesScale += 0.12;

    yesButton.style.transform = `scale(${yesScale})`;

    // Eventually make it ridiculously obvious
    if (yesScale >= 2) {
        yesButton.textContent = "YES ❤️";
    }

    if (yesScale >= 3) {
        yesButton.textContent = "YES PLEASE ❤️";
    }
}


// --------------------------------------------------
// MAKE NO BUTTON DODGE
// --------------------------------------------------

function dodgeNoButton() {

    const card = document.querySelector(".card");

    const cardRect = card.getBoundingClientRect();
    const buttonRect = noButton.getBoundingClientRect();

    const maxX = Math.max(
        10,
        cardRect.width - buttonRect.width - 20
    );

    const maxY = 120;

    const x = Math.random() * maxX - maxX / 2;
    const y = Math.random() * maxY - maxY / 2;

    noButton.style.transform = `translate(${x}px, ${y}px)`;
}


// --------------------------------------------------
// HINT TEXT
// --------------------------------------------------

function updateHint() {

    const messages = [
        "Are you sure? 🤨",
        "That's not the button you want...",
        "Sarah...",
        "Sarah with an H...",
        "Come on now. 🌹",
        "I literally asked nicely.",
        "The YES button is getting bigger...",
        "You are making this harder than it needs to be.",
        "I think the website has made its decision.",
        "Okay, now you're just being difficult 😂"
    ];

    const index = Math.min(
        noAttempts - 1,
        messages.length - 1
    );

    hint.textContent = messages[index];
}


// --------------------------------------------------
// MAKE YES GROW EVERY FEW SECONDS
// --------------------------------------------------

timer = setInterval(() => {

    // Only grow while the question is still active
    if (!success.classList.contains("hidden")) {
        clearInterval(timer);
        return;
    }

    growYesButton();

}, 4000);
