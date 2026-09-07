/* =========================================================
   SARAH'S THAILAND ADVENTURE
   Main application
   ========================================================= */

let travelData = {
    locations: [],
    diary: [],
    posts: [],
    photos: []
};

let map = null;

let locationMarkers = {};

let selectedCoordinates = null;

let editorMode = false;


/* =========================================================
   INITIALIZATION
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    initializeMap();

    setupEditor();

    setupPrintButton();

    loadTravelData();

});


/* =========================================================
   MAP
   ========================================================= */

function initializeMap() {

    map = L.map("map").setView(
        [15.8700, 100.9925],
        6
    );


    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            attribution:
                '&copy; OpenStreetMap contributors',

            maxZoom: 19
        }
    ).addTo(map);


    map.on("click", event => {

        if (!editorMode) {
            return;
        }

        selectedCoordinates = {
            lat: event.latlng.lat,
            lng: event.latlng.lng
        };


        const coordinates =
            document.getElementById(
                "selectedCoordinates"
            );

        if (coordinates) {

            coordinates.textContent =
                `LAT ${event.latlng.lat.toFixed(6)} / ` +
                `LNG ${event.latlng.lng.toFixed(6)}`;

        }

    });

}


/* =========================================================
   LOAD DATA
   ========================================================= */

async function loadTravelData() {

    try {

        const response = await fetch(
            `${CONFIG.dataFile}?t=${Date.now()}`
        );


        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status}`
            );

        }


        travelData = await response.json();


        travelData.locations =
            travelData.locations || [];

        travelData.diary =
            travelData.diary || [];

        travelData.posts =
            travelData.posts || [];

        travelData.photos =
            travelData.photos || [];


        renderEverything();


    } catch (error) {

        console.error(
            "[travel] Could not load travel data:",
            error
        );


        alert(
            "Could not load travel data."
        );

    }

}


/* =========================================================
   RENDER EVERYTHING
   ========================================================= */

function renderEverything() {

    renderLocations();

    renderDiary();

    renderPosts();

    renderPhotos();

    populateLocationSelects();

}


/* =========================================================
   LOCATIONS
   ========================================================= */

function renderLocations() {

    if (!map) return;


    Object.values(locationMarkers).forEach(
        marker => marker.remove()
    );


    locationMarkers = {};


    travelData.locations.forEach(location => {

        if (
            !Number.isFinite(Number(location.lat)) ||
            !Number.isFinite(Number(location.lng))
        ) {
            return;
        }


        const isCurrent =
            location.current === true;


        const marker =
            L.circleMarker(
                [
                    Number(location.lat),
                    Number(location.lng)
                ],
                {
                    radius:
                        isCurrent ? 11 : 7,

                    className:
                        isCurrent
                            ? "current-marker"
                            : "history-marker",

                    fillOpacity: 1,

                    weight: 3
                }
            ).addTo(map);


        marker.bindTooltip(
            escapeHtml(location.name),
            {
                direction: "top"
            }
        );


        marker.on(
            "click",
            () => showLocation(location.id)
        );


        locationMarkers[location.id] =
            marker;

    });

}


/* =========================================================
   SHOW LOCATION
   ========================================================= */

function showLocation(locationId) {

    const location =
        travelData.locations.find(
            item => item.id === locationId
        );


    if (!location) {
        return;
    }


    const container =
        document.getElementById(
            "locationDetails"
        );


    if (!container) {
        return;
    }


    const diary =
        travelData.diary.filter(
            entry =>
                entry.locationId === locationId
        );


    const posts =
        travelData.posts.filter(
            post =>
                post.locationId === locationId
        );


    const photos =
        travelData.photos.filter(
            photo =>
                photo.locationId === locationId
        );


    container.classList.remove("hidden");


    container.innerHTML = `

        <div class="location-detail-header">

            <div>

                <div class="location-label">
                    ${location.current ? "CURRENT LOCATION" : "VISITED"}
                </div>

                <h2>
                    ${escapeHtml(location.name)}
                </h2>

                ${
                    location.date
                        ? `
                            <div class="location-date">
                                ${formatDate(location.date)}
                            </div>
                        `
                        : ""
                }

            </div>

            <button
                class="close-location"
                onclick="closeLocation()"
            >
                ×
            </button>

        </div>


        ${
            location.description
                ? `
                    <p class="location-description">
                        ${escapeHtml(location.description)}
                    </p>
                `
                : ""
        }


        <div class="location-summary">

            <span>
                📔 ${diary.length} diary
            </span>

            <span>
                ✎ ${posts.length} posts
            </span>

            <span>
                📷 ${photos.length} photos
            </span>

        </div>

    `;


    container.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

}


function closeLocation() {

    const container =
        document.getElementById(
            "locationDetails"
        );


    if (container) {
        container.classList.add("hidden");
    }

}


/* =========================================================
   DIARY
   ========================================================= */

function renderDiary() {

    const container =
        document.getElementById(
            "diaryList"
        );


    if (!container) return;


    const diary =
        [...travelData.diary]
            .sort(
                (a, b) =>
                    String(a.date || "")
                        .localeCompare(
                            String(b.date || "")
                        )
            );


    if (!diary.length) {

        container.innerHTML = `
            <div class="empty-state">
                No diary entries yet...
            </div>
        `;

        return;
    }


    container.innerHTML =
        diary.map(entry => {

            const location =
                getLocation(
                    entry.locationId
                );


            return `

                <article class="diary-card">

                    <div class="entry-date">
                        ${formatDate(entry.date)}
                    </div>

                    <h3>
                        ${escapeHtml(entry.title)}
                    </h3>

                    <div class="entry-text">
                        ${escapeHtml(entry.text)
                            .replace(/\n/g, "<br>")}
                    </div>


                    ${
                        location
                            ? `
                                <button
                                    class="location-link"
                                    onclick="showLocation('${escapeHtml(location.id)}')"
                                >
                                    📍 ${escapeHtml(location.name)}
                                </button>
                            `
                            : ""
                    }

                </article>

            `;

        }).join("");

}


/* =========================================================
   POSTS
   ========================================================= */

function renderPosts() {

    const container =
        document.getElementById(
            "postList"
        );


    if (!container) return;


    const posts =
        [...travelData.posts]
            .sort(
                (a, b) =>
                    String(a.date || "")
                        .localeCompare(
                            String(b.date || "")
                        )
            );


    if (!posts.length) {

        container.innerHTML = `
            <div class="empty-state">
                No posts yet...
            </div>
        `;

        return;
    }


    container.innerHTML =
        posts.map(post => {

            const location =
                getLocation(
                    post.locationId
                );


            return `

                <article class="post-card">

                    ${
                        post.date
                            ? `
                                <div class="entry-date">
                                    ${formatDate(post.date)}
                                </div>
                            `
                            : ""
                    }

                    <h3>
                        ${escapeHtml(post.title)}
                    </h3>

                    <div class="entry-text">
                        ${escapeHtml(post.text)
                            .replace(/\n/g, "<br>")}
                    </div>


                    ${
                        location
                            ? `
                                <button
                                    class="location-link"
                                    onclick="showLocation('${escapeHtml(location.id)}')"
                                >
                                    📍 ${escapeHtml(location.name)}
                                </button>
                            `
                            : ""
                    }

                </article>

            `;

        }).join("");

}


/* =========================================================
   PHOTOS
   ========================================================= */

function renderPhotos() {

    const container =
        document.getElementById(
            "photoGrid"
        );


    if (!container) return;


    if (!travelData.photos.length) {

        container.innerHTML = `
            <div class="empty-state">
                No photos yet...
            </div>
        `;

        return;
    }


    container.innerHTML =
        travelData.photos.map(photo => {

            const location =
                getLocation(
                    photo.locationId
                );


            return `

                <figure class="photo-card">

                    <img
                        src="${escapeHtml(photo.url)}"
                        alt="${escapeHtml(
                            photo.caption ||
                            "Thailand photo"
                        )}"
                        loading="lazy"
                    >

                    ${
                        photo.caption
                            ? `
                                <figcaption>
                                    ${escapeHtml(photo.caption)}
                                </figcaption>
                            `
                            : ""
                    }


                    ${
                        location
                            ? `
                                <button
                                    class="location-link"
                                    onclick="showLocation('${escapeHtml(location.id)}')"
                                >
                                    📍 ${escapeHtml(location.name)}
                                </button>
                            `
                            : ""
                    }

                </figure>

            `;

        }).join("");

}


/* =========================================================
   LOCATION SELECTS
   ========================================================= */

function populateLocationSelects() {

    const selects = [
        "diaryLocation",
        "postLocation",
        "photoLocation"
    ];


    selects.forEach(selectId => {

        const select =
            document.getElementById(
                selectId
            );


        if (!select) return;


        select.innerHTML = `
            <option value="">
                -- Select location --
            </option>
        `;


        travelData.locations.forEach(
            location => {

                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    location.id;

                option.textContent =
                    location.name;

                select.appendChild(
                    option
                );

            }
        );

    });

}


/* =========================================================
   EDITOR
   ========================================================= */

function setupEditor() {

    const toggle =
        document.getElementById(
            "editorToggle"
        );


    if (toggle) {

        toggle.addEventListener(
            "click",
            () => {

                const panel =
                    document.getElementById(
                        "editorPanel"
                    );

                if (!panel) return;

                panel.classList.toggle(
                    "hidden"
                );

            }
        );

    }


    const loginButton =
        document.getElementById(
            "editorLoginButton"
        );


    if (loginButton) {

        loginButton.addEventListener(
            "click",
            loginEditor
        );

    }


    document
        .querySelectorAll(".editor-tab")
        .forEach(tab => {

            tab.addEventListener(
                "click",
                () => {

                    activateEditorTab(
                        tab.dataset.tab
                    );

                }
            );

        });


    const saveLocation =
        document.getElementById(
            "saveLocationButton"
        );


    if (saveLocation) {

        saveLocation.addEventListener(
            "click",
            saveLocationData
        );

    }


    const saveDiary =
        document.getElementById(
            "saveDiaryButton"
        );


    if (saveDiary) {

        saveDiary.addEventListener(
            "click",
            saveDiaryData
        );

    }


    const savePost =
        document.getElementById(
            "savePostButton"
        );


    if (savePost) {

        savePost.addEventListener(
            "click",
            savePostData
        );

    }


    const uploadPhoto =
        document.getElementById(
            "uploadPhotoButton"
        );


    if (uploadPhoto) {

        uploadPhoto.addEventListener(
            "click",
            uploadPhotoData
        );

    }

}


function activateEditorTab(tabName) {

    document
        .querySelectorAll(".editor-tab")
        .forEach(tab => {

            tab.classList.toggle(
                "active",
                tab.dataset.tab === tabName
            );

        });


    document
        .querySelectorAll(
            ".editor-tab-content"
        )
        .forEach(content => {

            content.classList.toggle(
                "active",
                content.id ===
                    `tab-${tabName}`
            );

        });

}


/* =========================================================
   LOGIN
   ========================================================= */

function loginEditor() {

    const password =
        document.getElementById(
            "editorPassword"
        )?.value || "";


    /*
     * IMPORTANT:
     * This is only a UI gate.
     *
     * A password stored in public JavaScript is NOT secure.
     *
     * For the current GitHub-only version this is intentionally
     * simple. A future production version should use GitHub
     * OAuth / GitHub App authentication.
     */

    const EDITOR_PASSWORD =
        "Sarah1234";


    const message =
        document.getElementById(
            "loginMessage"
        );


    if (password === EDITOR_PASSWORD) {

        editorMode = true;


        document
            .getElementById(
                "editorContent"
            )
            ?.classList.remove(
                "hidden"
            );


        document
            .querySelector(
                ".editor-login"
            )
            ?.classList.add(
                "hidden"
            );


        message.textContent =
            "EDITOR MODE ENABLED ✓";


        if (map) {

            map.getContainer()
                .classList.add(
                    "editor-map"
                );

        }

    } else {

        message.textContent =
            "Wrong password.";

    }

}


/* =========================================================
   SAVE LOCATION
   ========================================================= */

async function saveLocationData() {

    if (!editorMode) {
        return;
    }


    if (!selectedCoordinates) {

        alert(
            "Click on the map first to select the location."
        );

        return;
    }


    const name =
        document.getElementById(
            "locationName"
        ).value.trim();


    const description =
        document.getElementById(
            "locationDescription"
        ).value.trim();


    const date =
        document.getElementById(
            "locationDate"
        ).value;


    if (!name) {

        alert(
            "Please enter a location name."
        );

        return;
    }


    /*
     * Only one location is considered current.
     */
    travelData.locations.forEach(
        location => {
            location.current = false;
        }
    );


    const location = {

        id:
            createId(
                name
            ),

        name,

        lat:
            selectedCoordinates.lat,

        lng:
            selectedCoordinates.lng,

        description,

        date,

        current: true

    };


    travelData.locations.push(
        location
    );


    await saveTravelData();


    document.getElementById(
        "locationName"
    ).value = "";


    document.getElementById(
        "locationDescription"
    ).value = "";


    document.getElementById(
        "locationDate"
    ).value = "";


    selectedCoordinates = null;


    document.getElementById(
        "selectedCoordinates"
    ).textContent =
        "No coordinates selected.";


    alert(
        "Location saved."
    );

}


/* =========================================================
   SAVE DIARY
   ========================================================= */

async function saveDiaryData() {

    if (!editorMode) return;


    const date =
        document.getElementById(
            "diaryDate"
        ).value;


    const title =
        document.getElementById(
            "diaryTitle"
        ).value.trim();


    const text =
        document.getElementById(
            "diaryText"
        ).value.trim();


    const locationId =
        document.getElementById(
            "diaryLocation"
        ).value;


    if (!date || !title || !text) {

        alert(
            "Please fill in date, title and entry."
        );

        return;
    }


    travelData.diary.push({

        id:
            createId(
                title
            ),

        date,

        title,

        text,

        locationId:
            locationId || null

    });


    await saveTravelData();


    document.getElementById(
        "diaryDate"
    ).value = "";


    document.getElementById(
        "diaryTitle"
    ).value = "";


    document.getElementById(
        "diaryText"
    ).value = "";


    alert(
        "Diary entry saved."
    );

}


/* =========================================================
   SAVE POST
   ========================================================= */

async function savePostData() {

    if (!editorMode) return;


    const date =
        document.getElementById(
            "postDate"
        ).value;


    const title =
        document.getElementById(
            "postTitle"
        ).value.trim();


    const text =
        document.getElementById(
            "postText"
        ).value.trim();


    const locationId =
        document.getElementById(
            "postLocation"
        ).value;


    if (!title || !text) {

        alert(
            "Please fill in title and post."
        );

        return;
    }


    travelData.posts.push({

        id:
            createId(
                title
            ),

        date,

        title,

        text,

        locationId:
            locationId || null

    });


    await saveTravelData();


    document.getElementById(
        "postDate"
    ).value = "";


    document.getElementById(
        "postTitle"
    ).value = "";


    document.getElementById(
        "postText"
    ).value = "";


    alert(
        "Post published."
    );

}


/* =========================================================
   UPLOAD PHOTO
   ========================================================= */

async function uploadPhotoData() {

    if (!editorMode) return;


    const fileInput =
        document.getElementById(
            "photoFile"
        );


    const file =
        fileInput.files[0];


    if (!file) {

        alert(
            "Please select a photo."
        );

        return;
    }


    const caption =
        document.getElementById(
            "photoCaption"
        ).value.trim();


    const date =
        document.getElementById(
            "photoDate"
        ).value;


    const locationId =
        document.getElementById(
            "photoLocation"
        ).value;


    const status =
        document.getElementById(
            "uploadStatus"
        );


    status.textContent =
        "Preparing upload...";


    try {

        const base64 =
            await fileToBase64(
                file
            );


        const safeName =
            sanitizeFilename(
                file.name
            );


        const filename =
            `${Date.now()}-${safeName}`;


        const path =
            `photos/${filename}`;


        status.textContent =
            "Uploading photo...";


        await githubPutFile(
            path,
            base64,
            `Add photo: ${filename}`,
            true
        );


        /*
         * GitHub Pages URL.
         */
        const photoUrl =
            `https://${CONFIG.owner}.github.io/` +
            `${CONFIG.repo}/${path}`;


        travelData.photos.push({

            id:
                createId(
                    filename
                ),

            date,

            url:
                photoUrl,

            path,

            caption,

            locationId:
                locationId || null

        });


        status.textContent =
            "Saving journal data...";


        await saveTravelData();


        fileInput.value = "";


        document.getElementById(
            "photoCaption"
        ).value = "";


        document.getElementById(
            "photoDate"
        ).value = "";


        status.textContent =
            "Photo uploaded ✓";


    } catch (error) {

        console.error(
            "[photo] Upload failed:",
            error
        );


        status.textContent =
            `Upload failed: ${error.message}`;

    }

}


