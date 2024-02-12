let sessionToken;
let playerDetails = {
    totalCorrect: 0,
    totalWrong: 0,
    correct: 0,
    wrong: 0,
    choicedAnswers: []
}
let quizDetails = {
    quizList: null,
    currentQuestion: null,
    currentIndex: 0,
    quizDone: false
}
let requestDetails = {
    categoryID: null,
    category: null,
    difficulty: null,
    type: null,
    quantity: 10
};

async function initializeGame() {
    let subjectOptions = document.querySelector("#subject-options");
    let topics = await getTopicList();
    if (localStorage.getItem("session_token") == null) {
        sessionToken = await getSessionToken();

        if (sessionToken == null) {
            alert("Something went wrong.");
            window.reload();
        } else {
            localStorage.setItem("session_token", sessionToken);
        }
    } else {
        sessionToken = localStorage.getItem("session_token");
    }
    subjectOptions.append(...topics);
}

async function getTopicList() {
    let topics = await fetch("https://opentdb.com/api_category.php");
    let response = await topics.json();
    // console.log(response);
    let topicLists = response.trivia_categories.map(topic => {
        let liElement = document.createElement("span");
        let topicName = topic.name.replace("Entertainment: ", "").replace("Science: ", "");
        liElement.textContent = topicName;
        liElement.setAttribute("topic-id", topic.id);
        liElement.setAttribute("topic-name", topicName);

        return liElement;
    });
    return topicLists;
}

async function getSessionToken() {
    let request = await fetch("https://opentdb.com/api_token.php?command=request");
    if (request.ok) {
        let response = await request.json();
        console.log(response);
        return response.token;
    }
    return null;
}

async function getQuestion() {
    let request = await fetch(`https://opentdb.com/api.php?category=${requestDetails.categoryID}&difficulty=${requestDetails.difficulty}&type=${requestDetails.type}&amount=${requestDetails.quantity}&token=${sessionToken}`);
    if (request.ok) {
        response = await request.json();
        if (response.response_code == 0) {
            console.log(0);
            console.log(sessionToken, response);
            return response.results;
        } else if (response.response_code == 1) {
            console.log(1);
            alert("Database do not have enough question for your request...");
        } else if (response.response_code == 2 || response.response_code == 3) {
            console.log(6);
            alert("Something went wrong, please try again...");
        } else if (response.response_code == 4) {
            console.log(4);
            sessionToken = await getSessionToken();
            localStorage.setItem("session_token", sessionToken);
            return await getQuestion();
        } else if (response.response_code == 5) {
            console.log(5);
            alert("You are requesting too fast. Please try again in few minutes.");
        }
    }
    return null;
}

let subjectSpan = document.querySelector("#subject");
let subjectDifficultySpan = document.querySelector("#subject-difficulty");
let quizScoreSpan = document.querySelector("#quiz-score");
let quizTotalSpan = document.querySelector("#quiz-total");
let questionP = document.querySelector("#quiz-question");
let choicesDiv = document.querySelector("#quiz-choices");

function initializeQuiz() {
    subjectSpan.textContent = requestDetails.category;
    subjectDifficultySpan.textContent = requestDetails.difficulty.charAt(0).toUpperCase() + requestDetails.difficulty.slice(1);
    subjectDifficultySpan.className = requestDetails.difficulty;
    quizScoreSpan.textContent = playerDetails.correct;
    quizTotalSpan.textContent = quizDetails.quizList.length;

    showQuiz();
}

function displayQuiz(index) {
    quizDetails.currentQuestion = quizDetails.quizList[index]
    questionP.innerHTML = [quizDetails.currentIndex + 1] + ". " + quizDetails.currentQuestion.question;
    choicesDiv.innerHTML = "";

    if (quizDetails.currentQuestion.type == "boolean") {
        let trueButton = document.createElement("button");
        trueButton.textContent = "True";
        trueButton.originalText = "True";

        let falseButton = document.createElement("button");
        falseButton.textContent = "False";
        falseButton.originalText = "False";

        choicesDiv.append(trueButton, falseButton);
    } else {
        let choices = shuffle([quizDetails.currentQuestion.correct_answer, ...quizDetails.currentQuestion.incorrect_answers]);
        let choicesButtons = choices.map(choice => {
            let choiceButton = document.createElement("button");
            choiceButton.innerHTML = choice;
            choiceButton.originalText = choice;
            return choiceButton;
        });

        choicesDiv.append(...choicesButtons);
    }
}

