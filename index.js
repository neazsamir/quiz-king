function getEl(selector) {
  return document.querySelector(selector);
}

function visiblity (selector, visiblity) {
  getEl(selector).style.display = visiblity
}

if (!navigator.onLine) {
  visiblity(".mainContainer", 'none')
  visiblity(".connectionErr", 'flex')
}

setInterval(() => {
  if (!navigator.onLine) {
  visiblity(".connectionErr", 'flex')
  getEl(".mainContainer").style.display = 'none'
} else {
  getEl(".connectionErr").style.display = 'none'
  getEl(".mainContainer").style.display = 'block'
}

}, 2000)

const startBtn = getEl(".startBtn");
const exitBtn = getEl(".exitBtn");
const continueBtn = getEl(".continueBtn");
const quizPage = getEl(".quiz");
const nextBtn = getEl(".nextBtn");

function toggleVisiblity(btnSelector, elemSelectorHide, elemSelectorShow) {
  btnSelector.onclick = () => {
  getEl(elemSelectorHide).style.display = 'none';
  getEl(elemSelectorShow).style.display = 'block';
  };
}

toggleVisiblity(startBtn, ".quizSelection", ".rule");
toggleVisiblity(exitBtn, ".rule", ".quizSelection");
toggleVisiblity(continueBtn, ".rule", ".quiz");

getEl(".playAgain").onclick = () => window.location.reload();

function playAudio (selector) {
  getEl(selector).play()
}


document.querySelectorAll('select').forEach(select => {
  select.classList.add('pulsing-border');
  
  select.addEventListener('click', function() {
  this.classList.remove('pulsing-border');
  playAudio('#selectEffect')
  });
});

let amount = 10;
let category = "";
let difficulty = "";
let type = "";
let results = [];
let questionNum = 0;
let record = 0;
let missed = 0;
let correct = 0;

startBtn.addEventListener("click", () => {
  amount = getEl('#totalQuestions').value;
  category = getEl('#category').value;
  difficulty = getEl('#difficulty').value;
  type = getEl('#type').value;
  playAudio('#clickEffect')
  const audioFiles = ['#wrongSound', '#clockTick'];
  audioFiles.forEach(selector => {
    const audio = getEl(selector);
    audio.play().then(() => {
    audio.pause()
    audio.currentTime = 0;
    }).catch(err => {
    console.log(`Error priming audio ${selector}:`, err);
    });
  });
});
async function fetchApi() {
  try {
    getEl(".page-loader").style.display = 'flex';
    
    const url = `https://opentdb.com/api.php?amount=${amount}&category=${category}&difficulty=${difficulty}&type=${type}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    
    const data = await response.json();
    
    if (data.results.length === 0) {
      getEl(".page-loader").style.display = 'none';
      alert('No questions found for the selected quiz! Please adjust the amount or type');
    }

    results = data.results;
    questionNum = 0;
    createElem();
  } catch (err) {
  console.log(err)
}
}


function createElem() {
  if (results.length === 0) return;

  const { question, correct_answer, incorrect_answers } = results[questionNum];
  const quizElem = document.createElement('div');
  const options = [correct_answer, ...incorrect_answers];
  const shuffledOptions = options.sort(() => Math.random() - 0.5);

  if (results[questionNum].type === "multiple") {
    quizElem.innerHTML = `<h5 class="question my-4">${questionNum + 1}. ${question}</h5>
      <div class="options">
        <button class="text-start form-control py-3 my-2">${shuffledOptions[0]}</button>
        <button class="text-start form-control py-3 my-2">${shuffledOptions[1]}</button>
        <button class="text-start form-control py-3 my-2">${shuffledOptions[2]}</button>
        <button class="text-start form-control py-3 my-2">${shuffledOptions[3]}</button>
      </div>`;
  } else {
    quizElem.innerHTML = `<h5 class="question my-4">${questionNum + 1}. ${question}</h5>
      <div class="options">
        <button class="text-start form-control py-3 my-2">False</button>
        <button class="text-start form-control py-3 my-2">True</button>
      </div>`;
  }

  getEl('body').style.overflow = 'auto';

  getEl(".qLeft").style.display = 'block';
  getEl("#top").style.display = 'block';

  getEl(".answered").innerText = questionNum + 1;
  getEl(".outOf").innerText = getEl('#totalQuestions').value;
  getEl(".quizBody").innerHTML = '';
  getEl(".quizBody").appendChild(quizElem);

  function showAns(button) {
    if (button.innerText === correct_answer) {
      button.classList.add('border', 'success', 'text-white');
      const checkMark = document.createElement('i');
      checkMark.setAttribute('class', 'fa-solid fa-circle-check');
      button.appendChild(checkMark);
    }
  } 
  
  let interval;
  let totalTime = 15;
  let timeLeft = totalTime;
  getEl(".timeLeft").innerText = timeLeft;

  getEl(".options").addEventListener('click', (event) => {
    clearInterval(interval);
    if (event.target.tagName === 'BUTTON') {
      if (questionNum + 1 >= amount) {
        nextBtn.innerText = 'Finish';
        getEl(".qLeft").innerText = 'Excellent 🎉';
      }
    }

    document.querySelectorAll(".options button").forEach(button => {
      button.disabled = true;
      showAns(button);
    });

    if (event.target.innerText === correct_answer) {
      event.target.classList.add('bg-success', 'text-white');
      playAudio('#correctSound')
      correct++;
      if (timeLeft >= record) {
        record = timeLeft;
      }
    } else {
      event.target.classList.add('bg-danger', 'text-white');
      playAudio('#wrongSound')
      const cross = document.createElement('i');
      cross.setAttribute('class', 'fa-solid fa-circle-xmark');
      event.target.appendChild(cross);
    }

    nextBtn.style.display = 'block';
  });

  interval = setInterval(() => {
    if (timeLeft <= 4 && timeLeft > 0) {
      playAudio('#clockTick')
    }
    
    if (timeLeft <= 0) {
      playAudio('#wrongSound')
      clearInterval(interval);
      missed++;
      document.querySelectorAll(".options button").forEach(button => {
        button.disabled = true;
        showAns(button);
        button.classList.add('border', 'border-danger');
        nextBtn.style.display = 'block';
      });
    } else {
      timeLeft--;
      getEl(".timeLeft").innerText = timeLeft.toString().padStart(2, "0");
      const percentage = (timeLeft / totalTime) * 100;
      getEl(".timeIndicator").style.width = percentage + '%';
    }
  }, 1000);
}

nextBtn.addEventListener('click', () => {
  if (nextBtn.innerText === 'Finish') {
    getEl(".quiz").style.display = 'none';
    getEl(".result").style.display = 'block';
    getEl(".missed").innerText = "Missed: " + missed;
    getEl(".correctAns").innerText = correct + ' out of ' + amount;
    getEl(".record").innerText = 'heigest record: ' + record + 's';
  }

  getEl(".timeIndicator").style.width = '100%';
  questionNum++;
  if (questionNum < results.length) {
    createElem();
  }
  nextBtn.style.display = 'none';
});

continueBtn.addEventListener('click', () => {
  fetchApi();
});

window.onload = function() {
  document.getElementById("pageLoader").style.display = "none";
};

document.querySelectorAll('#nextBtn').forEach(button => {
  button.addEventListener('click', () => {
    playAudio('#clickEffect')
  });
});