/* =========================================================
   SAVE TRAVEL.JSON TO GITHUB
   ========================================================= */

async function saveTravelData() {

    const contents =
        JSON.stringify(
            travelData,
            null,
            2
        );


    const base64 =
        btoa(
            unescape(
                encodeURIComponent(
                    contents
                )
            )
        );


    await githubPutFile(
        CONFIG.dataFile,
        base64,
        "Update travel journal",
        false
    );


    renderEverything();

}


/* =========================================================
   GITHUB API
   ========================================================= */

async function githubPutFile(
    path,
    base64Content,
    message,
    contentAlreadyBase64 = true
) {

    const token =
        await requireToken();


    const url =
        `https://api.github.com/repos/` +
        `${CONFIG.owner}/` +
        `${CONFIG.repo}/contents/${path}`;


    /*
     * Get existing file SHA if the file already exists.
     */
    let sha = null;


    const existingResponse =
        await fetch(
            `${url}?ref=${CONFIG.branch}`,
            {
                headers: {
                    Authorization:
                        `Bearer ${token}`,

                    Accept:
                        "application/vnd.github+json"
                }
            }
        );


    if (existingResponse.ok) {

        const existing =
            await existingResponse.json();

        sha = existing.sha;

    }


    const body = {

        message,

        content:
            contentAlreadyBase64
                ? base64Content
                : base64Content,

        branch:
            CONFIG.branch

    };


    if (sha) {
        body.sha = sha;
    }


    const response =
        await fetch(
            url,
            {
                method: "PUT",

                headers: {

                    Authorization:
                        `Bearer ${token}`,

                    Accept:
                        "application/vnd.github+json",

                    "Content-Type":
                        "application/json"

                },

                body:
                    JSON.stringify(body)

            }
        );


    if (!response.ok) {

        const text =
            await response.text();


        throw new Error(
            `GitHub API error ${response.status}: ${text}`
        );

    }


    return response.json();

}


