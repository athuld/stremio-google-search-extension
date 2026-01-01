/***********************************************************************/
/*    Common Helper Functions
/***********************************************************************/
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
const isFirefox = typeof browser !== "undefined";
const IMAGE_PATH = "images/stremio-logo-small.png";
const STREMIO_IMG = isFirefox ? browser.runtime.getURL(IMAGE_PATH) : chrome.runtime.getURL(IMAGE_PATH);
const THEME = document.querySelector("meta[content='dark light']")
  ? "dark"
  : "light";

/* Function to get imdb code from DOM */
const getImdbCodeFromDom = () => {
  let imdbLink =
    document.querySelector("a[href*='https://www.imdb.com/title']")?.href ||
    document.querySelector("a[href*='https://m.imdb.com/title']")?.href;
  imdbCode = imdbLink?.match(/title\/(tt\d+)/)?.[1];
  return imdbCode || null;
};

/* Function to add a long press event-listener to remove stremio icon */
const addLongPressListener = (fabStremio) => {
  let pressTimer;
  let isLongPress = false;

  const handleLongPress = (e) => {
    isLongPress = true;
    link.style.display = "none";
  };

  const start = (e) => {
    if (e.type === "click" && e.button !== 0) return;
    isLongPress = false;

    pressTimer = setTimeout(() => {
      handleLongPress(e);
    }, 1000);
  };

  const cancel = (e) => {
    if (pressTimer !== null) {
      clearTimeout(pressTimer);
      pressTimer = null;
    }
  };

  fabStremio.addEventListener("click", (e) => {
    if (isLongPress) {
      e.preventDefault();
    }
  });

  fabStremio.addEventListener("mousedown", start);
  fabStremio.addEventListener("mouseup", cancel);
  fabStremio.addEventListener("mouseleave", cancel);
  fabStremio.addEventListener("touchstart", start, { passive: true });
  fabStremio.addEventListener("touchend", cancel);
  fabStremio.addEventListener("touchcancel", cancel);

  let lastScrollY = window.scrollY;

  window.addEventListener("scroll", () => {
    const currentScrollY = window.scrollY;

    if (currentScrollY > lastScrollY && currentScrollY > 100) {
      fabStremio.classList.add("fab-hidden");
    } else {
      fabStremio.classList.remove("fab-hidden");
    }
    lastScrollY = currentScrollY;
  });
};

/* Function to add Common Floation action button to search */
const addFabStremio = (contentType, imdbCode) => {
  const fabStremio = document.createElement("a");
  fabStremio.id = "floating-btn";
  fabStremio.href = `stremio:///detail/${contentType}/${imdbCode}`;
  fabStremio.innerHTML = `<img style='width: 30px;height: 30px;' src=${STREMIO_IMG} />`;
  document.body.appendChild(fabStremio);
  addLongPressListener(fabStremio);
  return;
};

/*****************************************************************/
/*    Search Engine: Google Specific Functions
/*****************************************************************/

// Function to work with mobile view
const addMobileStremioGoogle = (imdbCode, contentType) => {
  const watchNowMain = document.querySelector(
    "div[role='list'][data-ved][lang]",
  );
  const stremioHref = `stremio:///detail/${contentType}/${imdbCode}`;
  try {
    if (watchNowMain) {
      const mainTag = watchNowMain.querySelector(
        "a[ping]",
      );
      if (mainTag) {
        mainTag.querySelector("img").src = STREMIO_IMG;
        mainTag.href = stremioHref;
      }
      const secTagContainer = watchNowMain.lastChild;
      let firstTag = secTagContainer.querySelector(
        "a[ping]",
      );
      let firstTagDiv = firstTag?.parentElement;
      if (firstTagDiv) {
        firstTagDiv.querySelector("img").src = STREMIO_IMG;
        firstTagDiv.querySelector("a").href = stremioHref;
        let textSection = firstTagDiv.firstChild.querySelector("div:nth-child(2)");
        textSection.firstChild.innerHTML = "Stremio";
        textSection.lastChild.innerHTML = "Freedom to stream";
        return;
      }
    }
    // Fallback to FAB if all the above doesn't work
    addFabStremio(contentType, imdbCode);
  } catch (error) {
    addFabStremio(contentType, imdbCode);
  }
};

