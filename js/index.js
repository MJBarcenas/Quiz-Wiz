let token, currentCategory, score, quizList, currentQuestion;
let quizConfig = {
    categoryID: null,
    category: null,
    difficulty: "easy",
    type: "multiple",
    quantity: 10
};

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

function shuffle(array) {
    let currentIndex = array.length,
        randomIndex;

    while (currentIndex > 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]
        ];
    }

    return array;
}

function displayQuiz(quizNum) {
    let questionElement = document.querySelector("#question");
    questionElement.innerHTML = quizList[quizNum].question;

    let questionButton = document.querySelector("#question-choices");
    let shuffledChoices = shuffle([quizList[quizNum].correct_answer, ...quizList[quizNum].incorrect_answers]);
    let choicesButton = shuffledChoices.map(choice => {
        let choiceButton = document.createElement("button");
        choiceButton.innerHTML = choice;
        return choiceButton;
    });

    questionButton.innerHTML = "";
    questionButton.append(...choicesButton);
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
            quizList = result.results;
            currentQuestion = 0;
            score = 0;
            displayQuiz(currentQuestion);

            let quizTitle = document.querySelector("#quiz-title");
            quizTitle.textContent = quizConfig.category;

            let quizProgress = document.querySelector("#quiz-progress");
            quizProgress.textContent = score;

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
    if (quantity > 50) {
        quantityInput.value = 50;
        quizConfig.quantity = 50;
    } else {
        quizConfig.quantity = quantity;
    }
});
quantityInput.addEventListener("keydown", (event) => {
    if (event.key == "-" || event.key == "+") {
        event.preventDefault();
        return;
    }
})

let questionChoices = document.querySelector("#question-choices");
questionChoices.addEventListener("click", event => {
    if (event.target.tagName.toLowerCase() == "button") {
        let pressedAnswer = event.target.textContent;
        let answer = quizList[currentQuestion].correct_answer;
        let scoreSpan = document.querySelector("#quiz-progress");

        if (pressedAnswer == answer) {
            score += 1;
        }
        scoreSpan.textContent = score;
        currentQuestion += 1;

        displayQuiz(currentQuestion);
    }
});

initialize();