/* =========================================================
   GITHUB TOKEN
   ========================================================= */

async function requireToken() {

    let token =
        sessionStorage.getItem(
            "sarah_github_token"
        );


    if (token) {
        return token;
    }


    token =
        prompt(
            "Enter your GitHub fine-grained token:"
        );


    if (!token) {

        throw new Error(
            "GitHub token required."
        );

    }


    sessionStorage.setItem(
        "sarah_github_token",
        token.trim()
    );


    return token.trim();

}


/* =========================================================
   PRINT JOURNAL
   ========================================================= */

function setupPrintButton() {

    const button =
        document.getElementById(
            "printJournalButton"
        );


    if (!button) return;


    button.addEventListener(
        "click",
        printJournal
    );

}


async function printJournal() {

    const container =
        document.getElementById(
            "printJournal"
        );


    if (!container) {

        console.error(
            "[print] Print container missing."
        );

        return;
    }


    if (
        !travelData ||
        !travelData.locations
    ) {

        alert(
            "The travel journal has not finished loading yet."
        );

        return;
    }


    container.innerHTML =
        buildPrintJournal();


    container.classList.add(
        "print-journal-active"
    );


    container.setAttribute(
        "aria-hidden",
        "false"
    );


    /*
     * Give the browser time to render the generated content.
     */
    await new Promise(
        resolve =>
            requestAnimationFrame(
                resolve
            )
    );


    await waitForPrintImages(
        container
    );


    /*
     * Extra rendering delay, especially useful on mobile.
     */
    await new Promise(
        resolve =>
            setTimeout(
                resolve,
                150
            )
    );


    window.print();

}


