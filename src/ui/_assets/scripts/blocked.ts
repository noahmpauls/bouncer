if (window.top !== window.self) {
  document.querySelector("body")?.classList.add("frame");
}

const queryParams = new URLSearchParams(window.location.search);

const title = queryParams.get("title");
const url = queryParams.get("url");

const titleContainer = document.getElementById("title") as HTMLSpanElement;
titleContainer.innerHTML = title !== null ? title : "this site"
if (title !== null) {
  titleContainer.style.fontWeight = 'bold';
}

const tryAgainButton = document.getElementById("try-again") as HTMLButtonElement;
tryAgainButton.addEventListener("click", () => {
  url !== null && location.replace(url);
});
