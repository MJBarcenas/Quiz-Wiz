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
    focusQuiz();
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
    setWebIcon();
}

let focusableElements = document.querySelectorAll(".focusable");

function blurQuiz() {
    for (let i = 0; i < focusableElements.length; i++) {
        focusableElements[i].style.visibility = "visible";
    }
}
function focusQuiz() {
    for (let i = 0; i < focusableElements.length; i++) {
        focusableElements[i].style.visibility = "hidden";
    }
}

function setWebIcon() {
    let capitalIcon = `data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22256%22 height=%22256%22 viewBox=%220 0 100 100%22><rect width=%22100%22 height=%22100%22 rx=%2220%22 fill=%22%23${primaryColor.slice(1)}%22 data-darkreader-inline-fill=%22%22 style=%22--darkreader-inline-fill: %23352b82;%22></rect><path d=%22M22.87 70.57L22.87 70.57Q22.12 70.77 20.76 70.98Q19.40 71.18 17.90 71.18L17.90 71.18Q14.71 71.18 13.45 70.06Q12.19 68.94 12.19 66.08L12.19 66.08L12.19 29.29Q12.94 29.16 14.33 28.95Q15.73 28.75 17.09 28.75L17.09 28.75Q20.15 28.75 21.51 29.77Q22.87 30.79 22.87 33.78L22.87 33.78L22.87 46.02L37.90 29.02Q41.98 29.02 43.74 30.55Q45.51 32.08 45.51 34.26L45.51 34.26Q45.51 35.89 44.73 37.28Q43.95 38.68 42.18 40.45L42.18 40.45L32.52 50.10Q37.22 55.20 40.99 59.21Q44.76 63.23 47.21 65.67L47.21 65.67Q47.14 68.33 45.41 69.82Q43.68 71.32 41.36 71.32L41.36 71.32Q38.85 71.32 37.25 70.06Q35.65 68.80 34.16 67.10L34.16 67.10L22.87 54.32L22.87 70.57ZM86.38 40.11L86.38 40.11Q86.38 43.17 84.71 45.38Q83.05 47.59 79.92 48.81L79.92 48.81Q83.86 50.10 85.84 52.62Q87.81 55.13 87.81 58.67L87.81 58.67Q87.81 65.27 82.95 68.46Q78.08 71.66 68.90 71.66L68.90 71.66Q67.68 71.66 66.15 71.59Q64.62 71.52 63.02 71.35Q61.42 71.18 59.83 70.88Q58.23 70.57 56.94 70.09L56.94 70.09Q53.40 68.80 53.40 65.47L53.40 65.47L53.40 33.10Q53.40 31.74 54.11 30.99Q54.83 30.25 56.19 29.84L56.19 29.84Q58.43 29.09 61.76 28.72Q65.10 28.34 68.63 28.34L68.63 28.34Q77.13 28.34 81.76 31.23Q86.38 34.12 86.38 40.11ZM76.93 58.19L76.93 58.19Q76.93 53.37 70.74 53.37L70.74 53.37L63.74 53.37L63.74 62.89Q64.82 63.16 66.46 63.29Q68.09 63.43 69.58 63.43L69.58 63.43Q72.85 63.43 74.89 62.17Q76.93 60.91 76.93 58.19ZM63.74 36.77L63.74 45.82L70.06 45.82Q72.71 45.82 74.21 44.59Q75.70 43.37 75.70 40.99L75.70 40.99Q75.70 38.81 73.97 37.62Q72.24 36.43 68.77 36.43L68.77 36.43Q67.48 36.43 66.05 36.54Q64.62 36.64 63.74 36.77L63.74 36.77Z%22 fill=%22%23${tertiaryColor.slice(1)}%22 data-darkreader-inline-fill=%22%22 style=%22--darkreader-inline-fill: %232d2e2f;%22></path></svg>`;

    let lowerIcon = `data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22256%22 height=%22256%22 viewBox=%220 0 100 100%22><rect width=%22100%22 height=%22100%22 rx=%2220%22 fill=%22%23${primaryBackgroundColor.slice(1)}%22></rect><path d=%22M44.10 46.42L44.10 46.42Q44.10 51.38 42.25 54.82Q40.40 58.27 37.25 60.17L37.25 60.17Q39.35 61.13 41.65 61.85Q43.95 62.57 45.90 63.17L45.90 63.17Q45.95 63.47 45.95 63.70Q45.95 63.92 45.95 64.13L45.95 64.13Q45.95 66.97 44.48 68.27Q43.00 69.58 40.60 69.58L40.60 69.58Q38.30 69.58 35.85 68.30Q33.40 67.02 30.85 64.63L30.85 64.63L28.55 62.47L28.25 62.47Q24.85 62.47 21.95 61.42Q19.05 60.38 16.95 58.35Q14.85 56.32 13.65 53.32Q12.45 50.32 12.45 46.42L12.45 46.42Q12.45 42.52 13.68 39.55Q14.90 36.57 17.03 34.55Q19.15 32.52 22.03 31.47Q24.90 30.42 28.25 30.42L28.25 30.42Q31.60 30.42 34.48 31.47Q37.35 32.52 39.50 34.55Q41.65 36.57 42.88 39.55Q44.10 42.52 44.10 46.42ZM35.10 46.42L35.10 46.42Q35.10 41.92 33.25 39.70Q31.40 37.47 28.25 37.47L28.25 37.47Q25.20 37.47 23.33 39.67Q21.45 41.88 21.45 46.42L21.45 46.42Q21.45 50.97 23.30 53.20Q25.15 55.42 28.30 55.42L28.30 55.42Q31.40 55.42 33.25 53.20Q35.10 50.97 35.10 46.42ZM63.20 38.77L63.20 38.77Q63.75 38.52 64.93 38.20Q66.10 37.88 67.30 37.88L67.30 37.88Q69.40 37.88 70.80 38.50Q72.20 39.13 72.50 40.32L72.50 40.32Q73.05 42.38 73.53 44.15Q74 45.92 74.45 47.55Q74.90 49.17 75.33 50.77Q75.75 52.38 76.15 54.13L76.15 54.13L76.40 54.13Q76.85 51.07 77.20 48.30Q77.55 45.52 77.85 42.85Q78.15 40.17 78.45 37.55Q78.75 34.92 79.05 32.22L79.05 32.22Q80.90 31.17 83 31.17L83 31.17Q84.85 31.17 86.20 31.97Q87.55 32.77 87.55 34.67L87.55 34.67Q87.55 35.77 87.33 37.80Q87.10 39.82 86.73 42.32Q86.35 44.82 85.85 47.57Q85.35 50.32 84.80 52.82Q84.25 55.32 83.68 57.35Q83.10 59.38 82.60 60.47L82.60 60.47Q81.85 61.17 80.15 61.63Q78.45 62.07 76.65 62.07L76.65 62.07Q74.30 62.07 72.68 61.45Q71.05 60.82 70.70 59.67L70.70 59.67Q70.05 57.67 69.30 54.92Q68.55 52.17 67.70 48.88L67.70 48.88Q67 52.13 66.25 55.22Q65.50 58.32 64.90 60.47L64.90 60.47Q64.15 61.17 62.65 61.63Q61.15 62.07 59.35 62.07L59.35 62.07Q57.10 62.07 55.28 61.45Q53.45 60.82 52.90 59.67L52.90 59.67Q52.45 58.77 51.93 57Q51.40 55.22 50.85 52.95Q50.30 50.67 49.73 48.02Q49.15 45.38 48.68 42.72Q48.20 40.07 47.80 37.55Q47.40 35.02 47.20 32.92L47.20 32.92Q47.90 32.27 49.15 31.72Q50.40 31.17 51.85 31.17L51.85 31.17Q53.75 31.17 54.98 32.00Q56.20 32.82 56.50 34.77L56.50 34.77Q57.30 39.88 57.83 43.27Q58.35 46.67 58.68 48.85Q59 51.02 59.15 52.22Q59.30 53.42 59.45 54.13L59.45 54.13L59.70 54.13Q60.15 52.13 60.55 50.42Q60.95 48.72 61.38 47Q61.80 45.27 62.25 43.30Q62.70 41.32 63.20 38.77Z%22 fill=%22%23${secondaryColor.slice(1)}%22></path></svg>`;

    let iconLink = document.querySelector("link[rel='icon']");
    iconLink.href = lowerIcon;
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
            blurQuiz();
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