window.addEventListener(
    "afterprint",
    () => {

        const container =
            document.getElementById(
                "printJournal"
            );


        if (!container) return;


        container.classList.remove(
            "print-journal-active"
        );


        container.setAttribute(
            "aria-hidden",
            "true"
        );

    }
);


/* =========================================================
   PRINT JOURNAL HTML
   ========================================================= */

function buildPrintJournal() {

    const locations =
        [...(travelData.locations || [])]
            .sort(
                (a, b) =>
                    String(a.date || "")
                        .localeCompare(
                            String(b.date || "")
                        )
            );


    const diary =
        [...(travelData.diary || [])]
            .sort(
                (a, b) =>
                    String(a.date || "")
                        .localeCompare(
                            String(b.date || "")
                        )
            );


    const posts =
        [...(travelData.posts || [])]
            .sort(
                (a, b) =>
                    String(a.date || "")
                        .localeCompare(
                            String(b.date || "")
                        )
            );


    const photos =
        [...(travelData.photos || [])];


    const firstDate =
        locations.find(
            location => location.date
        )?.date ||
        diary.find(
            entry => entry.date
        )?.date ||
        "";


    const lastDate =
        [...locations]
            .reverse()
            .find(
                location => location.date
            )?.date ||
        [...diary]
            .reverse()
            .find(
                entry => entry.date
            )?.date ||
        "";


    let html = `

        <div class="journal-page journal-cover">

            <div class="journal-cover-inner">

                <div class="journal-eyebrow">
                    SARAH.EXE // TRAVEL LOG
                </div>


                <h1>
                    Sarah's<br>
                    Thailand<br>
                    Adventure
                </h1>


                <div class="journal-route-title">
                    Bangkok → North Thailand
                </div>


                ${
                    firstDate
                        ? `
                            <div class="journal-dates">
                                ${formatJournalDate(firstDate)}

                                ${
                                    lastDate &&
                                    lastDate !== firstDate
                                        ? `
                                            —
                                            ${formatJournalDate(
                                                lastDate
                                            )}
                                        `
                                        : ""
                                }
                            </div>
                        `
                        : ""
                }


                <div class="journal-cover-decoration">
                    ✦ ✈ ✦
                </div>


                <p class="journal-cover-note">
                    A little collection of places,
                    stories, adventures and memories.
                </p>

            </div>

        </div>


        <div class="journal-page journal-overview">

            <div class="journal-section-label">
                CHAPTER 01
            </div>


            <h2>
                The Journey
            </h2>


            <p class="journal-intro">
                Every place, note, story and photo
                from Sarah's Thailand adventure.
            </p>


            <div class="journal-stat-grid">

                <div class="journal-stat">
                    <strong>
                        ${locations.length}
                    </strong>

                    <span>
                        LOCATIONS
                    </span>
                </div>


                <div class="journal-stat">
                    <strong>
                        ${diary.length}
                    </strong>

                    <span>
                        DIARY ENTRIES
                    </span>
                </div>


                <div class="journal-stat">
                    <strong>
                        ${posts.length}
                    </strong>

                    <span>
                        POSTS
                    </span>
                </div>


                <div class="journal-stat">
                    <strong>
                        ${photos.length}
                    </strong>

                    <span>
                        PHOTOS
                    </span>
                </div>

            </div>


            ${buildPrintableRouteMap(
                locations
            )}

        </div>

    `;


    /*
     * Locations
     */

    if (locations.length) {

        html += `

            <div class="journal-page-break"></div>

            <section class="journal-section">

                <div class="journal-section-label">
                    CHAPTER 02
                </div>

                <h2>
                    Places Along The Way
                </h2>

        `;


        locations.forEach(
            (location, index) => {

                const locationDiary =
                    diary.filter(
                        entry =>
                            entry.locationId ===
                            location.id
                    );


                const locationPosts =
                    posts.filter(
                        post =>
                            post.locationId ===
                            location.id
                    );


                const locationPhotos =
                    photos.filter(
                        photo =>
                            photo.locationId ===
                            location.id
                    );


                html += `

                    <article
                        class="journal-location"
                    >

                        <div
                            class="journal-location-heading"
                        >

                            <div
                                class="journal-location-number"
                            >
                                ${String(
                                    index + 1
                                ).padStart(
                                    2,
                                    "0"
                                )}
                            </div>


                            <div>

                                <h3>
                                    ${escapeHtml(
                                        location.name
                                    )}
                                </h3>


                                ${
                                    location.date
                                        ? `
                                            <div class="journal-date">
                                                ${formatJournalDate(
                                                    location.date
                                                )}
                                            </div>
                                        `
                                        : ""
                                }

                            </div>

                        </div>


                        ${
                            location.description
                                ? `
                                    <p class="journal-location-description">
                                        ${escapeHtml(
                                            location.description
                                        )}
                                    </p>
                                `
                                : ""
                        }

                `;


                /*
                 * Diary
                 */

                if (locationDiary.length) {

                    html += `
                        <div class="journal-subheading">
                            DIARY
                        </div>
                    `;


                    locationDiary.forEach(
                        entry => {

                            html += `

                                <article
                                    class="journal-entry"
                                >

                                    ${
                                        entry.date
                                            ? `
                                                <div class="journal-entry-date">
                                                    ${formatJournalDate(
                                                        entry.date
                                                    )}
                                                </div>
                                            `
                                            : ""
                                    }


                                    <h4>
                                        ${escapeHtml(
                                            entry.title
                                        )}
                                    </h4>


                                    <div class="journal-entry-text">
                                        ${escapeHtml(
                                            entry.text
                                        ).replace(
                                            /\n/g,
                                            "<br>"
                                        )}
                                    </div>

                                </article>

                            `;

                        }
                    );

                }


                /*
                 * Posts
                 */

                if (locationPosts.length) {

                    html += `
                        <div class="journal-subheading">
                            POSTS
                        </div>
                    `;


                    locationPosts.forEach(
                        post => {

                            html += `

                                <article
                                    class="journal-post"
                                >

                                    ${
                                        post.date
                                            ? `
                                                <div class="journal-entry-date">
                                                    ${formatJournalDate(
                                                        post.date
                                                    )}
                                                </div>
                                            `
                                            : ""
                                    }


                                    <h4>
                                        ${escapeHtml(
                                            post.title
                                        )}
                                    </h4>


                                    <div class="journal-entry-text">
                                        ${escapeHtml(
                                            post.text
                                        ).replace(
                                            /\n/g,
                                            "<br>"
                                        )}
                                    </div>

                                </article>

                            `;

                        }
                    );

                }


                /*
                 * Photos
                 */

                if (locationPhotos.length) {

                    html += `

                        <div class="journal-subheading">
                            PHOTOS
                        </div>


                        <div class="journal-photo-grid">

                    `;


                    locationPhotos.forEach(
                        photo => {

                            if (!photo.url) {
                                return;
                            }


                            html += `

                                <figure
                                    class="journal-photo"
                                >

                                    <img
                                        src="${escapeHtml(
                                            photo.url
                                        )}"
                                        alt="${escapeHtml(
                                            photo.caption ||
                                            location.name
                                        )}"
                                    >


                                    ${
                                        photo.caption
                                            ? `
                                                <figcaption>
                                                    ${escapeHtml(
                                                        photo.caption
                                                    )}
                                                </figcaption>
                                            `
                                            : ""
                                    }

                                </figure>

                            `;

                        }
                    );


                    html += `
                        </div>
                    `;

                }


                html += `
                    </article>
                `;

            }
        );


        html += `
            </section>
        `;

    }


    /*
     * Unlinked diary
     */

    const unlinkedDiary =
        diary.filter(
            entry =>
                !getLocation(
                    entry.locationId
                )
        );


    if (unlinkedDiary.length) {

        html += `

            <div class="journal-page-break"></div>

            <section class="journal-section">

                <div class="journal-section-label">
                    CHAPTER 03
                </div>

                <h2>
                    Diary
                </h2>

        `;


        unlinkedDiary.forEach(
            entry => {

                html += `

                    <article
                        class="journal-entry"
                    >

                        ${
                            entry.date
                                ? `
                                    <div class="journal-entry-date">
                                        ${formatJournalDate(
                                            entry.date
                                        )}
                                    </div>
                                `
                                : ""
                        }


                        <h4>
                            ${escapeHtml(
                                entry.title
                            )}
                        </h4>


                        <div class="journal-entry-text">
                            ${escapeHtml(
                                entry.text
                            ).replace(
                                /\n/g,
                                "<br>"
                            )}
                        </div>

                    </article>

                `;

            }
        );


        html += `
            </section>
        `;

    }


    /*
     * Unlinked posts
     */

    const unlinkedPosts =
        posts.filter(
            post =>
                !getLocation(
                    post.locationId
                )
        );


    if (unlinkedPosts.length) {

        html += `

            <div class="journal-page-break"></div>

            <section class="journal-section">

                <div class="journal-section-label">
                    CHAPTER 04
                </div>

                <h2>
                    Posts
                </h2>

        `;


        unlinkedPosts.forEach(
            post => {

                html += `

                    <article
                        class="journal-post"
                    >

                        ${
                            post.date
                                ? `
                                    <div class="journal-entry-date">
                                        ${formatJournalDate(
                                            post.date
                                        )}
                                    </div>
                                `
                                : ""
                        }


                        <h4>
                            ${escapeHtml(
                                post.title
                            )}
                        </h4>


                        <div class="journal-entry-text">
                            ${escapeHtml(
                                post.text
                            ).replace(
                                /\n/g,
                                "<br>"
                            )}
                        </div>

                    </article>

                `;

            }
        );


        html += `
            </section>
        `;

    }


    /*
     * Unlinked photos
     */

    const unlinkedPhotos =
        photos.filter(
            photo =>
                !getLocation(
                    photo.locationId
                )
        );


    if (unlinkedPhotos.length) {

        html += `

            <div class="journal-page-break"></div>

            <section class="journal-section">

                <div class="journal-section-label">
                    CHAPTER 05
                </div>

                <h2>
                    Other Photos
                </h2>


                <div class="journal-photo-grid">

        `;


        unlinkedPhotos.forEach(
            photo => {

                if (!photo.url) {
                    return;
                }


                html += `

                    <figure
                        class="journal-photo"
                    >

                        <img
                            src="${escapeHtml(
                                photo.url
                            )}"
                            alt="${escapeHtml(
                                photo.caption ||
                                "Thailand photo"
                            )}"
                        >


                        ${
                            photo.caption
                                ? `
                                    <figcaption>
                                        ${escapeHtml(
                                            photo.caption
                                        )}
                                    </figcaption>
                                `
                                : ""
                        }

                    </figure>

                `;

            }
        );


        html += `

                </div>

            </section>

        `;

    }


    /*
     * Ending
     */

    html += `

        <div
            class="journal-page journal-ending"
        >

            <div class="journal-ending-inner">

                <div class="journal-ending-symbol">
                    ✦
                </div>


                <h2>
                    Trip Complete
                </h2>


                <p>
                    Bangkok → North Thailand
                </p>


                <div class="journal-ending-heart">
                    ♥
                </div>


                <div class="journal-ending-small">
                    END OF TRAVEL LOG
                </div>

            </div>

        </div>

    `;


    return html;

}


