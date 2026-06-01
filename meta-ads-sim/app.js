/* ======================================================
   MetaSim — Meta Ads Practice Simulator
   Full simulation engine, scoring, and UI logic
   ====================================================== */

// ============================================================
// CONSTANTS
// ============================================================

const CTA_LABELS = {
  shop_now:'Shop Now', learn_more:'Learn More', sign_up:'Sign Up',
  get_offer:'Get Offer', buy_now:'Buy Now', subscribe:'Subscribe',
  book_now:'Book Now', contact_us:'Contact Us', download:'Download',
  watch_more:'Watch More', apply_now:'Apply Now'
};

const OBJECTIVE_ICONS = {
  sales:'🛒', leads:'📋', traffic:'🌐', awareness:'👁', engagement:'💬', app:'📱'
};

const INTEREST_CATEGORIES = {
  'Shopping & Fashion': ['Online Shopping','Fashion','Luxury Goods','Beauty Products','Clothing & Apparel','Shoes','Jewelry'],
  'Health & Fitness': ['Fitness & Wellness','Weight Loss','Nutrition','Yoga','Running','Gym & Workout','Supplements'],
  'Business & Finance': ['Entrepreneurship','Personal Finance','Investing','Real Estate','Marketing','Small Business','Sales'],
  'Home & Garden': ['Home Improvement','Interior Design','Gardening','DIY & Crafts','Furniture','Kitchen & Cooking'],
  'Food & Drink': ['Cooking','Restaurants','Coffee','Baking','Wine & Spirits','Healthy Eating','Food Delivery'],
  'Technology': ['Technology','Consumer Electronics','Gaming','Software','AI & Machine Learning','Gadgets','Coding'],
  'Entertainment': ['Movies','Music','TV Shows & Streaming','Books','Podcasts','Comedy','Sports Events'],
  'Travel': ['Travel','Adventure Travel','Luxury Travel','Backpacking','Beach Vacations','Hotels'],
  'Sports': ['Football','Basketball','Soccer','Golf','Tennis','Baseball','Cycling','Swimming'],
  'Parenting': ['Parenting','Babies & Toddlers','Moms','Kids Education','Family Activities'],
  'Pets': ['Dogs','Cats','Pet Care','Dog Training','Pet Products'],
  'Education': ['Online Learning','Courses & Certifications','Self Improvement','Career Development'],
};

const POWER_WORDS = [
  'free','new','proven','guaranteed','exclusive','secret','discover','instantly',
  'amazing','powerful','revolutionary','effortless','transform','save','boost',
  'unlock','ultimate','best','fastest','easiest','natural','limited','official',
  'results','winning','trusted','tested','breakthrough','simple','fast','quick'
];

const URGENCY_WORDS = ['limited','today','now','hurry','last','only','expires','deadline','urgent','act fast','don\'t miss','ends soon'];
const SOCIAL_PROOF = ['customers','reviews','people','trusted','rated','stars','5-star','testimonial','sold','bought','members','community'];
const BENEFIT_WORDS = ['save','earn','lose','gain','grow','increase','reduce','improve','boost','achieve','get','results','profit','win','succeed'];

// ============================================================
// STATE
// ============================================================

let state = {
  balance: 1000,
  spent: 0,
  revenue: 0,
  campaigns: [],
  currentStep: 1,
  simulationSpeed: 1,
  simulationTimer: null,
  wizard: freshWizard()
};

function freshWizard() {
  return {
    objective: null,
    productName: '',
    sellingPrice: 0,
    productCost: 0,
    landingPage: 'vsl',
    campaignName: '',
    budget: { type: 'daily', amount: 50 },
    duration: 7,
    audience: {
      locations: ['United States'],
      ageMin: 25,
      ageMax: 54,
      gender: 'all',
      interests: []
    },
    creative: {
      format: 'image',
      imageDesc: '',
      primaryText: '',
      headline: '',
      description: '',
      cta: 'shop_now',
      pageName: ''
    }
  };
}

// ============================================================
// NAVIGATION
// ============================================================

function navigate(view) {
  document.querySelectorAll('.view').forEach(v => {
    v.classList.remove('active');
    v.classList.add('hidden');
  });
  const el = document.getElementById('view-' + view);
  if (el) {
    el.classList.remove('hidden');
    el.classList.add('active');
  }

  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const navEl = document.querySelector(`[data-view="${view}"]`);
  if (navEl) navEl.classList.add('active');

  const titles = { dashboard: 'Dashboard', campaigns: 'Campaigns', create: 'Create Campaign', results: 'Campaign Results' };
  document.getElementById('page-title').textContent = titles[view] || 'MetaSim';

  if (view === 'dashboard') renderDashboard();
}

function startNewCampaign() {
  state.wizard = freshWizard();
  state.currentStep = 1;
  navigate('create');
  renderStep(1);
  document.getElementById('page-title').textContent = 'Create Campaign';
}

function cancelWizard() {
  navigate('dashboard');
}

function goToStep(n) {
  if (n < 1 || n > 5) return;

  // Validate current step
  if (n > state.currentStep) {
    const err = validateStep(state.currentStep);
    if (err) { showToast(err, 'error'); return; }
    collectStep(state.currentStep);
  }

  state.currentStep = n;
  renderStep(n);

  if (n === 5) runAnalysis();
}

function renderStep(n) {
  for (let i = 1; i <= 5; i++) {
    const step = document.getElementById('step-' + i);
    if (step) step.classList.toggle('hidden', i !== n);

    const node = document.getElementById('node-' + i);
    if (node) {
      node.classList.toggle('active', i === n);
      node.classList.toggle('done', i < n);
    }

    if (i < 5) {
      const conn = document.getElementById('conn-' + i);
      if (conn) conn.classList.toggle('done', i < n);
    }
  }

  const backBtn = document.getElementById('wizard-back-btn');
  backBtn.textContent = n === 1 ? '← Cancel' : '← Back';
  backBtn.onclick = n === 1 ? cancelWizard : () => goToStep(n - 1);

  document.getElementById('page-title').textContent = [
    '', 'Step 1: Objective', 'Step 2: Budget', 'Step 3: Audience',
    'Step 4: Creative', 'Step 5: AI Review'
  ][n];

  if (n === 2) updateBudgetUI();
  if (n === 3) {
    renderInterestsUI('');
    renderLocationTags();
    updateAudienceMeter();
  }
  if (n === 4) updatePreview();
}

function validateStep(n) {
  if (n === 1) {
    if (!state.wizard.objective) return 'Please select a campaign objective.';
    if (['sales','leads'].includes(state.wizard.objective)) {
      const price = parseFloat(document.getElementById('inp-selling-price')?.value);
      if (!price || price <= 0) return 'Please enter a selling price for your offer.';
    }
  }
  if (n === 2) {
    const budget = parseFloat(document.getElementById('inp-budget')?.value);
    if (!budget || budget < 5) return 'Please set a daily budget of at least $5.';
  }
  if (n === 4) {
    const headline = document.getElementById('inp-headline')?.value?.trim();
    const primaryText = document.getElementById('inp-primary-text')?.value?.trim();
    if (!headline) return 'Please write a headline for your ad.';
    if (!primaryText) return 'Please write primary text (ad copy) for your ad.';
  }
  return null;
}

function collectStep(n) {
  const w = state.wizard;
  if (n === 1) {
    w.productName = val('inp-product-name');
    w.sellingPrice = parseFloat(val('inp-selling-price')) || 0;
    w.productCost = parseFloat(val('inp-product-cost')) || 0;
    w.landingPage = val('inp-landing-page') || 'vsl';
    w.campaignName = val('inp-campaign-name') || `${OBJECTIVE_ICONS[w.objective] || ''} Campaign ${state.campaigns.length + 1}`;
  }
  if (n === 2) {
    w.budget.amount = parseFloat(val('inp-budget')) || 50;
    w.budget.type = document.getElementById('btn-daily')?.classList.contains('active') ? 'daily' : 'lifetime';
  }
  if (n === 3) {
    w.audience.ageMin = parseInt(val('inp-age-min')) || 25;
    w.audience.ageMax = parseInt(val('inp-age-max')) || 54;
    const genderRadio = document.querySelector('input[name="gender"]:checked');
    w.audience.gender = genderRadio ? genderRadio.value : 'all';
  }
  if (n === 4) {
    w.creative.imageDesc = val('inp-img-desc');
    w.creative.primaryText = val('inp-primary-text');
    w.creative.headline = val('inp-headline');
    w.creative.description = val('inp-description');
    w.creative.cta = val('inp-cta') || 'shop_now';
    w.creative.pageName = val('inp-page-name') || 'Your Brand';
    w.creative.format = document.querySelector('.format-pill.active')?.dataset.fmt || 'image';
    // mediaUrl/mediaType/mediaName are set live by handleMediaUpload, preserve them
  }
}