// Main function for Google implementation
const addStremioButtonToGoogle = () => {
  let seriesOptions = document.querySelectorAll(
    "div[data-attrid='kc:/tv/tv_program:media_actions_wholepage']",
  );
  let movieOptions = document.querySelectorAll(
    "div[data-attrid='kc:/film/film:media_actions_wholepage']",
  );
  let filmReviewContainer = document.querySelector(
    "div[data-attrid^='kc:/film/film:']",
  );
  let seriesReviewContainer = document.querySelector(
    "div[data-attrid^='kc:/tv/tv_program:']",
  );

  let watchOptions = [];
  let reviewContainer = null;
  let isMovie = true;
  let contentType = "movie";
  let imdbCode = null;

  if (seriesReviewContainer != null) {
    reviewContainer = seriesReviewContainer;
    isMovie = false;
    contentType = "series";
  } else if (filmReviewContainer != null) {
    reviewContainer = filmReviewContainer;
  }

  if (seriesOptions.length !== 0) {
    watchOptions = [...seriesOptions];
  } else if (movieOptions.length !== 0) {
    watchOptions = [...movieOptions];
  }

  // Get imdb code from DOM
  imdbCode = getImdbCodeFromDom();

  if (imdbCode === null) {
    return;
  }

  if (isMobile) {
    addMobileStremioGoogle(imdbCode, contentType);
    return;
  }

  if (reviewContainer !== null && watchOptions.length === 0) {
    addFabStremio(contentType, imdbCode);
    return;
  }

  watchOptions.forEach((watchOption) => {
    let childCount =
      watchOption.firstElementChild.firstElementChild.childElementCount;

    let watchNowEle =
      watchOption.firstElementChild.firstElementChild.firstElementChild;

    if (childCount === 2) {
      let divEle = document.createElement("div");
      watchNowEle =
        watchOptions.firstElementChild.firstElementChild.insertBefore(
          divEle,
          watchNowEle,
        );
    }
    watchNowEle.innerHTML = `<a class="stremio-cta__href" href='stremio:///detail/${contentType}/${imdbCode}'>
         <div class="streamio-cta__container">
         <img style='width: 40px;height: 40px;' src=${STREMIO_IMG} />
         <div>Stremio</div>
         <div>Freedom to stream</div>
         </div>
         </a>`;
  });
};

/*******************************************************/
/* Search Engine: DuckDuckGo Specific Functions
/*******************************************************/
const addStremioButtonToDuckDuckGo = () => {
  const titleSection = document.querySelector(
    'div[data-react-module-id="titles"]',
  );
  if (!titleSection) return;
  imdbCode = getImdbCodeFromDom();
  if (imdbCode === null) {
    return;
  }
  contentType =
    titleSection.innerText.includes("TV Series") ||
    titleSection.innerText.includes("television series")
      ? "series"
      : "movie";
  try {
    let xpath = "//span[text()='Quick links']";
    let quickLinksSpan = document.evaluate(
      xpath,
      titleSection,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null,
    ).singleNodeValue;

    // Add stremio to that imdb card if available
    if (quickLinksSpan) {
      let quickLinksDiv = quickLinksSpan.parentElement.parentElement.lastChild;
      if (
        quickLinksDiv.innerHTML.includes("imdb") &&
        quickLinksDiv.childElementCount <= 7
      ) {
        let stremioLinkCopy = quickLinksDiv.firstElementChild.cloneNode(true);
        stremioLinkCopy.href = `stremio:///detail/${contentType}/${imdbCode}`;
        stremioLinkCopy.querySelector("img").src = STREMIO_IMG;
        stremioLinkCopy.querySelector("span").innerText = "Stremio";
        quickLinksDiv.insertBefore(stremioLinkCopy, quickLinksDiv.firstChild);
        return;
      }
    }
    // Fallback to add floating action button if imdb card is not available
    addFabStremio(contentType, imdbCode);
  } catch (error) {
    addFabStremio(contentType, imdbCode);
  }
};

const searchEngine = window.location.hostname;
if (searchEngine.includes("google.")) {
  addStremioButtonToGoogle();
} else if (searchEngine.includes("duckduckgo.")) {
  document.addEventListener(
    "animationstart",
    function (event) {
      if (event.animationName === "quickLinkAppeared") {
        addStremioButtonToDuckDuckGo();
      }
    },
    true,
  );
}