/* =========================================================
   PRINT ROUTE MAP
   ========================================================= */

function buildPrintableRouteMap(
    locations
) {

    if (!locations.length) {

        return `
            <div class="print-map-empty">
                No locations have been added yet.
            </div>
        `;

    }


    const validLocations =
        locations.filter(
            location =>
                Number.isFinite(
                    Number(location.lat)
                ) &&
                Number.isFinite(
                    Number(location.lng)
                )
        );


    if (!validLocations.length) {

        return `
            <div class="print-map-empty">
                No mapped locations available.
            </div>
        `;

    }


    const width = 1000;
    const height = 560;
    const padding = 80;


    let minLng =
        Math.min(
            ...validLocations.map(
                location =>
                    Number(location.lng)
            )
        );


    let maxLng =
        Math.max(
            ...validLocations.map(
                location =>
                    Number(location.lng)
            )
        );


    let minLat =
        Math.min(
            ...validLocations.map(
                location =>
                    Number(location.lat)
            )
        );


    let maxLat =
        Math.max(
            ...validLocations.map(
                location =>
                    Number(location.lat)
            )
        );


    if (minLng === maxLng) {

        minLng -= 1;
        maxLng += 1;

    }


    if (minLat === maxLat) {

        minLat -= 1;
        maxLat += 1;

    }


    const lngPadding =
        (maxLng - minLng) * 0.12;


    const latPadding =
        (maxLat - minLat) * 0.12;


    minLng -= lngPadding;
    maxLng += lngPadding;

    minLat -= latPadding;
    maxLat += latPadding;


    function project(location) {

        const x =
            padding +
            (
                (
                    Number(location.lng) -
                    minLng
                ) /
                (
                    maxLng -
                    minLng
                )
            ) *
            (
                width -
                padding * 2
            );


        const y =
            height -
            padding -
            (
                (
                    Number(location.lat) -
                    minLat
                ) /
                (
                    maxLat -
                    minLat
                )
            ) *
            (
                height -
                padding * 2
            );


        return {
            x,
            y
        };

    }


    const points =
        validLocations.map(
            project
        );


    let route = "";


    if (points.length > 1) {

        route = `

            <polyline
                points="${points
                    .map(
                        point =>
                            `${point.x},${point.y}`
                    )
                    .join(" ")}"
                fill="none"
                stroke="#222"
                stroke-width="5"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-dasharray="10 8"
            />

        `;

    }


    const markers =
        validLocations.map(
            (location, index) => {

                const point =
                    points[index];


                const isCurrent =
                    location.current === true;


                const radius =
                    isCurrent
                        ? 15
                        : 10;


                const fill =
                    isCurrent
                        ? "#ff4f91"
                        : "#3d78c8";


                return `

                    <g
                        class="print-map-location"
                    >

                        <circle
                            cx="${point.x}"
                            cy="${point.y}"
                            r="${radius}"
                            fill="${fill}"
                            stroke="#111"
                            stroke-width="4"
                        />


                        <text
                            x="${point.x + 20}"
                            y="${point.y - 12}"
                            font-family="Arial, sans-serif"
                            font-size="22"
                            font-weight="700"
                            fill="#111"
                        >
                            ${escapeHtml(
                                location.name
                            )}
                        </text>


                        ${
                            location.date
                                ? `
                                    <text
                                        x="${point.x + 20}"
                                        y="${point.y + 15}"
                                        font-family="Arial, sans-serif"
                                        font-size="15"
                                        fill="#555"
                                    >
                                        ${escapeHtml(
                                            location.date
                                        )}
                                    </text>
                                `
                                : ""
                        }

                    </g>

                `;

            }
        ).join("");


    return `

        <div class="print-route-map">

            <svg
                viewBox="0 0 ${width} ${height}"
                role="img"
                aria-label="Thailand travel route"
            >

                <rect
                    x="0"
                    y="0"
                    width="${width}"
                    height="${height}"
                    fill="#fff7fb"
                />


                <rect
                    x="20"
                    y="20"
                    width="${width - 40}"
                    height="${height - 40}"
                    rx="12"
                    fill="none"
                    stroke="#222"
                    stroke-width="3"
                />


                ${route}

                ${markers}

            </svg>


            <div class="print-map-legend">

                <span>
                    <i class="legend-current"></i>
                    Current / latest location
                </span>


                <span>
                    <i class="legend-history"></i>
                    Previous location
                </span>

            </div>

        </div>

    `;

}


