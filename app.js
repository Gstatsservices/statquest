const state = {
  game: 'descriptive',
  difficulty: 'Beginner',
  score: 0,
  streak: 0,
  answered: 0,
  best: Number(localStorage.getItem('statquest-best') || 0),
  current: null,
  locked: false,
};

const gameNames = {
  descriptive: 'Descriptive Dash',
  probability: 'Probability Lab',
  distribution: 'Distribution Detective',
  outlier: 'Outlier Hunter',
  correlation: 'Correlation Explorer',
};

const homeView = document.getElementById('homeView');
const gameView = document.getElementById('gameView');
const answersArea = document.getElementById('answersArea');
const visualArea = document.getElementById('visualArea');
const feedback = document.getElementById('feedback');
const nextBtn = document.getElementById('nextBtn');
const questionTitle = document.getElementById('questionTitle');
const questionPrompt = document.getElementById('questionPrompt');
const gameLabel = document.getElementById('gameLabel');
const scoreValue = document.getElementById('scoreValue');
const streakValue = document.getElementById('streakValue');
const heroScore = document.getElementById('heroScore');
const heroStreak = document.getElementById('heroStreak');
const heroBest = document.getElementById('heroBest');
const answeredCount = document.getElementById('answeredCount');
const difficultyBtn = document.getElementById('difficultyBtn');
const difficultyLabel = document.getElementById('difficultyLabel');
const difficultyMenu = document.getElementById('difficultyMenu');

function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function choice(arr) { return arr[rand(0, arr.length - 1)]; }
function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
function round(n, dp = 2) { const p = 10 ** dp; return Math.round(n * p) / p; }
function uniqueOptions(correct, distractors) {
  return shuffle([correct, ...distractors.filter(x => String(x) !== String(correct))])
    .filter((v, i, a) => a.findIndex(x => String(x) === String(v)) === i)
    .slice(0, 4);
}

function updateStats() {
  scoreValue.textContent = state.score;
  streakValue.textContent = state.streak;
  heroScore.textContent = state.score;
  heroStreak.textContent = state.streak;
  heroBest.textContent = state.best;
  answeredCount.textContent = state.answered;
  difficultyBtn.textContent = `${state.difficulty} ▾`;
  difficultyLabel.textContent = state.difficulty;
}

function goHome() {
  homeView.classList.add('active');
  gameView.classList.remove('active');
  difficultyMenu.hidden = true;
  window.scrollTo({ top: 0, behavior: 'smooth' });
  updateStats();
}

function startGame(game) {
  state.game = game;
  homeView.classList.remove('active');
  gameView.classList.add('active');
  gameLabel.textContent = gameNames[game];
  window.scrollTo({ top: 0, behavior: 'smooth' });
  nextQuestion();
}

function nextQuestion() {
  state.locked = false;
  feedback.hidden = true;
  feedback.className = 'feedback';
  nextBtn.hidden = true;
  answersArea.innerHTML = '';
  visualArea.innerHTML = '';
  const makers = {
    descriptive: makeDescriptive,
    probability: makeProbability,
    distribution: makeDistribution,
    outlier: makeOutlier,
    correlation: makeCorrelation,
  };
  state.current = makers[state.game]();
  renderQuestion(state.current);
}

function renderQuestion(q) {
  questionTitle.textContent = q.title;
  questionPrompt.textContent = q.prompt;
  if (q.visualHTML) visualArea.innerHTML = q.visualHTML;
  if (q.draw) q.draw(visualArea);
  q.options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'answer-btn';
    btn.textContent = opt;
    btn.addEventListener('click', () => submitAnswer(opt, btn));
    answersArea.appendChild(btn);
  });
}

function submitAnswer(answer, clickedButton) {
  if (state.locked) return;
  state.locked = true;
  state.answered += 1;
  const correct = String(answer) === String(state.current.answer);
  document.querySelectorAll('.answer-btn').forEach(btn => {
    btn.disabled = true;
    if (String(btn.textContent) === String(state.current.answer)) btn.classList.add('correct');
  });
  if (!correct) clickedButton.classList.add('wrong');

  if (correct) {
    state.streak += 1;
    const bonus = Math.min(state.streak - 1, 5) * 2;
    state.score += 10 + bonus;
    feedback.textContent = `Correct! ${state.current.explanation}`;
    feedback.classList.add('good');
  } else {
    state.streak = 0;
    feedback.textContent = `Not quite. ${state.current.explanation}`;
    feedback.classList.add('bad');
  }

  if (state.score > state.best) {
    state.best = state.score;
    localStorage.setItem('statquest-best', String(state.best));
  }
  updateStats();
  feedback.hidden = false;
  nextBtn.hidden = false;
}