function val(id) {
  return document.getElementById(id)?.value?.trim() || '';
}

// ============================================================
// STEP 1: OBJECTIVE
// ============================================================

function selectObjective(obj) {
  state.wizard.objective = obj;
  document.querySelectorAll('.obj-card').forEach(c => {
    c.classList.toggle('selected', c.dataset.obj === obj);
  });

  const section = document.getElementById('product-section');
  if (['sales', 'leads'].includes(obj)) {
    section.classList.remove('hidden');
  } else {
    section.classList.add('hidden');
  }
}

// ============================================================
// STEP 2: BUDGET
// ============================================================

function setBudgetType(type) {
  document.getElementById('btn-daily').classList.toggle('active', type === 'daily');
  document.getElementById('btn-lifetime').classList.toggle('active', type === 'lifetime');
  document.getElementById('budget-unit-label').textContent = type === 'daily' ? '/ day' : 'total';
  state.wizard.budget.type = type;
  updateBudgetUI();
}

function setDuration(days) {
  document.querySelectorAll('.dur-card').forEach(c => c.classList.remove('active'));
  const card = document.querySelector(`.dur-card[data-days="${days}"]`);
  if (card) card.classList.add('active');

  if (days === 'custom') {
    const inp = document.getElementById('inp-custom-days');
    if (inp) { inp.style.display = ''; inp.focus(); }
    state.wizard.duration = parseInt(inp?.value) || 14;
  } else {
    const inp = document.getElementById('inp-custom-days');
    if (inp) inp.style.display = 'none';
    state.wizard.duration = days;
  }
  updateBudgetUI();
}

function updateCustomDuration() {
  const v = parseInt(document.getElementById('inp-custom-days')?.value);
  if (v && v > 0) { state.wizard.duration = v; updateBudgetUI(); }
}

function updateBudgetUI() {
  const budget = parseFloat(document.getElementById('inp-budget')?.value) || 50;
  const slider = document.getElementById('budget-slider');
  if (slider) slider.value = budget;

  const durations = [7, 14, 30];
  durations.forEach(d => {
    const el = document.getElementById('dur-' + d);
    if (el) el.textContent = '$' + fmt$(budget * d);
  });

  const totalSpend = budget * (state.wizard.duration || 7);
  const warnTotal = document.getElementById('warn-total');
  const warnAvail = document.getElementById('warn-avail');
  const warnBanner = document.getElementById('budget-warning');
  if (warnTotal) warnTotal.textContent = '$' + fmt$(totalSpend);
  if (warnAvail) warnAvail.textContent = '$' + fmt$(state.balance);
  if (warnBanner) warnBanner.classList.toggle('hidden', totalSpend <= state.balance);
}

document.addEventListener('change', e => {
  if (e.target.id === 'inp-budget' || e.target.id === 'budget-slider') {
    const v = parseFloat(e.target.value) || 50;
    document.getElementById('inp-budget').value = v;
    document.getElementById('budget-slider').value = v;
    state.wizard.budget.amount = v;
    updateBudgetUI();
  }
});
document.addEventListener('input', e => {
  if (e.target.id === 'inp-budget' || e.target.id === 'budget-slider') {
    const v = parseFloat(e.target.value) || 50;
    if (e.target.id === 'inp-budget') document.getElementById('budget-slider').value = v;
    if (e.target.id === 'budget-slider') document.getElementById('inp-budget').value = v;
    state.wizard.budget.amount = v;
    updateBudgetUI();
  }
});

// ============================================================
// STEP 3: AUDIENCE
// ============================================================

function addLocation() {
  const inp = document.getElementById('inp-location');
  const loc = inp.value.trim();
  if (!loc) return;
  if (!state.wizard.audience.locations.includes(loc)) {
    state.wizard.audience.locations.push(loc);
    renderLocationTags();
    updateAudienceMeter();
  }
  inp.value = '';
}

document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && e.target.id === 'inp-location') addLocation();
});

function removeLocation(loc) {
  state.wizard.audience.locations = state.wizard.audience.locations.filter(l => l !== loc);
  renderLocationTags();
  updateAudienceMeter();
}

function renderLocationTags() {
  const wrap = document.getElementById('location-tags');
  if (!wrap) return;
  wrap.innerHTML = state.wizard.audience.locations.map(loc =>
    `<div class="tag">${loc}<span class="tag-remove" onclick="removeLocation('${loc}')">×</span></div>`
  ).join('');
  if (state.wizard.audience.locations.length === 0) {
    state.wizard.audience.locations = ['United States'];
    renderLocationTags();
  }
}

function renderInterestsUI(filter) {
  const container = document.getElementById('interests-container');
  if (!container) return;
  const filterLower = (filter || '').toLowerCase();

  let html = '';
  for (const [cat, items] of Object.entries(INTEREST_CATEGORIES)) {
    const filtered = items.filter(i => !filterLower || i.toLowerCase().includes(filterLower));
    if (!filtered.length) continue;
    html += `<div class="interest-category">
      <div class="interest-category-name">${cat}</div>
      <div class="interest-pills">
        ${filtered.map(i => {
          const sel = state.wizard.audience.interests.includes(i);
          return `<div class="interest-pill ${sel ? 'selected' : ''}" onclick="toggleInterest('${i}')">${i}</div>`;
        }).join('')}
      </div>
    </div>`;
  }
  container.innerHTML = html;
  renderSelectedInterestTags();
  updateAudienceMeter();
}

function filterInterests(v) {
  renderInterestsUI(v);
}

function toggleInterest(interest) {
  const idx = state.wizard.audience.interests.indexOf(interest);
  if (idx === -1) {
    state.wizard.audience.interests.push(interest);
  } else {
    state.wizard.audience.interests.splice(idx, 1);
  }
  renderInterestsUI(document.getElementById('inp-interest-search')?.value || '');
}

function renderSelectedInterestTags() {
  const wrap = document.getElementById('selected-interest-tags');
  const badge = document.getElementById('interest-count-badge');
  if (!wrap) return;
  wrap.innerHTML = state.wizard.audience.interests.map(i =>
    `<div class="tag">${i}<span class="tag-remove" onclick="toggleInterest('${i}')">×</span></div>`
  ).join('');
  if (badge) badge.textContent = state.wizard.audience.interests.length;
}

function updateAudienceMeter() {
  const { locations, ageMin, ageMax, gender, interests } = state.wizard.audience;
  const ageMn = parseInt(document.getElementById('inp-age-min')?.value || ageMin);
  const ageMx = parseInt(document.getElementById('inp-age-max')?.value || ageMax);
  const ageRange = (ageMx - ageMn);
  const numLocations = locations.length;
  const numInterests = interests.length;

  // Estimate audience in millions
  let basePop = 230; // US adult population in millions
  if (locations.includes('United States') || locations.length === 0) basePop = 230;
  else if (locations.length === 1 && !locations[0].includes(',')) basePop = 180;
  else basePop = 50 * locations.length;

  const ageFraction = Math.min(1, ageRange / 47);
  let genderFactor = gender === 'all' ? 1 : 0.52;
  let interestFactor = numInterests === 0 ? 1 : Math.max(0.05, 1 - numInterests * 0.08);

  let estimate = basePop * ageFraction * genderFactor * interestFactor;
  estimate = Math.max(0.1, Math.min(300, estimate));

  const label = document.getElementById('audience-size-label');
  if (label) {
    if (estimate < 1) label.textContent = `${Math.round(estimate * 1000)}K people`;
    else if (estimate < 10) label.textContent = `${estimate.toFixed(1)}M people`;
    else label.textContent = `${Math.round(estimate)}M people`;
  }

  // Needle position: 0% = too specific (<500K), 50% = sweet spot (1M-15M), 100% = too broad (>80M)
  let needlePos;
  if (estimate < 0.5) needlePos = 5;
  else if (estimate < 1) needlePos = 15;
  else if (estimate < 3) needlePos = 30;
  else if (estimate < 15) needlePos = 50;
  else if (estimate < 40) needlePos = 65;
  else if (estimate < 80) needlePos = 80;
  else needlePos = 92;

  const needle = document.getElementById('audience-needle');
  if (needle) needle.style.left = needlePos + '%';

  state.wizard._audienceEstimate = estimate;
}

