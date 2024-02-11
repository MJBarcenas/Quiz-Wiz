let dropDowns = document.querySelectorAll(".dropdown-button");
console.log(dropDowns);
dropDowns.forEach(button => {
    button.addEventListener("click", function(event) {
        let dropButton = button.closest("button");
        let dropButtonText = dropButton.textContent;
        let content = dropButton.nextElementSibling;
        if (dropButton.classList.contains("shown")) {
            content.style.display = "none";
            dropButton.innerHTML = dropButtonText + '<i class="fa-solid fa-chevron-down"></i>'
        } else {
            content.style.display = "grid";
            dropButton.innerHTML = dropButtonText + '<i class="fa-solid fa-chevron-up"></i>'
        }
        dropButton.classList.toggle("shown");
        event.stopPropagation();
    });
    let dropDownContent = button.nextElementSibling;
    dropDownContent.addEventListener("click", function(event) {

    });
});



window.addEventListener("click", function(event) {
    if (!event.target.matches(".dropdown-button") || !event.target.closest(".dropdown-button")) {
        dropDowns.forEach(button => {
            let content = button.nextElementSibling;
            content.style.display = "none";
            button.classList.remove("shown");
        });
    }
});