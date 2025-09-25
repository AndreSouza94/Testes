const cardFlip = document.getElementById("cardFlip");
const toRegister = document.getElementById("toRegister");
const toLogin = document.getElementById("toLogin");

toRegister.addEventListener("click", (e) => {
  e.preventDefault();
  cardFlip.classList.add("flip");
});

toLogin.addEventListener("click", (e) => {
  e.preventDefault();
  cardFlip.classList.remove("flip");
});