// ============================================================
// STEP 4: CREATIVE PREVIEW
// ============================================================

const FORMAT_RATIOS = {
  image: { ratio: '4/5', label: 'Facebook / Instagram Feed', minHeight: '180px' },
  story: { ratio: '9/16', label: 'Story / Reel', minHeight: '360px' },
  carousel: { ratio: '1/1', label: 'Carousel', minHeight: '180px' },
  video: { ratio: '16/9', label: 'In-Stream Video', minHeight: '140px' },
};

function setFormat(fmt) {
  document.querySelectorAll('.format-pill').forEach(p => p.classList.toggle('active', p.dataset.fmt === fmt));

  const cfg = FORMAT_RATIOS[fmt] || FORMAT_RATIOS.image;
  const media = document.getElementById('prev-media');
  const mediaInner = document.getElementById('prev-media-inner');
  if (media) {
    media.style.aspectRatio = cfg.ratio;
    media.style.minHeight = cfg.minHeight;
  }
  if (mediaInner) {
    mediaInner.style.minHeight = cfg.minHeight;
  }

  const sponsoredEl = document.querySelector('.preview-sponsored span');
  if (sponsoredEl) sponsoredEl.textContent = cfg.label;
}

function handleMediaUpload(input) {
  const file = input.files[0];
  if (!file) return;
  loadMediaFile(file);
}

function handleMediaDrop(e) {
  e.preventDefault();
  document.getElementById('upload-drop-zone').classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (!file) return;
  loadMediaFile(file);
}

function loadMediaFile(file) {
  if (file.size > 20 * 1024 * 1024) { showToast('File too large (max 20MB)', 'error'); return; }
  const reader = new FileReader();
  reader.onload = e => {
    const dataUrl = e.target.result;
    state.wizard.creative.mediaUrl = dataUrl;
    state.wizard.creative.mediaType = file.type.startsWith('video') ? 'video' : 'image';
    state.wizard.creative.mediaName = file.name;

    // Show preview in drop zone
    document.getElementById('upload-placeholder').classList.add('hidden');
    const wrap = document.getElementById('upload-preview-wrap');
    wrap.classList.remove('hidden');
    document.getElementById('upload-preview-img').src = dataUrl;
    document.getElementById('upload-file-name').textContent = file.name;

    // Push into phone preview
    updatePreview();
  };
  reader.readAsDataURL(file);
}

function removeMedia() {
  state.wizard.creative.mediaUrl = null;
  state.wizard.creative.mediaType = null;
  state.wizard.creative.mediaName = null;
  document.getElementById('inp-img-file').value = '';
  document.getElementById('upload-placeholder').classList.remove('hidden');
  document.getElementById('upload-preview-wrap').classList.add('hidden');
  document.getElementById('upload-preview-img').src = '';
  updatePreview();
}

function updatePreview() {
  const headline = val('inp-headline') || 'Your Headline';
  const bodyText = val('inp-primary-text') || 'Your primary text will appear here...';
  const desc = val('inp-description');
  const cta = val('inp-cta') || 'shop_now';
  const imgDesc = val('inp-img-desc');
  const pageName = val('inp-page-name') || 'Your Brand';

  const el = id => document.getElementById(id);
  if (el('prev-headline')) el('prev-headline').textContent = headline;
  if (el('prev-body-text')) el('prev-body-text').textContent = bodyText.substring(0, 120) + (bodyText.length > 120 ? '...' : '');
  if (el('prev-desc')) el('prev-desc').textContent = desc;
  if (el('prev-cta-btn')) el('prev-cta-btn').textContent = CTA_LABELS[cta] || 'Shop Now';
  if (el('prev-page-name')) el('prev-page-name').textContent = pageName;
  if (el('prev-avatar-letter')) el('prev-avatar-letter').textContent = pageName.charAt(0).toUpperCase() || 'A';
  // Show uploaded image or description placeholder in phone preview
  const mediaUrl = state.wizard.creative?.mediaUrl;
  const mediaInner = document.getElementById('prev-media-inner');
  const placeholder = document.getElementById('prev-media-placeholder');
  if (mediaInner && mediaUrl) {
    mediaInner.style.backgroundImage = `url(${mediaUrl})`;
    mediaInner.style.backgroundSize = 'cover';
    mediaInner.style.backgroundPosition = 'center';
    mediaInner.style.minHeight = '160px';
    if (placeholder) placeholder.style.display = 'none';
  } else if (mediaInner) {
    mediaInner.style.backgroundImage = '';
    if (placeholder) placeholder.style.display = '';
    if (el('prev-img-desc-short')) el('prev-img-desc-short').textContent = imgDesc ? imgDesc.substring(0, 80) + (imgDesc.length > 80 ? '...' : '') : 'Upload or describe your creative above';
  }
}

function countChars(inputId, counterId, max) {
  const inp = document.getElementById(inputId);
  const ctr = document.getElementById(counterId);
  if (inp && ctr) {
    ctr.textContent = inp.value.length;
    ctr.style.color = inp.value.length > max * 0.9 ? '#d93025' : '';
  }
}

function id(str) { return document.getElementById(str); }

// ============================================================
// SCORING ENGINE
// ============================================================