/* =========================================================
   WAIT FOR IMAGES
   ========================================================= */

async function waitForPrintImages(
    container
) {

    const images =
        [
            ...container.querySelectorAll(
                "img"
            )
        ];


    await Promise.all(
        images.map(
            image => {

                if (image.complete) {
                    return Promise.resolve();
                }


                return new Promise(
                    resolve => {

                        image.addEventListener(
                            "load",
                            resolve,
                            { once: true }
                        );


                        image.addEventListener(
                            "error",
                            resolve,
                            { once: true }
                        );

                    }
                );

            }
        )
    );


    await Promise.all(
        images.map(
            image => {

                if (
                    typeof image.decode ===
                        "function" &&
                    image.complete &&
                    image.naturalWidth > 0
                ) {

                    return image
                        .decode()
                        .catch(
                            () => {}
                        );

                }


                return Promise.resolve();

            }
        )
    );

}


/* =========================================================
   HELPERS
   ========================================================= */

function getLocation(
    locationId
) {

    if (!locationId) {
        return null;
    }


    return travelData.locations.find(
        location =>
            location.id === locationId
    ) || null;

}


function formatDate(
    value
) {

    if (!value) {
        return "";
    }


    const date =
        new Date(
            `${value}T00:00:00`
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return escapeHtml(
            value
        );

    }


    return date.toLocaleDateString(
        "en-US",
        {
            year: "numeric",
            month: "short",
            day: "numeric"
        }
    );

}


function formatJournalDate(
    value
) {

    if (!value) {
        return "";
    }


    const date =
        new Date(
            `${value}T00:00:00`
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return escapeHtml(
            value
        );

    }


    return date.toLocaleDateString(
        "en-US",
        {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric"
        }
    );

}


function createId(
    text
) {

    const slug =
        String(text)
            .toLowerCase()
            .replace(
                /[^a-z0-9]+/g,
                "-"
            )
            .replace(
                /^-+|-+$/g,
                ""
            );


    return (
        `${slug || "entry"}-` +
        `${Date.now()}`
    );

}


function sanitizeFilename(
    filename
) {

    return String(filename)
        .toLowerCase()
        .replace(
            /[^a-z0-9._-]/g,
            "-"
        )
        .replace(
            /-+/g,
            "-"
        );

}


function fileToBase64(
    file
) {

    return new Promise(
        (resolve, reject) => {

            const reader =
                new FileReader();


            reader.onload = () => {

                const result =
                    reader.result;


                const base64 =
                    String(result)
                        .split(",")[1];


                resolve(
                    base64
                );

            };


            reader.onerror =
                reject;


            reader.readAsDataURL(
                file
            );

        }
    );

}


function escapeHtml(
    value
) {

    return String(
        value ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}