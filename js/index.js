import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, push, onValue, get, update, remove } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseSettings = {
    databaseURL: "https://quiz-wiz-1c3b8-default-rtdb.asia-southeast1.firebasedatabase.app/"
};

const app = initializeApp(firebaseSettings);
const database = getDatabase(app);

let sessionToken, sessionUser;
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
    difficulty: null,
    type: null,
    quantity: 10
};

localStorage.removeItem("session_token");
async function initializeGame() {
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
    // let request = await fetch(`https://opentdb.com/api.php?difficulty=${requestDetails.difficulty}&type=${requestDetails.type}&amount=${requestDetails.quantity}&token=${sessionToken}`);
    console.log(`https://opentdb.com/api.php?amount=${requestDetails.quantity}&token=${sessionToken}${requestDetails.difficulty != null ? `&difficulty=${requestDetails.difficulty}` : ""}${requestDetails.type != null ? `&type=${requestDetails.type}` : ""}`);
    let request = await fetch(`https://opentdb.com/api.php?amount=${requestDetails.quantity}&token=${sessionToken}${requestDetails.difficulty != null ? `&difficulty=${requestDetails.difficulty}` : ""}${requestDetails.type != null ? `&type=${requestDetails.type}` : ""}`);
    if (request.ok) {
        let response = await request.json();
        if (response.response_code == 0) {
            for (let i = 0; i < response.results.length; i++) {
                console.log(response.results[i].correct_answer);
            }
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
    quizScoreSpan.textContent = playerDetails.correct;
    quizTotalSpan.textContent = quizDetails.quizList.length;

    showQuiz();
}

function displayQuiz(index) {
    quizDetails.currentQuestion = quizDetails.quizList[index]
    subjectSpan.innerHTML = quizDetails.currentQuestion.category.replace("Science: ", "").replace("Entertainment: ", "");
    subjectDifficultySpan.textContent = quizDetails.currentQuestion.difficulty.charAt(0).toUpperCase() + quizDetails.currentQuestion.difficulty.slice(1);
    subjectDifficultySpan.className = quizDetails.currentQuestion.difficulty;
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
    if (requestDetails.difficulty != null) {
        summarySubjectDifficultySpan.textContent = requestDetails.difficulty.charAt(0).toUpperCase() + requestDetails.difficulty.slice(1);
        summarySubjectDifficultySpan.style.color = `var(--difficulty-${requestDetails.difficulty})`;
    }
    summaryScoreSpan.textContent = playerDetails.correct;
    summaryScoreSpan.style.color = playerDetails.correct > (quizDetails.quizList / 2) ? "var(--answer-correct)" : "var(--answer-wrong)";
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

let difficultyButton = document.querySelector("#difficulty-button");
let typeButton = document.querySelector("#type-button");

function validateResponseQuizDetails() {
    if (requestDetails.difficulty == null) {
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

function submitPlayerPerformanceFirebase() {
    let username = playernamePromptInput.value;
    let rawPerformance = getPlayerPerformance() * 100;
    let performance = Number.isInteger(rawPerformance) ? parseInt(rawPerformance) : parseFloat(rawPerformance.toFixed(2));
    let questionsAnswered = playerDetails.totalCorrect + playerDetails.totalWrong
    let performanceRating = getPlayerPerformance() * Math.log(questionsAnswered);
    push(ref(database, "/leaderboards"), {
        username: username,
        rating: performance,
        performance_rating: performanceRating,
        questions_answered: questionsAnswered
    });
}

function getPlayerPerformance() {
    let totalQuestionAnswered = playerDetails.totalCorrect + playerDetails.totalWrong;
    let performance = playerDetails.totalCorrect / totalQuestionAnswered;
    return performance;
}

let performanceRatingP = document.querySelector("#performance-rating");
let playernamePromptInput = document.querySelector("#player-name-prompt");

playernamePromptInput.addEventListener("keydown", function(event) {
    if (event.key == "Enter") {
        if (playernamePromptInput.value.trim().length == 0) {
            playernamePromptInput.focus();
            playernamePromptInput.style.borderColor = "#ff4b4b";
            setTimeout(() => {
                playernamePromptInput.style.borderColor = "#58cc02";
            }, 2000);
            return;
        }
        submitPlayerPerformanceFirebase();
        hidePromptLeaderboards();
    }
});

async function promptLeaderBoards() {
    let playerPerformance = parseInt(getPlayerPerformance() * 100);
    console.log(playerPerformance);
    if (playerPerformance >= 80) {
        correctAudio.pause()
        correctAudio.currentTime = 0;
        wrongAudio.pause()
        wrongAudio.currentTime = 0;
        await congratsAudio.play()
        performanceRatingP.textContent = playerPerformance + "%";
        playernamePromptInput.value = "";
        showPromptLeaderboards();
    }
}

let leaderboardPrompt = document.querySelector(".leaderboards-prompt");

function showPromptLeaderboards() {
    leaderboardPrompt.style.display = "block";
}

function hidePromptLeaderboards() {
    leaderboardPrompt.style.display = "none ";
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

function initializeLeaderboards() {
    onValue(ref(database, "/leaderboards"), snapshot => {
        if (!snapshot.exists()) return;
        let response = snapshot.val();
        let bucketKeys = Object.keys(response);
        let sorted = [];

        console.log(response, bucketKeys);
        for (let i = 0; i < bucketKeys.length; i++) {
            sorted.push([
                [bucketKeys[i]], response[bucketKeys[i]].performance_rating
            ]);
        }

        sorted.sort(function(a, b) {
            return b[1] - a[1];
        })

        let quizWizardDivs = sorted.map((arr, index) => {
            let bucketKey = arr[0];
            console.log(bucketKey);

            let ratingP = document.createElement("p");
            ratingP.textContent = response[bucketKey].rating + "%";

            let nameAndQAP = document.createElement("p");
            nameAndQAP.innerHTML = response[bucketKey].username + "<br>" + response[bucketKey].questions_answered + " Questions answered.";

            ratingP.className = index != 0 ? index != 1 ? index != 2 ? "" : "bronze" : "silver" : "gold";

            return [ratingP, nameAndQAP];
        });

        let topWizardDiv = document.querySelector(".top-wizards");
        topWizardDiv.innerHTML = "";
        topWizardDiv.append(...quizWizardDivs.flat());
    });
}

let quizGameBody = document.querySelector("main");
let leaderboardsBody = document.querySelector(".leaderboards");

function showLeaderboards() {
    quizGameBody.style.display = "none";
    leaderboardsBody.style.display = "flex";
}

function showQuizGame() {
    leaderboardsBody.style.display = "none";
    quizGameBody.style.display = "flex";
}

let isDarkMode = false;
let primaryBackgroundColor = "#f3faf5";
let primaryColor = "#023047";
let secondaryColor = "#219ebc";
let tertiaryColor = "#ffb703";
let textColor = "#3c3c3c";
let boxShadow = "rgba(17, 17, 26, 0.1) 0px 4px 16px 0px, rgba(17, 17, 26, 0.05) 0px 8px 32px 0px";
let toggleThemeButton = document.querySelector("#toggle-theme-button");
toggleThemeButton.addEventListener("click", toggleTheme);

function toggleLightMode() {
    primaryBackgroundColor = "#f3faf5";
    primaryColor = "#023047";
    secondaryColor = "#219ebc";
    tertiaryColor = "#ffb703";
    textColor = "#3c3c3c";
    boxShadow = "rgba(17, 17, 26, 0.1) 0px 4px 16px 0px, rgba(17, 17, 26, 0.05) 0px 8px 32px 0px";

    document.documentElement.style.setProperty("--primary-backgroundcolor", primaryBackgroundColor);
    document.documentElement.style.setProperty("--primary-color", primaryColor);
    document.documentElement.style.setProperty("--secondary-color", secondaryColor);
    document.documentElement.style.setProperty("--tertiary-color", tertiaryColor);
    document.documentElement.style.setProperty("--text-color", textColor);
    document.documentElement.style.setProperty("--box-shadow", boxShadow);

    toggleThemeButton.firstElementChild.classList.remove("fa-sun");
    toggleThemeButton.firstElementChild.classList.add("fa-moon");
}

function toggleDarkMode() {
    primaryBackgroundColor = "#0e0d24";
    primaryColor = "#2b2870";
    secondaryColor = "#ffb703";
    tertiaryColor = "#219ebc";
    textColor = "#f3faf5";
    boxShadow = "rgba(239, 238, 229, 0.1) 0px 4px 16px 0px, rgba(239, 238, 229, 0.05) 0px 8px 32px 0px";

    document.documentElement.style.setProperty("--primary-backgroundcolor", primaryBackgroundColor);
    document.documentElement.style.setProperty("--primary-color", primaryColor);
    document.documentElement.style.setProperty("--secondary-color", secondaryColor);
    document.documentElement.style.setProperty("--tertiary-color", tertiaryColor);
    document.documentElement.style.setProperty("--text-color", textColor);
    document.documentElement.style.setProperty("--box-shadow", boxShadow);

    toggleThemeButton.firstElementChild.classList.remove("fa-moon");
    toggleThemeButton.firstElementChild.classList.add("fa-sun");
}

function toggleTheme() {
    if (isDarkMode) {
        isDarkMode = false;
        toggleLightMode();
    } else {
        isDarkMode = true;
        toggleDarkMode();
    }
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
    if (dropDownContent.id == "difficulty-options") {
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
    // if (!validateResponseQuizDetails()) return;
    quizDetails.quizList = await getQuestion();

    if (quizDetails.quizList == null) return;

    initializeQuiz();
    displayQuiz(quizDetails.currentIndex);
});

let quizChoicesDiv = document.querySelector("#quiz-choices");
quizChoicesDiv.addEventListener("click", async function(event) {
    if (event.target.tagName.toLowerCase() == "button") {
        Array.from(quizChoicesDiv.children).forEach(element => {
            element.disabled = true;
        });

        let button = event.target;
        let userAnswer = button.originalText;
        let correctAnswer = quizDetails.currentQuestion.correct_answer;

        if (userAnswer == correctAnswer) {
            await correctAudio.play();
            playerDetails.correct += 1;
            quizScoreSpan.textContent = playerDetails.correct;
            button.style.backgroundColor = "var(--answer-correct)";
        } else {
            await wrongAudio.play();
            let choices = document.querySelector("#quiz-choices");
            let correctButton = Array.from(choices.children).filter(button => button.originalText == correctAnswer)[0];

            playerDetails.wrong += 1;
            button.style.backgroundColor = "var(--answer-wrong)";
            button.style.scale = .9905;

            correctButton.style.backgroundColor = "var(--answer-correct)";
            correctButton.style.scale = 1.05;
        }

        playerDetails.choicedAnswers.push(userAnswer);

        if (quizDetails.quizDone) {
            displaySummary();
            resetQuizGame();
            await promptLeaderBoards();
            return;
        }

        if (!quizDetails.quizDone) {
            quizDetails.currentIndex += 1;
        }

        if (quizDetails.currentIndex == quizDetails.quizList.length - 1) {
            quizDetails.quizDone = true;
        }

        setTimeout(() => {
            displayQuiz(quizDetails.currentIndex);
        }, 2000);
    }
});

let nextQuizButton = document.querySelector("#quiz-next-button");
nextQuizButton.addEventListener("click", async function() {
    quizDetails.quizList = await getQuestion();

    if (quizDetails.quizList == null) return;

    initializeQuiz();
    displayQuiz(quizDetails.currentIndex);
});

let closeLeaderboardsPromptButton = document.querySelector("#close-leaderboards-prompt");
closeLeaderboardsPromptButton.addEventListener("click", hidePromptLeaderboards);

let showQuizGameButton = document.querySelector("#quiz-game-button");
showQuizGameButton.addEventListener("click", showQuizGame);

let showLeaderboardsButton = document.querySelector("#leaderboards-button");
showLeaderboardsButton.addEventListener("click", showLeaderboards);


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
let congratsAudio = new Audio(location.protocol + '//' + location.host + location.pathname + "/assets/sounds/congratulations.mp3");
(async() => {
    await initializeGame();
    initializeLeaderboards();
})();