function scoreCreative(creative) {
  let score = 0;
  const tips = [];

  const headline = (creative.headline || '').toLowerCase();
  const primaryText = (creative.primaryText || '').toLowerCase();
  const imgDesc = (creative.imageDesc || '').toLowerCase();
  const headlineWords = creative.headline.trim().split(/\s+/).filter(Boolean);

  // --- Headline (30 pts) ---
  let hlScore = 0;
  if (headlineWords.length >= 4 && headlineWords.length <= 10) { hlScore += 15; tips.push({t:'Headline length is ideal (4–10 words)', type:'good'}); }
  else if (headlineWords.length < 4) { hlScore += 6; tips.push({t:'Headline too short — aim for 5–9 words', type:'warn'}); }
  else { hlScore += 8; tips.push({t:'Headline a bit long — consider trimming', type:'warn'}); }

  const powerCount = POWER_WORDS.filter(w => headline.includes(w)).length;
  if (powerCount >= 2) { hlScore += 8; tips.push({t:`Strong power words detected: ${POWER_WORDS.filter(w=>headline.includes(w)).slice(0,3).join(', ')}`, type:'good'}); }
  else if (powerCount === 1) { hlScore += 4; tips.push({t:'Add 1–2 more power words to strengthen the headline', type:'warn'}); }
  else { tips.push({t:'No power words detected — add urgency or value words', type:'bad'}); }

  if (/\d/.test(creative.headline)) { hlScore += 5; tips.push({t:'Numbers in headline boost click-through rates', type:'good'}); }
  if (creative.headline.includes('—') || creative.headline.includes(':') || creative.headline.includes('?')) { hlScore += 2; }

  score += Math.min(30, hlScore);

  // --- Primary Text (35 pts) ---
  let ptScore = 0;
  const ptLen = primaryText.length;
  if (ptLen >= 80 && ptLen <= 300) { ptScore += 10; tips.push({t:'Copy length is in the sweet spot', type:'good'}); }
  else if (ptLen < 40) { ptScore += 3; tips.push({t:'Copy is too short — add more detail and persuasion', type:'bad'}); }
  else { ptScore += 6; tips.push({t:'Very long copy — consider trimming to 80–250 characters', type:'warn'}); }

  const benefitCount = BENEFIT_WORDS.filter(w => primaryText.includes(w)).length;
  if (benefitCount >= 2) { ptScore += 10; tips.push({t:'Benefit-focused copy — excellent', type:'good'}); }
  else { tips.push({t:'Lead with benefits not features (save, earn, lose, gain...)', type:'warn'}); }

  const proofCount = SOCIAL_PROOF.filter(w => primaryText.includes(w)).length;
  if (proofCount >= 1) { ptScore += 8; tips.push({t:'Social proof detected — builds trust', type:'good'}); }
  else { tips.push({t:'Add social proof: customer count, reviews, or testimonials', type:'bad'}); }

  const urgencyCount = URGENCY_WORDS.filter(w => primaryText.includes(w)).length;
  if (urgencyCount >= 1) { ptScore += 5; tips.push({t:'Urgency/scarcity element present', type:'good'}); }
  else { tips.push({t:'Add urgency: limited time, limited spots, ends soon...', type:'warn'}); }

  if (/\?/.test(creative.primaryText)) { ptScore += 2; }
  score += Math.min(35, ptScore);

  // --- Visual (20 pts) ---
  let visScore = 0;
  if (imgDesc.length > 30) { visScore += 5; }
  const hasFaces = /face|smile|person|woman|man|people|happy|model|human/.test(imgDesc);
  const hasProduct = /product|show|visible|display|feature/.test(imgDesc);
  const hasBrightColors = /bright|bold|contrast|color|vivid|pop|white background|clean/.test(imgDesc);
  const hasBeforeAfter = /before|after|comparison|transform|result/.test(imgDesc);
  if (hasFaces) { visScore += 5; tips.push({t:'Faces/people in creative increase engagement', type:'good'}); }
  else { tips.push({t:'Consider showing a person or face — boosts CTR significantly', type:'warn'}); }
  if (hasProduct) { visScore += 4; tips.push({t:'Product clearly visible — good for conversions', type:'good'}); }
  if (hasBrightColors) { visScore += 3; tips.push({t:'High contrast / bright colors attract attention', type:'good'}); }
  if (hasBeforeAfter) { visScore += 3; tips.push({t:'Before/after comparison is highly effective', type:'good'}); }
  score += Math.min(20, visScore);

  // --- CTA (15 pts) ---
  const ctaScores = { shop_now:15, buy_now:15, get_offer:13, sign_up:11, book_now:11, subscribe:10, learn_more:9, apply_now:10, download:9, contact_us:7, watch_more:8 };
  const ctaScore = ctaScores[creative.cta] || 8;
  score += Math.round(ctaScore * 0.15 * 10) / 10;
  if (ctaScore >= 13) tips.push({t:`Strong CTA: "${CTA_LABELS[creative.cta]}" drives action`, type:'good'});
  else tips.push({t:`Consider a stronger CTA like "Shop Now" or "Get Offer"`, type:'warn'});

  return { score: Math.round(Math.min(100, score)), tips };
}

function scoreAudience(wizard) {
  let score = 0;
  const tips = [];
  const { locations, ageMin, ageMax, gender, interests } = wizard.audience;
  const ageRange = (parseInt(ageMax) || 54) - (parseInt(ageMin) || 25);
  const numInterests = interests.length;
  const estimate = wizard._audienceEstimate || 30;

  // Audience size (30 pts)
  if (estimate >= 1 && estimate <= 15) { score += 30; tips.push({t:'Audience size is in the sweet spot (1M–15M)', type:'good'}); }
  else if (estimate < 0.5) { score += 8; tips.push({t:'Audience too small — broaden targeting or add locations', type:'bad'}); }
  else if (estimate < 1) { score += 16; tips.push({t:'Audience slightly small — consider broadening slightly', type:'warn'}); }
  else if (estimate < 30) { score += 22; tips.push({t:'Audience is good but slightly broad', type:'warn'}); }
  else { score += 10; tips.push({t:'Audience very broad — add interests to narrow it', type:'bad'}); }

  // Interests (35 pts)
  if (numInterests >= 2 && numInterests <= 5) { score += 35; tips.push({t:`${numInterests} interests selected — ideal targeting overlap`, type:'good'}); }
  else if (numInterests === 1) { score += 20; tips.push({t:'Add 2–4 more related interests for better targeting', type:'warn'}); }
  else if (numInterests > 5 && numInterests <= 10) { score += 25; tips.push({t:'Many interests may dilute targeting precision', type:'warn'}); }
  else if (numInterests > 10) { score += 15; tips.push({t:'Too many interests — focus on your best 3–6', type:'bad'}); }
  else { tips.push({t:'No interests selected — your ads will show to everyone, reducing relevance', type:'bad'}); }

  // Demographics (35 pts)
  if (ageRange <= 20) { score += 18; tips.push({t:'Tight age range increases ad relevance', type:'good'}); }
  else if (ageRange <= 35) { score += 12; }
  else { score += 6; tips.push({t:'Consider tightening age range to match your buyer persona', type:'warn'}); }

  if (gender !== 'all') { score += 10; tips.push({t:`Targeting ${gender === 'male' ? 'men' : 'women'} specifically improves relevance`, type:'good'}); }
  else { score += 5; tips.push({t:'Gender-specific targeting can improve relevance if your product skews one way', type:'warn'}); }

  if (locations.length === 1) { score += 7; tips.push({t:'Focused location targeting', type:'good'}); }
  else if (locations.length <= 3) { score += 5; }
  else { tips.push({t:'Many locations may spread budget too thin', type:'warn'}); }

  return { score: Math.round(Math.min(100, score)), tips };
}

function scoreOffer(wizard) {
  let score = 0;
  const tips = [];
  const obj = wizard.objective;

  if (!['sales', 'leads'].includes(obj)) {
    // Non-revenue objectives
    score = 65;
    tips.push({t:`${obj.charAt(0).toUpperCase()+obj.slice(1)} campaigns don't rely on product margin`, type:'good'});
    tips.push({t:'Focus on creative quality and audience targeting', type:'warn'});
    return { score, tips };
  }

  const price = wizard.sellingPrice || 0;
  const cost = wizard.productCost || 0;
  const margin = price > 0 ? (price - cost) / price : 0;

  // Margin (40 pts)
  if (margin >= 0.6) { score += 40; tips.push({t:`Great margin: ${Math.round(margin*100)}% — leaves room for profitable ads`, type:'good'}); }
  else if (margin >= 0.4) { score += 28; tips.push({t:`Decent margin: ${Math.round(margin*100)}% — workable but watch your CPA`, type:'warn'}); }
  else if (margin >= 0.2) { score += 16; tips.push({t:`Low margin: ${Math.round(margin*100)}% — you'll need a strong conversion rate`, type:'warn'}); }
  else { score += 6; tips.push({t:`Margin under 20% makes profitable ads very difficult`, type:'bad'}); }

  // Price point (30 pts)
  if (price >= 30 && price <= 97) { score += 30; tips.push({t:'Impulse-buy price range — high conversion potential', type:'good'}); }
  else if (price < 30) { score += 20; tips.push({t:'Low price point — need high volume to profit from ads', type:'warn'}); }
  else if (price <= 197) { score += 25; tips.push({t:'Mid-range price — needs strong sales page copy', type:'warn'}); }
  else { score += 15; tips.push({t:'High-ticket offer — longer buying cycle, but high ROAS potential', type:'warn'}); }

  // Landing page (30 pts)
  const lpScores = { vsl:30, sales:25, shopify:22, lead:20, webinar:18, booking:18 };
  score += lpScores[wizard.landingPage] || 15;
  const lpLabels = { vsl:'VSL pages typically convert at 2–4%', sales:'Long-form sales pages convert well for info products', shopify:'Product pages convert at ~1–3% for ecomm', lead:'Lead forms convert well but require nurturing', webinar:'Webinar funnels have high ROAS when live', booking:'Booking pages work great for service businesses' };
  tips.push({t: lpLabels[wizard.landingPage] || 'Track your landing page conversion rate', type:'good'});

  return { score: Math.round(Math.min(100, score)), tips };
}