function makeDescriptive() {
  const level = state.difficulty;
  let data;
  if (level === 'Beginner') {
    const base = [rand(2, 8), rand(2, 8), rand(2, 8), rand(2, 8), rand(2, 8)];
    if (new Set(base).size === base.length) base[4] = base[1];
    data = base;
  } else if (level === 'Intermediate') {
    data = Array.from({ length: 7 }, () => rand(5, 25));
  } else {
    data = Array.from({ length: 8 }, () => rand(-5, 30));
  }
  const stat = choice(['mean', 'median', 'mode']);
  const sorted = [...data].sort((a,b) => a-b);
  let answer, explanation;
  if (stat === 'mean') {
    answer = round(data.reduce((a,b)=>a+b,0)/data.length, 2);
    explanation = `The mean is the total divided by ${data.length}, giving ${answer}.`;
  } else if (stat === 'median') {
    answer = data.length % 2 ? sorted[(data.length-1)/2] : round((sorted[data.length/2-1]+sorted[data.length/2])/2,2);
    explanation = `After sorting the data, the middle value is ${answer}.`;
  } else {
    const counts = {};
    data.forEach(x => counts[x] = (counts[x] || 0) + 1);
    const max = Math.max(...Object.values(counts));
    const modes = Object.entries(counts).filter(([,v]) => v === max).map(([k])=>Number(k));
    if (max === 1 || modes.length > 1) {
      return makeDescriptive();
    }
    answer = modes[0];
    explanation = `${answer} occurs most often in the dataset.`;
  }
  const offsets = level === 'Advanced' ? [1, 2, 3] : [1, 2, 4];
  const opts = uniqueOptions(String(answer), offsets.map(o => String(round(Number(answer) + choice([-o, o]),2))));
  return {
    title: `Find the ${stat}`,
    prompt: 'Choose the correct value for this dataset.',
    visualHTML: `<div class="data-row">${data.map(x=>`<span class="data-chip">${x}</span>`).join('')}</div>`,
    options: opts,
    answer: String(answer),
    explanation,
  };
}

function makeProbability() {
  const level = state.difficulty;
  const type = choice(level === 'Beginner' ? ['coin','die','cards'] : ['coin2','die2','cards','complement']);
  let title, prompt, answer, explanation, distractors;

  if (type === 'coin') {
    title = 'Coin flip'; prompt = 'A fair coin is tossed once. What is P(Heads)?';
    answer = '1/2'; distractors = ['1/4','1/3','2/3']; explanation = 'A fair coin has 2 equally likely outcomes, and 1 is Heads.';
  } else if (type === 'die') {
    const target = rand(1,6); title = 'Single die'; prompt = `A fair six-sided die is rolled. What is P(rolling a ${target})?`;
    answer = '1/6'; distractors = ['1/3','1/2','5/6']; explanation = 'There is 1 favorable face out of 6 equally likely faces.';
  } else if (type === 'cards') {
    title = 'Card draw'; prompt = 'One card is drawn from a standard 52-card deck. What is P(drawing a heart)?';
    answer = '1/4'; distractors = ['1/13','1/2','3/4']; explanation = 'There are 13 hearts out of 52 cards, so 13/52 = 1/4.';
  } else if (type === 'coin2') {
    title = 'Two coin tosses'; prompt = 'Two fair coins are tossed. What is P(getting exactly one Head)?';
    answer = '1/2'; distractors = ['1/4','1/3','3/4']; explanation = 'The outcomes HH, HT, TH, TT are equally likely; HT and TH work, so 2/4 = 1/2.';
  } else if (type === 'die2') {
    title = 'Sum of two dice'; prompt = 'Two fair dice are rolled. What is P(the sum is 7)?';
    answer = '1/6'; distractors = ['1/12','1/9','1/3']; explanation = 'There are 6 ways to make 7 out of 36 equally likely ordered outcomes, so 6/36 = 1/6.';
  } else {
    title = 'Complement rule'; prompt = 'If P(rain tomorrow) = 0.30, what is P(no rain tomorrow)?';
    answer = '0.70'; distractors = ['0.30','0.40','1.30']; explanation = 'A complement has probability 1 − 0.30 = 0.70.';
  }
  return { title, prompt, options: shuffle([answer,...distractors]), answer, explanation };
}

function makeDistribution() {
  const sets = [
    { a:'Binomial', s:'Number of defective items in a sample of 20 products, where each item is defective or not.', e:'A fixed number of independent trials with two outcomes fits a Binomial model.' },
    { a:'Poisson', s:'Number of customer arrivals at a help desk in one hour.', e:'Counts of events in a fixed interval are commonly modeled with a Poisson distribution.' },
    { a:'Normal', s:'Adult heights in a large, fairly homogeneous population.', e:'A continuous variable shaped by many small effects is often approximately Normal.' },
    { a:'Uniform', s:'A random number generated anywhere between 0 and 1 with equal likelihood.', e:'Every value in the interval is equally likely under a Uniform distribution.' },
    { a:'Exponential', s:'Waiting time until the next call arrives at a call centre.', e:'Waiting time between Poisson-type events is commonly modeled with an Exponential distribution.' },
  ];
  const allowed = state.difficulty === 'Beginner' ? sets.slice(0,4) : sets;
  const q = choice(allowed);
  const distractors = shuffle(allowed.filter(x => x.a !== q.a)).slice(0, 3).map(x => x.a);
  return {
    title: 'Which distribution fits best?',
    prompt: q.s,
    options: shuffle([q.a, ...distractors]),
    answer: q.a,
    explanation: q.e,
  };
}

