let token;
let quizConfig = {
    categoryID: null,
    category: null,
    difficulty: "easy",
    type: "multiple",
    quantity: 10
};

let currentCategory = null;

function initialize() {
    // Generate token and get the available topics fromt eh api
    // $.get("https://opentdb.com/api_token.php?command=request", function(result) {
    //     if (result.response_code == 0) {
    //         token = result.token;
    //     } else {
    //         alert("Something went wrong, please reload the website");
    //         window.stop();
    //         return;
    //     }
    // });

    $.get("https://opentdb.com/api_category.php", function(result) {
        let categories = result.trivia_categories;
        let topicList = categories.map(topic => {
            let liElement = document.createElement("li");
            let topicName = topic.name.replace("Entertainment: ", "");
            liElement.textContent = topicName;
            liElement.setAttribute("topic-id", topic.id);
            liElement.setAttribute("topic-name", topicName);

            return liElement;
        });
        let categoryUL = document.querySelector("#category-list");
        categoryUL.append(...topicList);
    });
}

let categoryList = document.querySelector("#category-list");
categoryList.addEventListener("click", (event) => {
    let target = event.target;
    if (target.tagName.toLowerCase() == "li") {
        let topicID = target.getAttribute("topic-id");
        let topicName = target.getAttribute("topic-name");
        quizConfig.categoryID = topicID;
        quizConfig.category = topicName;

        if (currentCategory != null) {
            currentCategory.removeAttribute("class");
        }

        target.className = "category-active";
        currentCategory = target;
    }
});

let startButton = document.querySelector("#start-button");
startButton.addEventListener("click", () => {
    if (quizConfig.category == null) return; // Remind the user to select a category using popup

    $.get(`https://opentdb.com/api.php?category=${quizConfig.categoryID}&difficulty=${quizConfig.difficulty}&type=${quizConfig.type}&amount=${quizConfig.quantity}`, function(result) {
        console.log(result);
        if (result.response_code == 0) {
            let quizTitle = document.querySelector("#quiz-title");
            quizTitle.textContent = quizConfig.category;

            let quizProgress = document.querySelector("#quiz-progress");
            quizProgress.textContent = 0;

            let quizTotal = document.querySelector("#quiz-total");
            quizTotal.textContent = quizConfig.quantity;

            let defaultScreen = document.querySelector(".default-value");
            defaultScreen.style.display = "none";
            let quizScreen = document.querySelector(".quiz");
            quizScreen.style.display = "flex";
        } else {
            alert("Something went wrong, please reload the website");
            window.stop();
        }
    });
});

let difficultySelect = document.querySelector("#difficulty");
difficultySelect.addEventListener("change", () => {
    let difficulty = difficultySelect.value;
    quizConfig.difficulty = difficulty;
});

let typeSelect = document.querySelector("#type");
typeSelect.addEventListener("change", () => {
    let type = typeSelect.value;
    quizConfig.type = type;
});

let quantityInput = document.querySelector("#quantity");
quantityInput.addEventListener("change", () => {
    let quantity = quantityInput.value;
    quizConfig.quantity = quantity;
});

initialize();