function getOverallScore(cScore, aScore, oScore) {
  return Math.round(cScore * 0.40 + aScore * 0.30 + oScore * 0.30);
}

function getGrade(score) {
  if (score >= 85) return { grade: 'A+', verdict: 'Excellent Campaign', sub: 'This has the hallmarks of a high-performing ad', color: '#1a8917' };
  if (score >= 75) return { grade: 'A', verdict: 'Strong Campaign', sub: 'Good chance of positive ROI', color: '#1a8917' };
  if (score >= 65) return { grade: 'B', verdict: 'Above Average', sub: 'Should perform well with a quality offer', color: '#0866ff' };
  if (score >= 55) return { grade: 'C+', verdict: 'Average Campaign', sub: 'Will see results but leave money on the table', color: '#f59e0b' };
  if (score >= 45) return { grade: 'C', verdict: 'Below Average', sub: 'Needs work — use the tips to improve', color: '#f59e0b' };
  if (score >= 35) return { grade: 'D', verdict: 'Weak Campaign', sub: 'High risk of losing ad budget', color: '#d93025' };
  return { grade: 'F', verdict: 'Poor Campaign', sub: 'Likely to burn budget with little return', color: '#d93025' };
}

// ============================================================
// PERFORMANCE PREDICTION
// ============================================================

function predictPerformance(cScore, aScore, oScore, wizard) {
  // CPM: $6–$25 depending on audience competition
  const audienceCompetition = 1 - (aScore / 100);
  const cpm = 6 + audienceCompetition * 19;

  // CTR: 0.4%–4.5% based on creative score
  const ctr = 0.004 + (cScore / 100) * 0.041;

  // CVR: 0.3%–5% based on offer score + landing page
  const baseCvr = 0.003 + (oScore / 100) * 0.047;
  const cvr = ['sales','leads'].includes(wizard.objective) ? baseCvr : baseCvr * 0.3;

  // ROAS calculation
  const dailyBudget = wizard.budget.amount;
  const impressionsPerDay = (dailyBudget / cpm) * 1000;
  const clicksPerDay = impressionsPerDay * ctr;
  const conversionsPerDay = clicksPerDay * cvr;
  const revenuePerDay = conversionsPerDay * (wizard.sellingPrice || 0);
  const roas = dailyBudget > 0 ? revenuePerDay / dailyBudget : 0;

  return { cpm, ctr, cvr, roas, impressionsPerDay, clicksPerDay, conversionsPerDay };
}

// ============================================================
// STEP 5: AI ANALYSIS
// ============================================================

function runAnalysis() {
  collectStep(4);

  document.getElementById('analysis-loading').style.display = '';
  document.getElementById('analysis-results').classList.add('hidden');

  const stages = [
    [0, 'Reading creative signals...'],
    [20, 'Scoring headline and copy...'],
    [40, 'Analyzing audience targeting...'],
    [60, 'Evaluating offer strength...'],
    [80, 'Calculating projected performance...'],
    [95, 'Generating AI recommendations...']
  ];

  let si = 0;
  const bar = document.getElementById('loading-bar-fill');
  const status = document.getElementById('analysis-status');

  const tick = () => {
    if (si >= stages.length) {
      setTimeout(showAnalysisResults, 400);
      return;
    }
    const [pct, msg] = stages[si++];
    if (bar) bar.style.width = pct + '%';
    if (status) status.textContent = msg;
    setTimeout(tick, 500 + Math.random() * 300);
  };
  tick();
}

function showAnalysisResults() {
  const w = state.wizard;
  const creative = scoreCreative(w.creative);
  const audience = scoreAudience(w);
  const offer = scoreOffer(w);
  const overall = getOverallScore(creative.score, audience.score, offer.score);
  const grade = getGrade(overall);
  const perf = predictPerformance(creative.score, audience.score, offer.score, w);

  state.wizard._scores = { creative: creative.score, audience: audience.score, offer: offer.score, overall, perf };

  // Switch views
  document.getElementById('analysis-loading').style.display = 'none';
  const results = document.getElementById('analysis-results');
  results.classList.remove('hidden');

  // Score ring animation
  const circle = document.getElementById('ring-fill-circle');
  const circumference = 326.7;
  const offset = circumference - (overall / 100) * circumference;
  if (circle) {
    circle.style.stroke = grade.color;
    setTimeout(() => { circle.style.strokeDashoffset = offset; }, 100);
  }

  setText('ring-score', overall);
  setText('score-grade-badge', grade.grade);
  const gradeBadge = document.getElementById('score-grade-badge');
  if (gradeBadge) gradeBadge.style.color = grade.color;
  setText('score-verdict-text', grade.verdict);
  setText('score-sub-text', grade.sub);

  // Sub-scores
  animateSubScore('score-creative', 'fill-creative', creative.score, '#0866ff');
  animateSubScore('score-audience-ana', 'fill-audience', audience.score, '#7c3aed');
  animateSubScore('score-offer-ana', 'fill-offer', offer.score, '#1a8917');

  // Tips
  renderTips('tips-creative', creative.tips);
  renderTips('tips-audience', audience.tips);
  renderTips('tips-offer', offer.tips);

  // AI Narrative
  setText('ai-narrative', generateNarrative(w, creative.score, audience.score, offer.score, overall, perf));

  // Predicted performance
  setText('pred-cpm', '$' + perf.cpm.toFixed(2));
  setText('pred-ctr', (perf.ctr * 100).toFixed(2) + '%');
  setText('pred-cvr', (perf.cvr * 100).toFixed(2) + '%');
  const roasEl = document.getElementById('pred-roas');
  if (roasEl) {
    roasEl.textContent = perf.roas.toFixed(2) + 'x';
    roasEl.style.color = perf.roas >= 2 ? '#1a8917' : perf.roas >= 1 ? '#f59e0b' : '#d93025';
  }

  // Summary
  const totalSpend = w.budget.amount * w.duration;
  const totalConversions = perf.conversionsPerDay * w.duration;
  const totalRevenue = totalConversions * (w.sellingPrice || 0);
  const totalCOGS = totalConversions * (w.productCost || 0);
  const netProfit = totalRevenue - totalCOGS - totalSpend;

  setText('sum-objective', (OBJECTIVE_ICONS[w.objective] || '') + ' ' + (w.objective?.charAt(0).toUpperCase() + w.objective?.slice(1) || '—'));
  setText('sum-product', w.productName || (w.objective === 'traffic' ? 'Website traffic' : '—'));
  setText('sum-budget', '$' + fmt$(w.budget.amount) + '/day');
  setText('sum-duration', w.duration + ' days');
  setText('sum-spend', '$' + fmt$(totalSpend));
  setText('sum-audience', w._audienceEstimate ? formatAudienceSize(w._audienceEstimate) : '—');

  const profitEl = document.getElementById('sum-profit');
  if (['sales', 'leads'].includes(w.objective)) {
    if (profitEl) {
      profitEl.textContent = (netProfit >= 0 ? '+' : '') + '$' + fmt$(Math.abs(netProfit));
      profitEl.style.color = netProfit >= 0 ? '#1a8917' : '#d93025';
    }
    document.getElementById('sum-profit-row')?.classList.remove('hidden');
  } else {
    document.getElementById('sum-profit-row')?.classList.add('hidden');
  }
}

function animateSubScore(textId, fillId, score, color) {
  const el = document.getElementById(textId);
  const fill = document.getElementById(fillId);
  if (el) el.textContent = score + '/100';
  if (fill) {
    fill.style.background = color;
    setTimeout(() => { fill.style.width = score + '%'; }, 200);
  }
}

function renderTips(containerId, tips) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = tips.slice(0, 5).map(t =>
    `<li class="score-tip tip-${t.type}">${t.t}</li>`
  ).join('');
}