let questionLogs = document.querySelector("#question-logs");
let quizSummary = document.querySelector("#quiz-summary");
let quizBody = document.querySelector("#quiz-body");
let quizHome = document.querySelector(".quiz-home");
let summarySubjectSpan = document.querySelector("#summary-subject");
let summarySubjectDifficultySpan = document.querySelector("#summary-subject-difficulty");
let summaryScoreSpan = document.querySelector("#summary-score");
let summaryTotalQuestionSpan = document.querySelector("#summary-total-question");

function showQuiz() {
    quizHome.style.display = "none";
    quizSummary.style.display = "none";
    quizBody.style.display = "flex";
}

function showSummary() {
    quizHome.style.display = "none";
    quizBody.style.display = "none";
    quizSummary.style.display = "flex";
}

function displaySummary() {
    summarySubjectSpan.textContent = requestDetails.category;
    summarySubjectDifficultySpan.textContent = requestDetails.difficulty.charAt(0).toUpperCase() + requestDetails.difficulty.slice(1);
    summarySubjectDifficultySpan.style.color = `var(--difficulty-${requestDetails.difficulty})`
    summaryScoreSpan.textContent = playerDetails.correct;
    summaryScoreSpan.style.color = playerDetails.correct > 5 ? "#58cc02" : "var(--difficulty-hard)";
    summaryTotalQuestionSpan.textContent = requestDetails.quantity;

    questionLogs.innerHTML = "";

    console.log(playerDetails.choicedAnswers);
    console.log(quizDetails);

    let questionLogDivs = quizDetails.quizList.map((question, index) => {
        let questionLogDiv = document.createElement("div");
        questionLogDiv.className = "question-log";

        let questionP = document.createElement("p");
        questionP.innerHTML = question.question;

        let answerP = document.createElement("p");
        answerP.innerHTML = `Your Answer: <span class='${question.correct_answer == playerDetails.choicedAnswers[index] ? "correct" : "wrong"}'>${playerDetails.choicedAnswers[index]}</span>`;
        questionLogDiv.append(questionP, answerP);

        if (question.correct_answer != playerDetails.choicedAnswers[index]) {
            let correctAnswerP = document.createElement("p");
            correctAnswerP.innerHTML = `Correct Answer: <span class='correct'>${question.correct_answer}</span>`;
            questionLogDiv.appendChild(correctAnswerP);
        }

        return questionLogDiv;
    });

    questionLogs.append(...questionLogDivs);
    showSummary();
}

let subjectButton = document.querySelector("#subject-button");
let difficultyButton = document.querySelector("#difficulty-button");
let typeButton = document.querySelector("#type-button");

function validateResponseQuizDetails() {
    if (requestDetails.categoryID == null) {
        subjectButton.style.outline = "2px solid red";
        subjectButton.focus();
        setTimeout(() => {
            subjectButton.style.outline = "none";
        }, 2000);
        return false;
    } else if (requestDetails.difficulty == null) {
        difficultyButton.style.outline = "2px solid red";
        difficultyButton.focus();
        setTimeout(() => {
            difficultyButton.style.outline = "none";
        }, 2000);
        return false;
    } else if (requestDetails.type == null) {
        typeButton.style.outline = "2px solid red";
        typeButton.focus();
        setTimeout(() => {
            typeButton.style.outline = "none";
        }, 2000);
        return false;
    }

    return true;
}