function makeOutlier() {
  const n = state.difficulty === 'Beginner' ? 7 : 9;
  const centre = rand(20, 60);
  const spread = state.difficulty === 'Advanced' ? 8 : 5;
  const normal = Array.from({length:n-1},()=> centre + rand(-spread, spread));
  const outlier = centre + choice([-1,1]) * rand(spread + 18, spread + 35);
  const data = shuffle([...normal, outlier]);
  const distractors = shuffle(normal).slice(0,3).map(String);
  return {
    title: 'Spot the outlier',
    prompt: 'Which observation is clearly separated from the rest?',
    visualHTML: `<div class="data-row">${data.map(x=>`<span class="data-chip">${x}</span>`).join('')}</div>`,
    options: shuffle([String(outlier), ...distractors]),
    answer: String(outlier),
    explanation: `${outlier} lies far from the cluster of the other observations, so it is the strongest outlier candidate.`,
  };
}

function makeCorrelation() {
  const kinds = state.difficulty === 'Advanced'
    ? ['Strong positive','Weak positive','Strong negative','Weak negative','No correlation']
    : ['Positive correlation','Negative correlation','No correlation'];
  const kind = choice(kinds);
  const points = [];
  const n = 28;
  for (let i=0;i<n;i++) {
    const x = i/(n-1);
    let y;
    if (kind.includes('positive') || kind === 'Positive correlation') {
      const noise = kind.startsWith('Weak') ? .28 : .10;
      y = .15 + .7*x + (Math.random()-.5)*noise;
    } else if (kind.includes('negative') || kind === 'Negative correlation') {
      const noise = kind.startsWith('Weak') ? .28 : .10;
      y = .85 - .7*x + (Math.random()-.5)*noise;
    } else {
      y = .15 + Math.random()*.7;
    }
    points.push([x, Math.max(.05, Math.min(.95,y))]);
  }
  const options = state.difficulty === 'Advanced'
    ? shuffle(['Strong positive','Weak positive','Strong negative','Weak negative','No correlation'])
    : shuffle(['Positive correlation','Negative correlation','No correlation']);
  return {
    title: 'Read the scatterplot',
    prompt: 'Which description best matches the relationship?',
    options,
    answer: kind,
    explanation: `The overall pattern is best described as ${kind.toLowerCase()}.`,
    draw(container) {
      const canvas = document.createElement('canvas');
      canvas.width = 620; canvas.height = 360;
      container.appendChild(canvas);
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0,0,canvas.width,canvas.height);
      ctx.strokeStyle = '#9aa8ba'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(54,24); ctx.lineTo(54,310); ctx.lineTo(594,310); ctx.stroke();
      ctx.fillStyle = '#39506a'; ctx.font = '14px system-ui';
      ctx.fillText('Y', 24, 28); ctx.fillText('X', 590, 338);
      points.forEach(([x,y]) => {
        const px = 62 + x*520; const py = 302 - y*260;
        ctx.beginPath(); ctx.arc(px,py,5,0,Math.PI*2); ctx.fillStyle='#4b6fff'; ctx.fill();
      });
    }
  };
}

// Navigation and controls
[...document.querySelectorAll('[data-start]')].forEach(el => {
  el.addEventListener('click', () => startGame(el.dataset.start));
  el.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); startGame(el.dataset.start); }
  });
});

document.getElementById('backBtn').addEventListener('click', goHome);
document.getElementById('changeGameBtn').addEventListener('click', goHome);
document.getElementById('brandHome').addEventListener('click', e => { e.preventDefault(); goHome(); });
nextBtn.addEventListener('click', nextQuestion);

document.getElementById('resetBtn').addEventListener('click', () => {
  state.score = 0; state.streak = 0; state.answered = 0; updateStats();
});

difficultyBtn.addEventListener('click', () => { difficultyMenu.hidden = !difficultyMenu.hidden; });
difficultyMenu.querySelectorAll('button').forEach(btn => {
  btn.addEventListener('click', () => {
    state.difficulty = btn.dataset.level;
    difficultyMenu.hidden = true;
    updateStats();
    if (gameView.classList.contains('active')) nextQuestion();
  });
});

document.addEventListener('click', e => {
  if (!difficultyMenu.contains(e.target) && e.target !== difficultyBtn) difficultyMenu.hidden = true;
});

const howDialog = document.getElementById('howDialog');
document.getElementById('howBtn').addEventListener('click', () => howDialog.showModal());
document.getElementById('dialogClose').addEventListener('click', () => howDialog.close());

updateStats();