function generateNarrative(w, cScore, aScore, oScore, overall, perf) {
  const obj = w.objective;
  const productName = w.productName || 'your offer';
  const isRevenue = ['sales', 'leads'].includes(obj);

  const totalSpend = w.budget.amount * w.duration;
  const totalConversions = perf.conversionsPerDay * w.duration;
  const totalRevenue = totalConversions * (w.sellingPrice || 0);
  const totalCOGS = totalConversions * (w.productCost || 0);
  const netProfit = totalRevenue - totalCOGS - totalSpend;

  let narrative = '';

  if (overall >= 75) {
    narrative = `This is a strong campaign setup. Your creative scores well, your audience targeting looks focused, and ${isRevenue ? 'the offer economics make sense' : 'the objective is well-matched to your strategy'}. `;
  } else if (overall >= 55) {
    narrative = `This campaign has real potential but there are a few things holding it back. The fundamentals are there — now it's about tightening up the weaker areas. `;
  } else {
    narrative = `This campaign needs work before you should spend real budget on it. The scores indicate some key elements are missing that typically drive profitable ad performance. `;
  }

  if (cScore < 50) {
    narrative += `Your creative copy needs the most attention — specifically adding social proof, urgency, and leading with the core benefit (what's in it for the customer). `;
  }
  if (aScore < 50) {
    narrative += `Audience targeting is too broad — narrow it with specific interests that match your buyer persona. `;
  }

  if (isRevenue && w.sellingPrice > 0) {
    narrative += `\n\nWith ${w.duration} days at $${w.budget.amount}/day, you're projected to get ~${Math.round(totalConversions)} conversions at $${perf.cvr > 0 ? fmt$(w.budget.amount * w.duration / Math.max(1, totalConversions)) : '—'} CPA. `;
    if (netProfit > 0) {
      narrative += `Based on your margin, this campaign should be profitable — projected net profit of +$${fmt$(netProfit)}.`;
    } else if (netProfit > -totalSpend * 0.3) {
      narrative += `You'd be close to breaking even. Improving creative quality or landing page conversion rate could flip this to profitable.`;
    } else {
      narrative += `At current conversion rates, this campaign would lose money. Either raise your price, lower your ad budget until you test conversion rates, or significantly improve the creative.`;
    }
  }

  return narrative;
}

function formatAudienceSize(est) {
  if (est < 1) return Math.round(est * 1000) + 'K';
  if (est < 10) return est.toFixed(1) + 'M';
  return Math.round(est) + 'M';
}

// ============================================================
// LAUNCH CAMPAIGN
// ============================================================

function launchCampaign() {
  const w = state.wizard;
  if (!w._scores) return;

  const perf = w._scores.perf;
  const dailyBudget = w.budget.amount;
  const duration = w.duration;
  const totalSpend = dailyBudget * duration;

  if (totalSpend > state.balance) {
    showToast('Not enough budget! Reduce your campaign budget.', 'error');
    return;
  }

  // Build campaign object
  const campaign = {
    id: Date.now(),
    name: w.campaignName || 'Campaign ' + (state.campaigns.length + 1),
    objective: w.objective,
    productName: w.productName,
    sellingPrice: w.sellingPrice,
    productCost: w.productCost,
    dailyBudget,
    duration,
    scores: w._scores,
    perf,
    audience: { ...w.audience },
    creative: { ...w.creative },
    createdAt: new Date().toISOString(),
    dailyResults: [],
    totalSpend: 0,
    totalRevenue: 0,
    totalImpressions: 0,
    totalClicks: 0,
    totalConversions: 0,
    netProfit: 0
  };

  state.campaigns.push(campaign);
  state.wizard._campaign = campaign;

  navigate('results');
  startSimulation(campaign);
}

// ============================================================
// SIMULATION ENGINE
// ============================================================

function startSimulation(campaign) {
  document.getElementById('results-name').textContent = campaign.name;
  document.getElementById('sim-day-total').textContent = 'of ' + campaign.duration;
  document.getElementById('running-badge').style.display = '';
  setText('running-status-text', 'Simulating...');
  document.getElementById('final-breakdown').classList.add('hidden');

  // Reset metrics
  ['res-spend','res-impressions','res-clicks','res-conversions','res-revenue','res-profit'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = id.includes('spend') || id.includes('revenue') || id.includes('profit') ? '$0.00' : '0';
  });

  // Hide revenue card for non-revenue objectives
  const revCard = document.getElementById('revenue-card');
  if (revCard) revCard.style.display = ['sales','leads'].includes(campaign.objective) ? '' : 'none';

  // Generate daily results with realistic variance
  campaign.dailyResults = [];
  const { cpm, ctr, cvr } = campaign.perf;

  for (let day = 1; day <= campaign.duration; day++) {
    // Add realistic day-to-day variance (+/- 20%)
    const variance = () => 0.82 + Math.random() * 0.36;
    const dayCpm = cpm * variance();
    const dayCtr = ctr * variance();
    const dayCvr = cvr * variance();

    // Learning phase: days 1-3 slightly lower performance
    const learningFactor = day <= 3 ? 0.75 + day * 0.08 : 1;

    const impressions = Math.round((campaign.dailyBudget / dayCpm) * 1000 * learningFactor);
    const clicks = Math.round(impressions * dayCtr);
    const conversions = parseFloat((clicks * dayCvr).toFixed(2));
    const revenue = parseFloat((conversions * campaign.sellingPrice).toFixed(2));
    const cogs = parseFloat((conversions * campaign.productCost).toFixed(2));
    const spend = campaign.dailyBudget;
    const profit = parseFloat((revenue - cogs - spend).toFixed(2));

    campaign.dailyResults.push({ day, impressions, clicks, conversions, revenue, cogs, spend, profit });
  }

  // Chart data arrays
  campaign._chartData = { days: [], cumulativeProfit: [], cumulativeRevenue: [], cumulativeSpend: [] };

  state.simulationDay = 0;
  state.simulationSpeed = 1;
  runSimDay(campaign);
}

function runSimDay(campaign) {
  if (state.simulationTimer) clearTimeout(state.simulationTimer);

  if (state.simulationDay >= campaign.duration) {
    finishSimulation(campaign);
    return;
  }

  state.simulationDay++;
  const day = state.simulationDay;
  const dr = campaign.dailyResults[day - 1];

  // Accumulate totals
  campaign.totalSpend += dr.spend;
  campaign.totalImpressions += dr.impressions;
  campaign.totalClicks += dr.clicks;
  campaign.totalConversions += dr.conversions;
  campaign.totalRevenue += dr.revenue;
  campaign.netProfit += dr.profit;

  // Deduct from account balance (running)
  state.spent += dr.spend;

  // Update metrics display
  setText('sim-day', day);
  const pct = (day / campaign.duration) * 100;
  const fill = document.getElementById('sim-progress-fill');
  if (fill) fill.style.width = pct + '%';

  updateMetric('res-spend', '$' + fmt$(campaign.totalSpend), 'spend-color');
  updateMetric('res-impressions', fmtNum(campaign.totalImpressions));
  updateMetric('res-clicks', fmtNum(campaign.totalClicks));
  updateMetric('res-conversions', campaign.totalConversions.toFixed(1));
  updateMetric('res-revenue', '$' + fmt$(campaign.totalRevenue), 'revenue-color');

  const profitEl = document.getElementById('res-profit');
  if (profitEl) {
    profitEl.textContent = (campaign.netProfit >= 0 ? '+$' : '-$') + fmt$(Math.abs(campaign.netProfit));
    profitEl.style.color = campaign.netProfit >= 0 ? '#1a8917' : '#d93025';
    const card = document.getElementById('profit-live-card');
    if (card) {
      card.style.borderColor = campaign.netProfit >= 0 ? '#86efac' : '#fca5a5';
      card.style.background = campaign.netProfit >= 0 ? '#f0fdf4' : '#fef2f2';
    }
  }

  // Labels
  setText('res-cpm-label', 'CPM $' + (campaign.totalSpend / campaign.totalImpressions * 1000).toFixed(2));
  setText('res-ctr-label', 'CTR ' + (campaign.totalClicks / campaign.totalImpressions * 100).toFixed(2) + '%');
  if (['sales','leads'].includes(campaign.objective) && campaign.totalConversions > 0) {
    setText('res-cvr-label', 'CVR ' + (campaign.totalConversions / campaign.totalClicks * 100).toFixed(2) + '%');
    const roas = campaign.totalRevenue / campaign.totalSpend;
    setText('res-roas-label', 'ROAS ' + roas.toFixed(2) + 'x');
  }
  setText('res-spend-daily', 'Day ' + day + ': $' + fmt$(dr.spend));

  // Update sidebar
  updateSidebarBalance();

  // Chart
  campaign._chartData.days.push(day);
  campaign._chartData.cumulativeProfit.push(campaign.netProfit);
  campaign._chartData.cumulativeRevenue.push(campaign.totalRevenue);
  campaign._chartData.cumulativeSpend.push(campaign.totalSpend);
  drawChart(campaign);

  // Schedule next day
  const delay = Math.max(80, 600 / state.simulationSpeed);
  state.simulationTimer = setTimeout(() => runSimDay(campaign), delay);
}