function resetQuizGame() {
    quizDetails.quizDone = true;
    playerDetails.totalCorrect += playerDetails.correct;
    playerDetails.totalWrong += playerDetails.wrong;
    playerDetails.correct = 0;
    playerDetails.wrong = 0;
    playerDetails.choicedAnswers = [];

    quizDetails.quizList = null;
    quizDetails.currentQuestion = null;
    quizDetails.currentIndex = 0;
    quizDetails.quizDone = false

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

let dropDowns = document.querySelectorAll(".dropdown-button");
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
    let dropButton = button.closest("button");
    if (dropDownContent.id == "subject-options") {
        dropDownContent.addEventListener("click", function(clicked) {
            let topic = clicked.target.getAttribute("topic-name");
            let topicID = clicked.target.getAttribute("topic-id");

            requestDetails.category = topic;
            requestDetails.categoryID = topicID;
            dropButton.innerHTML = topic + ' <i class="fa-solid fa-chevron-down"></i>'

            console.log(requestDetails);
        });
    } else if (dropDownContent.id == "difficulty-options") {
        dropDownContent.addEventListener("click", function(clicked) {
            let difficulty = clicked.target.getAttribute("topic-difficulty");
            let textContent = clicked.target.textContent;

            requestDetails.difficulty = difficulty;
            dropButton.innerHTML = textContent + ' <i class="fa-solid fa-chevron-down"></i>'

            console.log(requestDetails);
        });
    } else if (dropDownContent.id == "type-options") {
        dropDownContent.addEventListener("click", function(clicked) {
            let type = clicked.target.getAttribute("topic-type");
            let textContent = clicked.target.textContent;

            requestDetails.type = type;
            dropButton.innerHTML = textContent + ' <i class="fa-solid fa-chevron-down"></i>'

            console.log(requestDetails);
        });
    }
});

let quizCountInput = document.querySelector("#quiz-count");
quizCountInput.addEventListener("change", function() {
    if (quizCountInput.value > 50) {
        quizCountInput.value = 50;
    } else if (quizCountInput.value < 10) {
        quizCountInput.value = 10;
    }

    requestDetails.quantity = quizCountInput.value;
    console.log(requestDetails);
});
quizCountInput.addEventListener("keydown", (event) => {
    if (event.key == "-" || event.key == "+") {
        event.preventDefault();
        return;
    }
});

let startQuizButton = document.querySelector("#start-quiz-button");
startQuizButton.addEventListener("click", async function() {
    if (!validateResponseQuizDetails()) return;
    quizDetails.quizList = await getQuestion();

    if (quizDetails.quizList == null) return;

    initializeQuiz();
    displayQuiz(quizDetails.currentIndex);
});

let quizChoicesDiv = document.querySelector("#quiz-choices");
quizChoicesDiv.addEventListener("click", async function(event) {
    if (event.target.tagName.toLowerCase() == "button") {
        let button = event.target;
        let userAnswer = button.originalText;
        let correctAnswer = quizDetails.currentQuestion.correct_answer;

        if (userAnswer == correctAnswer) {
            await correctAudio.play();
            playerDetails.correct += 1;
            quizScoreSpan.textContent = playerDetails.correct;
            button.style.backgroundColor = "#58cc02";
        } else {
            await wrongAudio.play();
            let choices = document.querySelector("#quiz-choices");
            let correctButton = Array.from(choices.children).filter(button => button.originalText == correctAnswer)[0];

            playerDetails.wrong += 1;
            button.style.backgroundColor = "#ff4b4b";

            correctButton.style.backgroundColor = "#58cc02";
            correctButton.style.scale = 1.05;
        }

        playerDetails.choicedAnswers.push(userAnswer);

        setTimeout(() => {
            displayQuiz(quizDetails.currentIndex);
        }, 2000);

        if (quizDetails.quizDone) {
            displaySummary();
            resetQuizGame();
            return;
        }

        if (!quizDetails.quizDone) {
            quizDetails.currentIndex += 1;
        }

        if (quizDetails.currentIndex == 9) {
            quizDetails.quizDone = true;
        }
    }
});

let nextQuizButton = document.querySelector("#quiz-next-button");
nextQuizButton.addEventListener("click", async function() {
    quizDetails.quizList = await getQuestion();

    if (quizDetails.quizList == null) return;

    initializeQuiz();
    displayQuiz(quizDetails.currentIndex);
});


window.addEventListener("click", function(event) {
    if (!event.target.matches(".dropdown-button") || !event.target.closest(".dropdown-button")) {
        dropDowns.forEach(button => {
            let content = button.nextElementSibling;
            let dropButtonText = button.textContent;

            content.style.display = "none";
            button.innerHTML = dropButtonText + ' <i class="fa-solid fa-chevron-down"></i>';
            button.classList.remove("shown");
        });
    }
});

let correctAudio = new Audio(location.protocol + '//' + location.host + location.pathname + "/assets/sounds/correct_answer.mp3");
let wrongAudio = new Audio(location.protocol + '//' + location.host + location.pathname + "/assets/sounds/incorrect_answer.mp3");
(async() => {
    await initializeGame();
})();