function finishSimulation(campaign) {
  if (state.simulationTimer) clearTimeout(state.simulationTimer);

  // Finalize account balance
  state.balance = Math.max(0, 1000 - state.spent);
  state.revenue += campaign.totalRevenue;
  updateSidebarBalance();

  setText('running-status-text', 'Complete');
  const dot = document.querySelector('.running-dot');
  if (dot) { dot.style.animation = 'none'; dot.style.background = '#1a8917'; }

  // Final breakdown
  const fb = document.getElementById('final-breakdown');
  fb.classList.remove('hidden');

  const isProfit = campaign.netProfit >= 0;
  const banner = document.getElementById('final-verdict-banner');
  if (banner) {
    banner.className = 'final-verdict-banner ' + (isProfit ? 'profit-banner' : 'loss-banner');
  }
  setText('verdict-icon', isProfit ? '🏆' : '💸');
  setText('verdict-headline', isProfit ? 'Profitable Campaign! 🎉' : 'Campaign Not Profitable');
  setText('verdict-sub', isProfit
    ? `You made +$${fmt$(campaign.netProfit)} profit over ${campaign.duration} days`
    : `You lost $${fmt$(Math.abs(campaign.netProfit))} — see lessons below`
  );

  const roas = campaign.totalRevenue > 0 ? campaign.totalRevenue / campaign.totalSpend : 0;
  const cpa = campaign.totalConversions > 0 ? campaign.totalSpend / campaign.totalConversions : 0;
  const grossProfit = campaign.totalRevenue - campaign.totalConversions * campaign.productCost;

  setText('f-spend', '$' + fmt$(campaign.totalSpend));
  setText('f-revenue', '$' + fmt$(campaign.totalRevenue));
  setText('f-gross', '$' + fmt$(grossProfit));
  setTextColored('f-profit', (campaign.netProfit >= 0 ? '+$' : '-$') + fmt$(Math.abs(campaign.netProfit)), campaign.netProfit >= 0 ? '#1a8917' : '#d93025');
  setText('f-roas', roas > 0 ? roas.toFixed(2) + 'x' : '—');
  setText('f-cpa', cpa > 0 ? '$' + fmt$(cpa) : '—');
  setText('f-cpm', '$' + fmt$(campaign.totalSpend / campaign.totalImpressions * 1000));
  setText('f-ctr', (campaign.totalClicks / campaign.totalImpressions * 100).toFixed(2) + '%');
  setText('f-impressions', fmtNum(campaign.totalImpressions));
  setText('f-conversions', campaign.totalConversions.toFixed(1));

  // AI Lessons
  const lessons = document.getElementById('ai-lessons-text');
  if (lessons) lessons.innerHTML = generateLessons(campaign);

  // Update campaigns list for dashboard
  const idx = state.campaigns.findIndex(c => c.id === campaign.id);
  if (idx !== -1) state.campaigns[idx] = campaign;

  setTimeout(() => fb.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
}

function generateLessons(campaign) {
  const { scores, netProfit, totalConversions, totalSpend, sellingPrice, productCost } = campaign;
  const s = scores;
  const roas = campaign.totalRevenue / totalSpend;
  const items = [];

  if (s.creative < 60) {
    items.push(`<li><strong>Creative was your weakest link (${s.creative}/100).</strong> Headlines with numbers and power words, copy with social proof, and visuals with human faces would have dramatically improved CTR.</li>`);
  }
  if (s.audience < 60) {
    items.push(`<li><strong>Audience targeting scored ${s.audience}/100.</strong> ${s.audience < 50 ? 'Your audience was too broad — narrow it with 3–5 specific interests next time.' : 'Good targeting but adding behavioral data (purchasers, engaged shoppers) could sharpen it further.'}</li>`);
  }
  if (sellingPrice > 0 && (sellingPrice - productCost) / sellingPrice < 0.4) {
    items.push(`<li><strong>Low margin hurt profitability.</strong> When margin is under 40%, every dollar of ad spend needs to work twice as hard. Consider increasing price or reducing COGS.</li>`);
  }
  if (roas < 1 && campaign.totalRevenue > 0) {
    items.push(`<li><strong>ROAS under 1x means you spent more than you made.</strong> To break even, you need ROAS ≥ ${(sellingPrice / (sellingPrice - productCost)).toFixed(2)}x (your break-even ROAS based on your margin).</li>`);
  }
  if (roas >= 2) {
    items.push(`<li><strong>Strong ROAS of ${roas.toFixed(2)}x!</strong> This campaign would be worth scaling — increase budget by 20–30% every few days and monitor CPA carefully.</li>`);
  }
  if (s.overall >= 75 && netProfit > 0) {
    items.push(`<li><strong>High overall score + profitability = scale this.</strong> The fundamentals are working. Next step: test 2–3 creative variations to find an even higher performer.</li>`);
  }
  items.push(`<li><strong>The Learning Phase (Days 1–3)</strong> always shows lower performance. Meta's algorithm needs time to optimize delivery. Never judge a campaign in the first 3 days.</li>`);
  if (s.creative >= 70) {
    items.push(`<li><strong>Your creative scored well (${s.creative}/100).</strong> Strong ads like this get better CPMs over time as Meta rewards high engagement with cheaper impressions.</li>`);
  }

  return `<ul>${items.join('')}</ul>`;
}

// ============================================================
// CHART
// ============================================================

function drawChart(campaign) {
  const canvas = document.getElementById('results-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.offsetWidth;
  const h = canvas.height;

  canvas.width = w * dpr;
  canvas.height = h * dpr;
  ctx.scale(dpr, dpr);

  const data = campaign._chartData.cumulativeProfit;
  const days = campaign._chartData.days;
  const hasRevenue = ['sales','leads'].includes(campaign.objective);

  if (data.length === 0) return;

  const padL = 60, padR = 20, padT = 20, padB = 30;
  const chartW = w - padL - padR;
  const chartH = h - padT - padB;

  const minVal = Math.min(0, ...data) * 1.1;
  const maxVal = Math.max(0, ...data) * 1.1 || 100;

  const xScale = n => padL + (n / (campaign.duration)) * chartW;
  const yScale = v => padT + chartH - ((v - minVal) / (maxVal - minVal)) * chartH;

  // Grid
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 1;
  const gridLines = 5;
  for (let i = 0; i <= gridLines; i++) {
    const y = padT + (i / gridLines) * chartH;
    ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL + chartW, y); ctx.stroke();
    const val = maxVal - (i / gridLines) * (maxVal - minVal);
    ctx.fillStyle = '#9ca3af';
    ctx.font = '11px -apple-system, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText((val >= 0 ? '+$' : '-$') + Math.abs(Math.round(val)), padL - 6, y + 4);
  }

  // Zero line
  const zeroY = yScale(0);
  ctx.strokeStyle = '#d1d5db';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.moveTo(padL, zeroY); ctx.lineTo(padL + chartW, zeroY); ctx.stroke();
  ctx.setLineDash([]);

  // Gradient fill
  if (data.length > 1) {
    const gradient = ctx.createLinearGradient(0, padT, 0, padT + chartH);
    const lastVal = data[data.length - 1];
    if (lastVal >= 0) {
      gradient.addColorStop(0, 'rgba(26,137,23,0.15)');
      gradient.addColorStop(1, 'rgba(26,137,23,0.01)');
    } else {
      gradient.addColorStop(0, 'rgba(217,48,37,0.01)');
      gradient.addColorStop(1, 'rgba(217,48,37,0.15)');
    }
    ctx.beginPath();
    ctx.moveTo(xScale(0), zeroY);
    for (let i = 0; i < data.length; i++) {
      ctx.lineTo(xScale(days[i]), yScale(data[i]));
    }
    ctx.lineTo(xScale(days[data.length - 1]), zeroY);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();
  }

  // Profit line
  if (data.length > 0) {
    ctx.beginPath();
    ctx.moveTo(xScale(0), zeroY);
    for (let i = 0; i < data.length; i++) {
      ctx.lineTo(xScale(days[i]), yScale(data[i]));
    }
    const lastVal = data[data.length - 1];
    ctx.strokeStyle = lastVal >= 0 ? '#1a8917' : '#d93025';
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Dot at last point
    const lx = xScale(days[data.length - 1]);
    const ly = yScale(data[data.length - 1]);
    ctx.beginPath();
    ctx.arc(lx, ly, 5, 0, Math.PI * 2);
    ctx.fillStyle = lastVal >= 0 ? '#1a8917' : '#d93025';
    ctx.fill();
  }

  // X axis labels
  ctx.fillStyle = '#9ca3af';
  ctx.font = '11px -apple-system, sans-serif';
  ctx.textAlign = 'center';
  const step = Math.ceil(campaign.duration / 7);
  for (let d = step; d <= campaign.duration; d += step) {
    if (d <= days[days.length - 1]) {
      ctx.fillText('Day ' + d, xScale(d), padT + chartH + 18);
    }
  }
}

// ============================================================
// SPEED CONTROL
// ============================================================

function setSpeed(speed) {
  state.simulationSpeed = speed;
  ['speed-1x','speed-5x','speed-10x'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('active');
  });
  document.getElementById('speed-' + speed + 'x')?.classList.add('active');
}

// ============================================================
// DASHBOARD
// ============================================================

function renderDashboard() {
  const totalSpent = state.campaigns.reduce((s, c) => s + (c.totalSpend || 0), 0);
  const totalRevenue = state.campaigns.reduce((s, c) => s + (c.totalRevenue || 0), 0);
  const totalProfit = state.campaigns.reduce((s, c) => s + (c.netProfit || 0), 0);
  const balance = Math.max(0, 1000 - totalSpent);

  setTextColored('stat-balance', '$' + fmt$(balance));
  setText('stat-spend', '$' + fmt$(totalSpent));
  setText('stat-revenue', '$' + fmt$(totalRevenue));
  setTextColored('stat-profit', (totalProfit >= 0 ? '+$' : '-$') + fmt$(Math.abs(totalProfit)), totalProfit >= 0 ? '#1a8917' : '#d93025');

  setText('sidebar-balance', '$' + fmt$(balance));
  setText('sidebar-spent-label', '$' + fmt$(totalSpent) + ' spent');
  if (totalRevenue > 0) {
    const roas = totalRevenue / totalSpent;
    setText('sidebar-roas-label', roas.toFixed(2) + 'x ROAS');
  }

  const hasComplete = state.campaigns.some(c => c.totalSpend > 0);
  document.getElementById('empty-state').classList.toggle('hidden', hasComplete);
  document.getElementById('campaigns-section').classList.toggle('hidden', !hasComplete);

  if (hasComplete) {
    const list = document.getElementById('campaigns-list');
    if (list) {
      list.innerHTML = state.campaigns
        .filter(c => c.totalSpend > 0)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map(renderCampaignCard)
        .join('');
    }
  }

  const balanceFill = document.getElementById('balance-bar-fill');
  if (balanceFill) balanceFill.style.width = (balance / 1000 * 100) + '%';
}

function renderCampaignCard(c) {
  const roas = c.totalRevenue > 0 ? (c.totalRevenue / c.totalSpend).toFixed(2) + 'x' : '—';
  const isProfit = c.netProfit >= 0;
  return `
    <div class="campaign-card" onclick="viewCampaignDetails(${c.id})">
      <div class="campaign-card-icon">${OBJECTIVE_ICONS[c.objective] || '📢'}</div>
      <div class="campaign-card-info">
        <div class="campaign-card-name">${c.name}</div>
        <div class="campaign-card-sub">${c.duration} days · $${fmt$(c.dailyBudget)}/day · ${formatAudienceSize(c._audienceEstimate || 10)}+ audience</div>
      </div>
      <div class="campaign-card-metrics">
        <div class="campaign-metric"><span>Spend</span><strong>$${fmt$(c.totalSpend)}</strong></div>
        <div class="campaign-metric"><span>Revenue</span><strong>$${fmt$(c.totalRevenue)}</strong></div>
        <div class="campaign-metric"><span>ROAS</span><strong>${roas}</strong></div>
        <div class="campaign-metric ${isProfit ? 'profit' : 'loss'}">
          <span>Profit</span>
          <strong>${isProfit ? '+' : '-'}$${fmt$(Math.abs(c.netProfit))}</strong>
        </div>
      </div>
    </div>`;
}

function viewCampaignDetails(id) {
  const campaign = state.campaigns.find(c => c.id === id);
  if (!campaign) return;
  // Re-show results
  state.wizard._campaign = campaign;
  navigate('results');
  document.getElementById('results-name').textContent = campaign.name;
  document.getElementById('sim-day-total').textContent = 'of ' + campaign.duration;
  document.getElementById('running-badge').style.display = 'none';

  // Show final values
  setText('sim-day', campaign.duration);
  const fill = document.getElementById('sim-progress-fill');
  if (fill) fill.style.width = '100%';

  setText('res-spend', '$' + fmt$(campaign.totalSpend));
  setText('res-impressions', fmtNum(campaign.totalImpressions));
  setText('res-clicks', fmtNum(campaign.totalClicks));
  setText('res-conversions', campaign.totalConversions.toFixed(1));
  setText('res-revenue', '$' + fmt$(campaign.totalRevenue));

  const profitEl = document.getElementById('res-profit');
  if (profitEl) {
    profitEl.textContent = (campaign.netProfit >= 0 ? '+$' : '-$') + fmt$(Math.abs(campaign.netProfit));
    profitEl.style.color = campaign.netProfit >= 0 ? '#1a8917' : '#d93025';
  }

  drawChart(campaign);
  finishSimulation(campaign);
}

function updateSidebarBalance() {
  const balance = Math.max(0, 1000 - state.spent);
  setText('sidebar-balance', '$' + fmt$(balance));
  const fill = document.getElementById('balance-bar-fill');
  if (fill) fill.style.width = (balance / 1000 * 100) + '%';
  setText('sidebar-spent-label', '$' + fmt$(state.spent) + ' spent');
}

// ============================================================
// UTILITIES
// ============================================================

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function setTextColored(id, text, color) {
  const el = document.getElementById(id);
  if (el) { el.textContent = text; if (color) el.style.color = color; }
}

function updateMetric(id, text, colorClass) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text;
}

function fmt$(n) {
  if (isNaN(n)) return '0.00';
  return Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtNum(n) {
  if (isNaN(n)) return '0';
  return Math.round(n).toLocaleString('en-US');
}

function showToast(msg, type) {
  const existing = document.getElementById('toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'toast';
  toast.style.cssText = `position:fixed;bottom:24px;right:24px;z-index:9999;padding:12px 18px;border-radius:10px;font-size:14px;font-weight:600;box-shadow:0 4px 16px rgba(0,0,0,.2);background:${type==='error'?'#d93025':'#1a8917'};color:#fff;max-width:320px;`;
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

// ============================================================
// INIT
// ============================================================

window.addEventListener('DOMContentLoaded', () => {
  // Default location tag
  renderLocationTags();

  // Make balance bar handle on input everywhere
  window.addEventListener('resize', () => {
    const c = state.wizard._campaign;
    if (c && document.getElementById('view-results').classList.contains('active')) {
      drawChart(c);
    }
  });

  navigate('dashboard');
});
