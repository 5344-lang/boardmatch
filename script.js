const firebaseConfig = {
  apiKey: "AIzaSyAqdJt8xW1CyHuKTJF8BgfBBYIKzwg-AEE",
  authDomain: "boardmatch-game.firebaseapp.com",
  projectId: "boardmatch-game",
  storageBucket: "boardmatch-game.firebasestorage.app",
  messagingSenderId: "131375138191",
  appId: "1:131375138191:web:9b03f07bad5b18ca00b7fa"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

function formatBirthYear(year) {
  if (!year) return '-';
  return String(year % 100).padStart(2, '0');
}

// 연도 생성
const birthYearSelect = document.getElementById('birthYear');
const birthPlaceholder = document.createElement('option');
birthPlaceholder.value = ''; birthPlaceholder.innerText = '출생 연도 선택';
birthPlaceholder.disabled = true; birthPlaceholder.selected = true;
birthYearSelect.appendChild(birthPlaceholder);
for (let year = 2005; year >= 1950; year--) {
  const option = document.createElement('option');
  option.value = year; option.innerText = `${year}년생`;
  birthYearSelect.appendChild(option);
}

const sections = {
  auth: document.getElementById('auth-section'),
  profile: document.getElementById('profile-section'),
  waitroom: document.getElementById('waitroom-section'),
  result: document.getElementById('result-section'),
  admin: document.getElementById('admin-section')
};

function showSection(sectionName) {
  Object.values(sections).forEach(sec => sec.style.display = 'none');
  sections[sectionName].style.display = 'block';
}

function showWaitroomArea(areaName) {
  showSection('waitroom');
  ['waitroom-header', 'selection-area', 'submitted-lock-area', 'result-ready-area', 'profile-check-area'].forEach(a => {
    document.getElementById(a).style.display = 'none';
  });
  document.getElementById(areaName).style.display = 'block';
  if (myUserData) updateUserProgressBar();
}

function updateUserProgressBar() {
  if (!myUserData) return;
  const gs = globalSettings || {};
  let activeStep = 0;
  if (gs.resultsPublished) activeStep = 3;
  else if (gs.isMatchingActive) activeStep = 2;
  else if (gs.isProfileCheckActive) activeStep = 1;

  const done = [
    !!(gs.isProfileCheckActive || gs.isMatchingActive || gs.resultsPublished),
    !!(gs.isMatchingActive || gs.resultsPublished),
    !!(gs.resultsPublished),
    false
  ];

  for (let i = 0; i < 4; i++) {
    const circle = document.getElementById(`ucircle-${i}`);
    const conn = document.getElementById(`uconn-${i}`);
    if (circle) {
      circle.classList.toggle('active', i === activeStep && !done[i]);
      circle.classList.toggle('done', !!done[i]);
    }
    if (conn) conn.classList.toggle('done', !!done[i]);
  }
}

window.goHome = function() {
  if (!myUserData) { location.reload(); return; }
  const gs = globalSettings || {};
  if (myUserData.status === 'matched' && gs.resultsPublished) { showWaitroomArea('result-ready-area'); return; }
  if (myUserData.status === 'submitted' || myUserData.status === 'matched') { showWaitroomArea('submitted-lock-area'); return; }
  if (gs.isMatchingActive && myUserData.isParticipating) { showWaitroomArea('selection-area'); return; }
  if (gs.isProfileCheckActive && !gs.isMatchingActive) { showWaitroomArea('profile-check-area'); updateProfileCheckUI(); return; }
  updateWaitroomUI();
  showWaitroomArea('waitroom-header');
};

function updateGameSlider(i) {
  const el = document.getElementById(`gs-${i}`);
  if (!el) return;
  const val = parseInt(el.value);
  el.style.background = `linear-gradient(to right, #1A2B3C ${val}%, #FD79A8 ${val}%, #FD79A8 100%)`;
}
for (let i = 0; i < 3; i++) {
  const el = document.getElementById(`gs-${i}`);
  if (!el) continue;
  el.addEventListener('input', () => updateGameSlider(i));
  updateGameSlider(i);
}

document.querySelectorAll('.genre-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    const isUnknown = chip.dataset.tag === '모르겠다';
    if (isUnknown) {
      // 모르겠다 선택 시 다른 모든 태그 해제
      document.querySelectorAll('.genre-chip').forEach(c => c.classList.remove('selected'));
      chip.classList.add('selected');
    } else {
      // 다른 태그 선택 시 모르겠다 해제
      document.querySelector('.genre-chip[data-tag="모르겠다"]')?.classList.remove('selected');
      chip.classList.toggle('selected');
    }
  });
});

let currentSelectedEmoji = "👩";
const emojiItems = document.querySelectorAll('.emoji-item');
const customEmojiInput = document.getElementById('custom-emoji');
const previewEmoji = document.getElementById('preview-emoji');

emojiItems.forEach(item => {
  item.addEventListener('click', () => {
    emojiItems.forEach(i => i.classList.remove('selected'));
    item.classList.add('selected');
    const emoji = item.getAttribute('data-emoji');
    
    if (emoji === '기타') {
      customEmojiInput.style.display = 'block'; customEmojiInput.required = true;
      currentSelectedEmoji = customEmojiInput.value || '👩'; previewEmoji.innerText = currentSelectedEmoji;
    } else {
      customEmojiInput.style.display = 'none'; customEmojiInput.required = false;
      currentSelectedEmoji = emoji; previewEmoji.innerText = emoji;
    }
  });
});
customEmojiInput.addEventListener('input', function() { currentSelectedEmoji = this.value || '👩'; previewEmoji.innerText = currentSelectedEmoji; });
document.getElementById('city').addEventListener('change', function() {
  const customCityInput = document.getElementById('custom-city');
  if (this.value === '기타') { customCityInput.style.display = 'block'; customCityInput.required = true; } 
  else { customCityInput.style.display = 'none'; customCityInput.required = false; }
});

document.getElementById('signup-btn').addEventListener('click', () => {
  const id = document.getElementById('userid').value; const pw = document.getElementById('password').value; 
  if (!id || !pw) return alert("입력칸을 채워주세요.");
  if (pw.length < 4) return alert("비밀번호는 4자리 이상입니다.");
  auth.createUserWithEmailAndPassword(id + "@roundtable.com", pw + "round")
    .then(() => { alert("가입 성공!"); document.getElementById('password').value = ""; })
    .catch(err => alert("가입 실패: " + err.message));
});
document.getElementById('login-btn').addEventListener('click', () => {
  const id = document.getElementById('userid').value; const pw = document.getElementById('password').value;
  auth.signInWithEmailAndPassword(id + "@roundtable.com", pw + "round").catch(err => alert("로그인 실패. 아이디와 비밀번호를 확인해주세요."));
});
document.getElementById('logout-btn').addEventListener('click', () => { auth.signOut(); location.reload(); });

document.getElementById('withdraw-btn').addEventListener('click', async () => {
  if (!confirm("정말 탈퇴하시겠습니까?\n\n모든 프로필과 데이터가 영구 삭제되며 복구할 수 없습니다.")) return;

  const pw = prompt("보안 확인을 위해 현재 비밀번호를 입력해주세요:");
  if (pw === null) return;

  const user = auth.currentUser;
  const credential = firebase.auth.EmailAuthProvider.credential(user.email, pw + "round");

  try {
    await user.reauthenticateWithCredential(credential);

    if (myUserData.status === 'matched' && myUserData.teamId) {
      const teamSnap = await db.collection('users').where('teamId', '==', myUserData.teamId).get();
      teamSnap.forEach(doc => {
        if (doc.id !== user.uid)
          db.collection('users').doc(doc.id).update({ status: 'waiting', teamId: null, isTeamLeader: false });
      });
    }
    await db.collection('requests').doc(user.uid).delete();
    await db.collection('users').doc(user.uid).delete();
    await user.delete();

    alert("탈퇴가 완료되었습니다. 이용해주셔서 감사합니다.");
    location.reload();
  } catch (err) {
    if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
      alert("비밀번호가 올바르지 않습니다.");
    } else {
      alert("오류가 발생했습니다: " + err.message);
    }
  }
});
document.getElementById('admin-link-btn').addEventListener('click', () => {
  showSection('admin');
  startAdminRealtimeListeners();
  loadAdminData();
});

function openMyPage() {
  if(myUserData.status === 'submitted' || myUserData.status === 'matched') return alert("제출 후엔 프로필 수정이 불가합니다.");
  
  document.getElementById('nickname').value = myUserData.nickname || "";
  document.getElementById('birthYear').value = myUserData.birthYear || "";
  document.getElementById('kakao-link').value = myUserData.kakaoLink || "";
  
  const participatingToggle = document.getElementById('isParticipating');
  const lockMsg = document.getElementById('profile-confirm-lock-msg');
  participatingToggle.checked = myUserData.isParticipating !== false;
  if (myUserData.isProfileConfirmed) {
    participatingToggle.disabled = true;
    lockMsg.style.display = 'block';
  } else {
    participatingToggle.disabled = false;
    lockMsg.style.display = 'none';
  }
  
  const citySelect = document.getElementById('city'); const customCityInput = document.getElementById('custom-city');
  const savedCity = myUserData.city || "대구";
  let cityExists = Array.from(citySelect.options).some(opt => opt.value === savedCity && savedCity !== '기타');
  if (cityExists) { citySelect.value = savedCity; customCityInput.style.display = 'none'; } 
  else { citySelect.value = "기타"; customCityInput.value = savedCity; customCityInput.style.display = 'block'; }

  const savedEmoji = myUserData.emoji || "👩"; let found = false;
  emojiItems.forEach(item => {
    item.classList.remove('selected');
    if (item.getAttribute('data-emoji') === savedEmoji) { item.classList.add('selected'); found = true; }
  });
  if (found) { customEmojiInput.style.display = 'none'; } 
  else {
    document.querySelector('.emoji-item[data-emoji="기타"]').classList.add('selected');
    customEmojiInput.style.display = 'block'; customEmojiInput.value = savedEmoji;
  }
  currentSelectedEmoji = savedEmoji; previewEmoji.innerText = savedEmoji;

  const gs = myUserData.gameSpectrums || {};
  const gsKeys = ['relaxVsCompetitive', 'peacefulVsInteraction', 'luckVsSkill'];
  const locked = !!(globalSettings?.isMatchingActive || globalSettings?.isProfileCheckActive);
  const spectrumLockMsg = document.getElementById('spectrum-lock-msg');
  if (spectrumLockMsg) spectrumLockMsg.style.display = locked ? 'block' : 'none';
  gsKeys.forEach((key, i) => {
    const slider = document.getElementById(`gs-${i}`);
    slider.value = gs[key] ?? 50;
    slider.disabled = locked;
    updateGameSlider(i);
  });

  const savedTags = myUserData.genreTags || [];
  document.querySelectorAll('.genre-chip').forEach(chip => {
    chip.classList.toggle('selected', savedTags.includes(chip.dataset.tag));
    chip.style.pointerEvents = locked ? 'none' : '';
    chip.style.opacity = locked ? '0.5' : '';
  });

  const cl = myUserData.checklist || {};
  document.getElementById('can-rule-master').checked = cl.canRuleMaster || false;
  document.getElementById('skill-level').value = cl.skillLevel || '보통';
  document.getElementById('preferred-size').value = cl.preferredSize || 4;

  showSection('profile');
}

document.getElementById('mypage-btn').addEventListener('click', openMyPage);

document.getElementById('profile-form').addEventListener('submit', function(e) {
  e.preventDefault();
  const user = auth.currentUser;
  if (user) {
    let fullYear = parseInt(document.getElementById('birthYear').value);
    let selectedCity = document.getElementById('city').value;
    if (selectedCity === '기타') selectedCity = document.getElementById('custom-city').value;

    const gsKeys = ['relaxVsCompetitive', 'peacefulVsInteraction', 'luckVsSkill'];
    const gameSpectrums = {};
    gsKeys.forEach((key, i) => { gameSpectrums[key] = parseInt(document.getElementById(`gs-${i}`).value); });
    const genreTags = [...document.querySelectorAll('.genre-chip.selected')].map(c => c.dataset.tag);
    const checklist = {
      canRuleMaster: document.getElementById('can-rule-master').checked,
      skillLevel: document.getElementById('skill-level').value,
      preferredSize: parseInt(document.getElementById('preferred-size').value)
    };

    db.collection('users').doc(user.uid).set({
      nickname: document.getElementById('nickname').value,
      birthYear: fullYear, city: selectedCity,
      kakaoLink: document.getElementById('kakao-link').value,
      emoji: currentSelectedEmoji,

      gameSpectrums, genreTags, checklist,
      intro: document.getElementById('intro').value,
      isParticipating: document.getElementById('isParticipating').checked,
      isAdmin: myUserData?.isAdmin || false,
      status: myUserData?.status || 'waiting'
    }, { merge: true }).then(() => { alert("프로필 저장 완료!"); location.reload(); });
  }
});

let myUserData = null;
auth.onAuthStateChanged(user => {
  if (user) {
    db.collection('bannedUsers').doc(user.uid).get().then(banDoc => {
      if (banDoc.exists) {
        auth.signOut();
        alert('관리자에 의해 접근이 제한된 계정입니다.');
        return;
      }
      db.collection('users').doc(user.uid).onSnapshot(doc => {
        if (doc.exists) {
          myUserData = doc.data();
          document.getElementById('logout-btn').style.display = 'inline-block';
          document.getElementById('mypage-btn').style.display = 'inline-block';
          if (myUserData.isAdmin) document.getElementById('admin-link-btn').style.display = 'inline-block';
          document.getElementById('user-greeting').innerText = `${myUserData.nickname}님!`;
          document.getElementById('user-greeting').style.display = 'inline-block';

          if (myUserData.nickname) listenToGlobalSettings();
          else showSection('profile');
        } else showSection('profile');
      });
    });
  } else {
    showSection('auth'); document.getElementById('user-greeting').style.display = 'none';
    ['logout-btn','mypage-btn','admin-link-btn'].forEach(id => document.getElementById(id).style.display = 'none');
  }
});

// 🌟 대기실 UI 동적 변경 함수
function updateWaitroomUI() {
  updateUserProgressBar();

  const gs = globalSettings || {};
  const isPart = myUserData.isParticipating !== false;
  const isConfirmed = !!myUserData.isProfileConfirmed;

  // 토글 카드
  const showToggle = !gs.isMatchingActive && !gs.resultsPublished;
  const toggleWrapper = document.getElementById('home-toggle-wrapper');
  const toggle = document.getElementById('waitroom-participation-toggle');
  const partCard = document.getElementById('home-part-card');
  if (toggleWrapper) toggleWrapper.style.display = showToggle ? 'flex' : 'none';
  if (toggle) { toggle.checked = isPart; toggle.disabled = !!(gs.isProfileCheckActive && isConfirmed); }
  if (partCard) {
    partCard.classList.toggle('active', isPart);
    partCard.style.opacity = (gs.isProfileCheckActive && isConfirmed) ? '0.6' : '1';
  }

  const emoji = document.getElementById('home-stage-emoji');
  const title = document.getElementById('home-stage-title');
  const desc = document.getElementById('home-stage-desc');
  const mainBtn = document.getElementById('waitroom-main-btn');
  const subBtn = document.getElementById('waitroom-sub-btn');
  const picksSummary = document.getElementById('home-picks-summary');

  if (mainBtn) mainBtn.style.display = 'none';
  if (subBtn) subBtn.style.display = 'none';
  if (picksSummary) picksSummary.style.display = 'none';
  if (!emoji || !title || !desc) return;

  if (!isPart && (gs.isMatchingActive || gs.isProfileCheckActive)) {
    emoji.innerText = '💬';
    title.innerText = '참여하고 싶다면\n관리자에게 연락해주세요';
    desc.innerText = '이미 매칭이 진행 중이에요.\n관리자가 직접 참여 추가를 해드릴 수 있어요.';
    if (gs.adminKakaoLink && mainBtn) {
      mainBtn.style.cssText = 'display:block; background:#FEE500; color:#371D1E; font-size:1rem; padding:15px; margin-bottom:8px; font-weight:800; border-radius:12px;';
      mainBtn.innerText = '💬 관리자 오픈톡으로 연락하기';
      mainBtn.onclick = () => window.open(gs.adminKakaoLink, '_blank');
    }

  } else if (gs.isMatchingActive && isPart) {
    emoji.innerText = '💘';
    title.innerText = '매칭이 시작됐어요!';
    desc.innerText = '카드를 살펴보고 마음에 드는 분께\n지망을 보내주세요.';
    if (mainBtn) {
      mainBtn.style.cssText = 'display:block; background:var(--soft-rose); color:white; font-size:1.05rem; padding:16px; margin-bottom:8px;';
      mainBtn.innerText = '🎲 카드 보러 가기';
      mainBtn.onclick = () => { showWaitroomArea('selection-area'); loadCards(); };
    }
    if (picksSummary) { picksSummary.style.display = 'block'; loadHomePicksSummary(); }

  } else if (gs.isProfileCheckActive && isConfirmed) {
    emoji.innerText = '✅';
    title.innerText = '프로필 점검 완료!';
    desc.innerText = '매칭 시작을 기다리는 중이에요.\n곧 팀 매칭이 시작됩니다!';

  } else if (gs.isProfileCheckActive && !isConfirmed && isPart) {
    emoji.innerText = '🔍';
    title.innerText = '프로필을 점검해주세요!';
    desc.innerText = '내 프로필을 확인하고\n이번 매칭 참여 의사를 최종 확정해주세요.';
    if (mainBtn) {
      mainBtn.style.cssText = 'display:block; background:var(--soft-rose); color:white; font-size:1rem; padding:15px; margin-bottom:8px;';
      mainBtn.innerText = '🔍 프로필 점검하러 가기';
      mainBtn.onclick = () => { showWaitroomArea('profile-check-area'); updateProfileCheckUI(); };
    }
    if (subBtn) { subBtn.style.display = 'block'; subBtn.innerText = '✏️ 프로필 수정하기'; subBtn.onclick = openMyPage; }

  } else if (isPart) {
    emoji.innerText = '✅';
    title.innerText = '참여 신청 완료!';
    desc.innerText = '진행자가 프로필 점검 기간을 시작하면\n다시 안내해드릴게요.';

  } else {
    emoji.innerText = '⏳';
    title.innerText = '이번 매칭에 참여하시나요?';
    desc.innerText = '토글을 켜서 참여 신청을 해주세요!\n언제든지 변경할 수 있어요.';
  }
}

function loadHomePicksSummary() {
  const picksGrid = document.getElementById('home-picks-grid');
  if (!picksGrid || !auth.currentUser) return;
  const gs = globalSettings || {};
  const prefItems = [
    { label: '1지망', key: 'pref1', color: 'var(--soft-rose)' },
    { label: '2지망', key: 'pref2', color: '#f39c12', show: gs.showPref2 !== false },
    { label: '3지망', key: 'pref3', color: '#f1c40f', show: gs.showPref3 !== false },
    { label: '비선호', key: 'dispref1', color: '#95a5a6', show: gs.showDispref !== false },
  ].filter(i => i.show !== false);

  db.collection('requests').doc(auth.currentUser.uid).get().then(reqDoc => {
    const req = reqDoc.exists ? reqDoc.data() : {};
    const ids = prefItems.map(i => req[i.key]).filter(Boolean);
    if (ids.length === 0) {
      picksGrid.innerHTML = prefItems.map(i =>
        `<div class="home-pick-item"><div class="home-pick-rank" style="color:${i.color}">${i.label}</div><div class="home-pick-name empty">미선택</div></div>`
      ).join('');
      return;
    }
    db.collection('users').get().then(snap => {
      const nameMap = {};
      snap.forEach(doc => { nameMap[doc.id] = doc.data().nickname; });
      picksGrid.innerHTML = prefItems.map(i => {
        const name = req[i.key] ? (nameMap[req[i.key]] || '?') : null;
        return `<div class="home-pick-item"><div class="home-pick-rank" style="color:${i.color}">${i.label}</div><div class="home-pick-name ${name ? '' : 'empty'}">${name || '미선택'}</div></div>`;
      }).join('');
    });
  });
}

document.getElementById('waitroom-participation-toggle').addEventListener('change', function() {
  const isPart = this.checked;
  myUserData.isParticipating = isPart;
  const partCard = document.getElementById('home-part-card');
  if (partCard) partCard.classList.toggle('active', isPart);
  updateWaitroomUI();
  const profileToggle = document.getElementById('isParticipating');
  if (profileToggle) profileToggle.checked = isPart;
  const user = auth.currentUser;
  if (user) db.collection('users').doc(user.uid).update({ isParticipating: isPart });
});

function listenToGlobalSettings() {
  db.collection('settings').doc('global').onSnapshot(doc => {
    if (!doc.exists) {
      updateWaitroomUI();
      showWaitroomArea('waitroom-header');
      return;
    }
    const data = doc.data();
    globalSettings = data;

    // 관리자 단계 초기화 (첫 로드 시에만)
    if (myUserData?.isAdmin && !adminStepInitialized) {
      adminStepInitialized = true;
      goToAdminStep(data.adminStep ?? 0);
    }

    // 전광판 (단계별 자동 메시지, 관리자 입력으로 덮어쓰기 가능)
    const tickerContainer = document.getElementById('ticker-container');
    const tickerText = document.getElementById('ticker-text');
    const title = data.matchTitle || '이번 매칭';
    let autoMsg = null;
    if (data.resultsPublished) autoMsg = `🎲 ${title} 팀 구성 결과가 발표되었습니다! 결과 확인 버튼을 눌러보세요 🎉`;
    else if (data.isMatchingActive) autoMsg = `🎮 ${title} 진행 중입니다! 카드를 살펴보고 같이 하고 싶은 분을 선택해주세요 ✨`;
    else if (data.isProfileCheckActive) autoMsg = `🔍 ${title} 준비 중 · 내 프로필과 게임 성향을 점검하고 참여 여부를 확정해주세요 · 곧 팀 매칭이 시작됩니다!`;
    const fallbackMsg = data.matchTitle ? `🎲 ${data.matchTitle} · 곧 시작됩니다. 잠시 기다려주세요!` : null;
    const msg = data.tickerMessage || autoMsg || fallbackMsg;
    if (msg) {
      tickerText.innerText = msg;
      tickerText.style.animationDuration = `${Math.max(10, msg.length * 0.22)}s`;
      tickerContainer.style.display = 'block';
    } else {
      tickerContainer.style.display = 'none';
    }

    // 매칭 회차 라벨

    // 팀 크기 설정 동기화
    if (myUserData?.isAdmin && data.targetTeamSize) {
      const tsEl = document.getElementById('target-team-size');
      if (tsEl) tsEl.value = data.targetTeamSize;
    }
    
    const isAdminViewing = !!(myUserData?.isAdmin && sections.admin?.style.display === 'block');

    if (!isAdminViewing) {
      if (data.resultsPublished && myUserData.status === 'matched') {
        showWaitroomArea('result-ready-area');
      } else if (myUserData.status === 'submitted' || myUserData.status === 'matched') {
        showWaitroomArea('submitted-lock-area');
        if (data.isMatchingActive && myUserData.status !== 'matched') {
          document.getElementById('edit-picks-btn').style.display = 'inline-block';
          document.getElementById('submitted-lock-desc').innerHTML = "진행자가 매칭을 종료하기 전까지<br>수정할 수 있습니다.";
        } else {
          document.getElementById('edit-picks-btn').style.display = 'none';
          document.getElementById('submitted-lock-desc').innerHTML = "매칭이 마감되었습니다.<br>결과를 기다려주세요.";
        }
      } else if (data.isMatchingActive && myUserData.isParticipating !== false) {
        showWaitroomArea('selection-area');
        document.getElementById('btn-pref2').style.display = data.showPref2 ? 'inline-block' : 'none';
        document.getElementById('btn-pref3').style.display = data.showPref3 ? 'inline-block' : 'none';
        document.getElementById('btn-dispref').style.display = data.showDispref ? 'inline-block' : 'none';
        document.getElementById('li-pref2').style.display = data.showPref2 ? 'flex' : 'none';
        document.getElementById('li-pref3').style.display = data.showPref3 ? 'flex' : 'none';
        document.getElementById('li-dispref').style.display = data.showDispref ? 'flex' : 'none';
        loadCards();
      } else if (data.isProfileCheckActive && !data.isMatchingActive && myUserData.isParticipating !== false) {
        showWaitroomArea('profile-check-area');
        updateProfileCheckUI();
      } else {
        updateWaitroomUI();
        showWaitroomArea('waitroom-header');
      }
    }
    if (myUserData) updateUserProgressBar();
    if (myUserData.isAdmin) { startAdminRealtimeListeners(); loadAdminData(); }
  });
}

function updateProfileCheckUI() {
  updateUserProgressBar();
  const confirmed = myUserData.isProfileConfirmed;
  document.getElementById('profile-confirmed-badge').style.display = confirmed ? 'block' : 'none';
  document.getElementById('profile-not-confirmed-area').style.display = confirmed ? 'none' : 'block';
}

document.getElementById('check-my-profile-btn').addEventListener('click', openMyPage);
document.getElementById('confirm-profile-btn').addEventListener('click', () => {
  const participatingText = myUserData.isParticipating ? '참여' : '불참';
  if (confirm(`프로필 점검을 완료합니다.\n이후 참여 여부(현재: ${participatingText})를 변경할 수 없습니다.`)) {
    db.collection('users').doc(auth.currentUser.uid).update({ isProfileConfirmed: true })
      .then(() => {
        myUserData.isProfileConfirmed = true;
        updateProfileCheckUI();
      });
  }
});

let allUsers = []; let currentIndex = 0; let mySelections = { pref1: null, pref2: null, pref3: null, dispref1: null };
const mapIds = { 'pref1': 'pick-1-name', 'pref2': 'pick-2-name', 'pref3': 'pick-3-name', 'dispref1': 'pick-dis-name' };
const resetBtnIds = { 'pref1': 'reset-pref1', 'pref2': 'reset-pref2', 'pref3': 'reset-pref3', 'dispref1': 'reset-dispref1' };

function loadCards() {
  db.collection('users').where('status', 'in', ['waiting', 'submitted']).get().then(snapshot => {
      allUsers = [];
      snapshot.forEach(doc => {
        const d = doc.data();
        if (doc.id !== auth.currentUser.uid && d.isParticipating !== false && !d.emergencyAdded)
          allUsers.push({ id: doc.id, ...d });
      });

      // 선택 UI 초기화
      mySelections = { pref1: null, pref2: null, pref3: null, dispref1: null };
      Object.keys(mapIds).forEach(key => {
        const el = document.getElementById(mapIds[key]);
        el.innerText = '미선택'; el.style.color = '#777'; el.style.fontWeight = 'normal';
        document.getElementById(resetBtnIds[key]).style.display = 'none';
      });
      const submitBtn = document.getElementById('submit-selection-btn');
      submitBtn.disabled = true; submitBtn.classList.add('disabled-submit'); submitBtn.classList.remove('active-submit');

      // DB에서 기존 선택 복원
      db.collection('requests').doc(auth.currentUser.uid).get().then(reqDoc => {
        if (reqDoc.exists) {
          const saved = reqDoc.data();
          ['pref1', 'pref2', 'pref3', 'dispref1'].forEach(key => {
            if (saved[key]) {
              const user = allUsers.find(u => u.id === saved[key]);
              if (user) {
                mySelections[key] = saved[key];
                const el = document.getElementById(mapIds[key]);
                el.innerText = user.nickname; el.style.color = '#FD79A8'; el.style.fontWeight = 'bold';
                document.getElementById(resetBtnIds[key]).style.display = 'inline-block';
              }
            }
          });
          if (mySelections.pref1) {
            submitBtn.disabled = false; submitBtn.classList.remove('disabled-submit'); submitBtn.classList.add('active-submit');
          }
        }
        currentIndex = 0; renderCard();
      });
  });
}

function renderCard() {
  const content = document.getElementById('card-content'); const actions = document.getElementById('card-action-btns');
  if (allUsers.length === 0) {
    content.innerHTML = "<p style='margin-top:30px;'>현재 선택할 프로필이 없습니다.</p>";
    actions.style.display = 'none'; return;
  }
  actions.style.display = 'block';
  document.getElementById('card-counter').innerText = `${currentIndex + 1} / ${allUsers.length}`;
  const isLast = currentIndex === allUsers.length - 1;
  const nextBtn = document.querySelector('.nav-btn:last-child');
  if (nextBtn) { nextBtn.innerText = isLast ? '처음으로 🔄' : '다음 ▶'; }
  const u = allUsers[currentIndex];
  document.getElementById('c-emoji').innerText = u.emoji || '👩';
  document.getElementById('c-nickname').innerHTML = `${u.nickname} <span id="c-age">${formatBirthYear(u.birthYear)}년생</span>`;
  document.getElementById('c-city').innerText = u.city;
  document.getElementById('c-intro').innerText = u.intro;

  const specKeys = ['relaxVsCompetitive', 'peacefulVsInteraction', 'luckVsSkill'];
  const specLabels = ['즐겜↔빡겜', '평화↔경쟁', '운빨↔실력'];
  const uGs = u.gameSpectrums || {};
  document.getElementById('c-game-spectrums').innerHTML = specKeys.map((k, i) =>
    `<div style="display:flex; align-items:center; gap:6px; margin-bottom:4px;">
      <span style="font-size:0.68rem; color:#888; width:68px; flex-shrink:0;">${specLabels[i]}</span>
      <div class="custom-progress-bar" style="flex:1; height:7px;">
        <div class="custom-progress-fill" style="width:${uGs[k]??50}%;"></div>
      </div>
    </div>`
  ).join('');

  const uTags = u.genreTags || [];
  document.getElementById('c-genre-tags').innerHTML = uTags.length
    ? uTags.map(t => `<span class="genre-display-chip">${t}</span>`).join(' ')
    : '<span style="color:#aaa; font-size:0.78rem;">장르 미설정</span>';

  const cl = u.checklist || {};
  document.getElementById('c-checklist').innerText =
    `룰마: ${cl.canRuleMaster ? 'O' : 'X'} · 숙련도: ${cl.skillLevel||'보통'} · 선호인원: ${cl.preferredSize||4}인`;
}

window.nextCard = function() {
  if (currentIndex < allUsers.length - 1) { currentIndex++; }
  else { currentIndex = 0; }
  renderCard();
};
window.prevCard = function() { if (currentIndex > 0) { currentIndex--; renderCard(); } }

// 🌟 실시간 프리뷰를 위한 데이터베이스 저장 (isDraft: true)
window.pickCard = function(prefType) {
  const u = allUsers[currentIndex];
  for (let key in mySelections) { if (key !== prefType && mySelections[key] === u.id) return alert("⚠️ 이미 다른 지망으로 선택된 분입니다."); }

  if (prefType !== 'dispref1') {
    const myGs = myUserData.gameSpectrums || {};
    const uGs = u.gameSpectrums || {};
    const THRESH = 35;
    const styleWarnings = [];
    if (Math.abs((myGs.relaxVsCompetitive??50) - (uGs.relaxVsCompetitive??50)) > THRESH) styleWarnings.push('경쟁/즐겜 방식');
    if (Math.abs((myGs.peacefulVsInteraction??50) - (uGs.peacefulVsInteraction??50)) > THRESH) styleWarnings.push('인터랙션 성향');
    if (Math.abs((myGs.luckVsSkill??50) - (uGs.luckVsSkill??50)) > THRESH) styleWarnings.push('운빨/실력 성향');
    const myTags = myUserData.genreTags || [];
    const uTags = u.genreTags || [];
    const myTagsFiltered = myTags.filter(t => t !== '모르겠다');
    const uTagsFiltered = uTags.filter(t => t !== '모르겠다');
    if (myTagsFiltered.length > 0 && uTagsFiltered.length > 0 && !myTagsFiltered.some(t => uTagsFiltered.includes(t))) styleWarnings.push('선호 장르');
    if (styleWarnings.length >= 2) {
      if (!confirm(`⚠️ 서로 게임 스타일이 달라요 (${styleWarnings.join(', ')}).\n그래도 같이 하시겠어요?`)) return;
    }
  }

  if (mySelections[prefType] && mySelections[prefType] !== u.id) {
    const existing = allUsers.find(u2 => u2.id === mySelections[prefType]);
    const existingName = existing?.nickname || '선택된 분';
    const prefLabel = { pref1: '1지망', pref2: '2지망', pref3: '3지망', dispref1: '비선호' }[prefType];
    if (!confirm(`${prefLabel}을 '${existingName}'님에서 '${u.nickname}'님으로 바꾸시겠어요?`)) return;
    const oldNameEl = document.getElementById(mapIds[prefType]);
    oldNameEl.innerText = '미선택'; oldNameEl.style.color = '#777'; oldNameEl.style.fontWeight = 'normal';
    document.getElementById(resetBtnIds[prefType]).style.display = 'none';
  }

  mySelections[prefType] = u.id;
  
  const nameEl = document.getElementById(mapIds[prefType]);
  nameEl.innerText = u.nickname; nameEl.style.color = "#FD79A8"; nameEl.style.fontWeight = "bold";
  document.getElementById(resetBtnIds[prefType]).style.display = "inline-block";
  
  if(mySelections.pref1) {
    const btn = document.getElementById('submit-selection-btn');
    btn.disabled = false; btn.classList.remove('disabled-submit'); btn.classList.add('active-submit');
  }
  
  // 실시간으로 임시 저장!
  db.collection('requests').doc(auth.currentUser.uid).set({ ...mySelections, isDraft: true }, { merge: true });
  nextCard(); 
};

window.resetPick = function(prefType) {
  if(confirm("다시 선택하시겠습니까?")) {
    mySelections[prefType] = null;
    const nameEl = document.getElementById(mapIds[prefType]);
    nameEl.innerText = "미선택"; nameEl.style.color = "#777"; nameEl.style.fontWeight = "normal";
    document.getElementById(resetBtnIds[prefType]).style.display = "none";
    
    if(!mySelections.pref1) {
      const btn = document.getElementById('submit-selection-btn');
      btn.disabled = true; btn.classList.remove('active-submit'); btn.classList.add('disabled-submit');
    }
    // 실시간 임시 저장 업데이트
    db.collection('requests').doc(auth.currentUser.uid).set({ ...mySelections, isDraft: true }, { merge: true });
  }
};

document.getElementById('submit-selection-btn').addEventListener('click', () => {
  if(confirm("제출하시겠습니까? (종료 전까지 수정 가능)")) {
    db.collection('requests').doc(auth.currentUser.uid).set({
      ...mySelections, isDraft: false, timestamp: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true }).then(() => {
      db.collection('users').doc(auth.currentUser.uid).update({ status: 'submitted' });
    });
  }
});

document.getElementById('edit-picks-btn').addEventListener('click', () => {
  db.collection('users').doc(auth.currentUser.uid).update({ status: 'waiting' });
});

let resultTeammatesData = [];
let resultLeaderData = null;

window.showTeammatePopup = function(idx) {
  if (resultTeammatesData[idx]) showProfilePopup(resultTeammatesData[idx]);
};

window.showProfilePopup = function(user) {
  const overlay = document.getElementById('profile-popup-overlay');
  const specKeys = ['relaxVsCompetitive', 'peacefulVsInteraction', 'luckVsSkill'];
  const specLabels = ['즐겜↔빡겜', '평화↔경쟁', '운빨↔실력'];
  const gs = user.gameSpectrums || {};
  const age = user.birthYear ? `${formatBirthYear(user.birthYear)}년생` : '';

  document.getElementById('popup-nickname').innerHTML =
    `${user.emoji||'👤'} ${user.nickname} <span style="font-size:0.82rem; color:#888; font-weight:400;">${age}</span>`;

  const specBars = specKeys.map((k, i) =>
    `<div style="display:flex; align-items:center; gap:6px; margin-bottom:5px;">
      <span style="font-size:0.7rem; color:#888; width:64px; flex-shrink:0;">${specLabels[i]}</span>
      <div style="flex:1; height:8px; background:#f0f0f0; border-radius:8px; overflow:hidden;">
        <div style="width:${gs[k]??50}%; height:100%; background:var(--soft-rose);"></div>
      </div>
    </div>`
  ).join('');

  const tags = (user.genreTags || []).map(t => `<span class="genre-display-chip">${t}</span>`).join(' ')
    || '<span style="color:#aaa; font-size:0.82rem;">미설정</span>';
  const cl = user.checklist || {};

  document.getElementById('popup-content').innerHTML = `
    ${user.city ? `<p style="font-size:0.85rem; color:#888; margin-bottom:10px;">📍 ${user.city}</p>` : ''}
    ${user.intro ? `<p style="font-size:0.9rem; line-height:1.6; color:#555; background:#f9f9f9; padding:12px; border-radius:10px; margin-bottom:12px;">${user.intro}</p>` : ''}
    <div style="margin-bottom:12px;">${specBars}</div>
    <div style="margin-bottom:10px;">${tags}</div>
    <p style="font-size:0.8rem; color:#888;">룰마: ${cl.canRuleMaster ? '✅' : '❌'} · 숙련도: ${cl.skillLevel||'보통'} · 선호인원: ${cl.preferredSize||4}인</p>
  `;

  const contactBtn = document.getElementById('popup-contact-btn');
  if (user.kakaoLink) {
    contactBtn.style.display = 'block';
    contactBtn.onclick = () => window.open(user.kakaoLink, '_blank');
  } else {
    contactBtn.style.display = 'none';
  }
  overlay.style.display = 'flex';
};

window.closeProfilePopup = function() {
  document.getElementById('profile-popup-overlay').style.display = 'none';
};

document.getElementById('check-result-btn').addEventListener('click', async () => {
  showSection('result');
  document.getElementById('r-my-emoji').innerText = myUserData.emoji || '👤';
  document.getElementById('r-my-nick').innerText = myUserData.nickname;

  const teamSnap = await db.collection('users').where('teamId', '==', myUserData.teamId).get();
  const teammates = [];
  teamSnap.forEach(doc => { if (doc.id !== auth.currentUser.uid) teammates.push({ id: doc.id, ...doc.data() }); });

  const isLeader = myUserData.isTeamLeader;
  const partnerCard = document.getElementById('anim-partner-card');
  const resultActions = document.getElementById('result-actions');

  if (isLeader) {
    resultTeammatesData = teammates;
    resultLeaderData = null;
    partnerCard.style.cursor = '';
    partnerCard.onclick = null;
    partnerCard.innerHTML =
      `<div style="font-weight:800; font-size:0.9rem; margin-bottom:8px;">👑 팀장입니다!</div>` +
      teammates.map((t, i) =>
        `<div style="margin-bottom:6px; font-size:0.85rem; cursor:pointer; padding:3px 0;" onclick="showTeammatePopup(${i})">
          ${t.emoji||'👤'} <b>${t.nickname}</b>
          ${t.kakaoLink ? `<a href="${t.kakaoLink}" target="_blank" style="color:var(--soft-rose); font-weight:700; font-size:0.78rem; text-decoration:none;"> 📱카톡</a>` : ' <span style="color:#aaa; font-size:0.78rem;">링크없음</span>'}
        </div>`
      ).join('');

    const totalSize = teammates.length + 1;
    const teammateList = teammates.map(t =>
      `<span style="display:inline-flex; align-items:center; gap:4px; background:white; border-radius:20px; padding:4px 10px; font-size:0.8rem; font-weight:700; box-shadow:0 1px 4px rgba(0,0,0,0.08);">
        ${t.emoji||'👤'} ${t.nickname}
      </span>`
    ).join(' ');
    resultActions.innerHTML = `
      <div style="background:linear-gradient(135deg,#fff8e1,#fff3cd); border:2px solid #f39c12; border-radius:18px; padding:20px 18px; margin-top:16px; text-align:center;">
        <div style="font-size:2.2rem; margin-bottom:6px;">👑</div>
        <div style="font-weight:900; font-size:1.05rem; color:#d35400; margin-bottom:8px;">이번 팀장으로 선발되셨습니다!</div>
        <p style="font-size:0.88rem; color:#7d5200; line-height:1.7; margin-bottom:14px;">오픈 카톡방을 개설하고 아래 팀원들에게 초대 링크를 보내주세요!</p>
        <div style="display:flex; flex-wrap:wrap; gap:6px; justify-content:center; margin-bottom:16px;">${teammateList}</div>
        <p style="font-size:0.76rem; color:#aaa; margin:0;">팀원 이름을 누르면 프로필과 카카오 링크를 확인할 수 있어요</p>
      </div>
    `;
  } else {
    const leader = [...teammates, { ...myUserData, id: auth.currentUser.uid }].find(u => u.isTeamLeader) || teammates[0];
    resultLeaderData = leader;
    resultTeammatesData = [];
    document.getElementById('r-partner-emoji').innerText = leader?.emoji || '👑';
    document.getElementById('r-partner-nick').innerText = `팀장: ${leader?.nickname || '?'}`;
    document.getElementById('r-partner-desc').innerText =
      `${leader?.checklist?.skillLevel||''} · ${leader?.city||''}`;
    partnerCard.style.cursor = 'pointer';
    partnerCard.onclick = () => showProfilePopup(leader);
    const leaderNick = leader?.nickname || '팀장';
    const contactBtn = leader?.kakaoLink
      ? `<button class="result-contact-btn" onclick="window.open('${leader.kakaoLink.replace(/'/g, "\\'")}', '_blank')">💬 오픈톡으로 연락하기</button>`
      : '<p style="font-size:0.85rem; color:#aaa; margin-top:8px; text-align:center;">카카오 링크를 등록하지 않았어요</p>';
    resultActions.innerHTML = `
      <div style="background:linear-gradient(135deg,#e8f4fd,#d6eaf8); border:2px solid #3498db; border-radius:18px; padding:16px 18px; margin-top:16px; text-align:center;">
        <div style="font-size:2rem; margin-bottom:6px;">🎉</div>
        <div style="font-weight:900; font-size:1.0rem; color:#1a5276; margin-bottom:6px;">${leaderNick}님의 팀원이 되셨습니다!</div>
        <p style="font-size:0.85rem; color:#2471a3; margin:0;">팀장이 오픈톡 링크를 보내주실거예요. 조금만 기다려주세요 😊</p>
      </div>
      <div style="margin-top:12px;">${contactBtn}</div>
    `;
  }

  setTimeout(() => document.querySelector('.cards-animation-container').classList.add('animate-start'), 500);
});

// ==========================================
// 🌟 [관리자] 미제출자 프리뷰 및 참여 관리
// ==========================================

window.emergencyAddUser = function(selectId) {
  const uid = document.getElementById(selectId).value;
  if (!uid) return alert("추가할 회원을 선택하세요.");
  const nickname = adminUsersData[uid]?.nickname || '해당 유저';
  if (!confirm(`${nickname}님을 긴급 추가하시겠습니까?\n\n⚠️ 다른 참여자 카드에는 노출되지 않고, 수동 매칭으로만 연결됩니다.`)) return;
  db.collection('users').doc(uid).update({
    isParticipating: true, isProfileConfirmed: true, status: 'waiting', emergencyAdded: true
  }).then(() => alert(`${nickname}님이 긴급 추가되었습니다.`));
};

window.setUserNotParticipating = function(uid, nickname) {
  const affected = [];
  Object.entries(requestsData).forEach(([submitterId, req]) => {
    if (submitterId === uid) return;
    const submitter = adminUsersData[submitterId];
    if (!submitter || submitter.isAdmin) return;
    if ([req.pref1, req.pref2, req.pref3].includes(uid) && submitter.status === 'submitted') {
      affected.push({ id: submitterId, name: submitter.nickname });
    }
  });
  let msg = `${nickname}님을 참여 X로 변경하시겠습니까?`;
  if (affected.length > 0) msg += `\n\n⚠️ ${nickname}님을 지망으로 선택한 제출자:\n${affected.map(a => a.name).join(', ')}\n\n이 분들의 제출이 취소됩니다.`;
  if (!confirm(msg)) return;
  const batch = db.batch();
  batch.update(db.collection('users').doc(uid), { isParticipating: false });
  affected.forEach(a => batch.update(db.collection('users').doc(a.id), { status: 'waiting' }));
  batch.commit().then(() => alert('변경 완료!'));
};

document.getElementById('apply-toggles-btn').addEventListener('click', () => {
  db.collection('settings').doc('global').set({
    showPref2: document.getElementById('toggle-pref2').checked,
    showPref3: document.getElementById('toggle-pref3').checked,
    showDispref: document.getElementById('toggle-dispref').checked
  }, { merge: true }).then(() => alert("옵션이 유저 화면에 반영되었습니다."));
});
document.getElementById('admin-profile-check-start-btn').addEventListener('click', () => {
  db.collection('settings').doc('global').set({ isProfileCheckActive: true }, { merge: true })
    .then(() => alert("프로필 점검 기간이 시작되었습니다!"));
});
document.getElementById('admin-profile-check-end-btn').addEventListener('click', () => {
  if (!confirm("프로필 점검 기간을 종료하고 매칭 진행 단계로 넘어가시겠습니까?")) return;
  db.collection('settings').doc('global').update({ isProfileCheckActive: false })
    .then(() => goToAdminStep(1, true));
});
document.getElementById('admin-start-btn').addEventListener('click', () => {
  if (!confirm("매칭을 시작하시겠습니까?\n참여자들에게 카드 선택 화면이 열립니다.")) return;
  db.collection('settings').doc('global').set({ isMatchingActive: true, resultsPublished: false }, { merge: true })
    .then(() => alert("✅ 매칭이 시작되었습니다!"));
});
document.getElementById('admin-stop-btn').addEventListener('click', () => {
  if (!confirm("매칭을 종료하고 매칭 검토 단계로 넘어가시겠습니까?")) return;
  db.collection('settings').doc('global').update({ isMatchingActive: false })
    .then(() => goToAdminStep(2, true));
});

document.getElementById('reset-step0-btn').addEventListener('click', () => {
  if (!confirm("⚠️ 프로필 점검 기간을 비활성화하고\n모든 사용자의 점검 완료 상태를 초기화합니까?")) return;
  db.collection('users').get().then(snap => {
    const batch = db.batch();
    snap.forEach(doc => { if (!doc.data().isAdmin) batch.update(doc.ref, { isProfileConfirmed: false }); });
    batch.commit();
  });
  db.collection('settings').doc('global').update({ isProfileCheckActive: false })
    .then(() => alert("프로필 점검 기간이 초기화되었습니다."));
});
document.getElementById('reset-step1-btn').addEventListener('click', () => {
  if (!confirm("⚠️ 매칭을 중단하고 모든 제출 상태를 초기화합니까?\n(지망 내역은 유지됩니다)")) return;
  db.collection('users').where('status', '==', 'submitted').get().then(snap => {
    const batch = db.batch();
    snap.forEach(doc => batch.update(doc.ref, { status: 'waiting' }));
    batch.commit();
  });
  db.collection('settings').doc('global').update({ isMatchingActive: false })
    .then(() => alert("매칭 진행이 초기화되었습니다."));
});
document.getElementById('reset-step2-btn').addEventListener('click', () => {
  if (!confirm("⚠️ 확정된 모든 팀을 취소합니까?\n(매칭된 사용자가 submitted 상태로 돌아갑니다)")) return;
  db.collection('users').where('status', '==', 'matched').get().then(snap => {
    if (snap.empty) return alert('확정된 팀이 없습니다.');
    const batch = db.batch();
    snap.forEach(doc => batch.update(doc.ref, { status: 'submitted', teamId: null, isTeamLeader: false }));
    batch.commit().then(() => { alert('팀 전체 해제 완료'); loadAdminData(); });
  });
});
document.getElementById('reset-step3-btn').addEventListener('click', () => {
  if (!confirm("⚠️ 결과 발표를 취소합니까?\n사용자 화면에서 결과가 사라집니다.")) return;
  db.collection('settings').doc('global').update({ resultsPublished: false })
    .then(() => alert("결과 발표가 취소되었습니다."));
});

let globalSettings = {};
let currentAdminStep = 0;
let adminStepInitialized = false;

window.goToAdminStep = function(n, skipConfirm) {
  if (!skipConfirm && adminStepInitialized && n < currentAdminStep) {
    const names = ['프로필 점검', '매칭 진행', '매칭 검토', '결과 발표'];
    if (!confirm(`⚠️ ${names[n]} 단계(${n+1}단계)로 돌아가시겠습니까?\n이미 진행된 데이터에 영향을 줄 수 있습니다.\n초기화가 필요하면 해당 단계의 초기화 버튼을 사용하세요.`)) return;
  }
  currentAdminStep = n;
  for (let i = 0; i < 4; i++) {
    const stepEl = document.getElementById(`admin-step-${i}`);
    const circle = document.getElementById(`step-circle-${i}`);
    const conn = document.getElementById(`step-conn-${i}`);
    if (stepEl) stepEl.style.display = i === n ? 'block' : 'none';
    if (circle) {
      circle.classList.toggle('active', i === n);
      circle.classList.toggle('done', i < n);
    }
    if (conn) conn.classList.toggle('done', i < n);
  }
  db.collection('settings').doc('global').set({ adminStep: n }, { merge: true });
};


let userMap = {}; let adminUsersData = {}; let requestsData = {}; let proposedQueue = [];
let adminUsersSnap = null; let adminReqSnap = null;
let adminRenderTimer = null; let adminListenersActive = false;

function scheduleAdminRender() {
  clearTimeout(adminRenderTimer);
  adminRenderTimer = setTimeout(() => {
    if (adminUsersSnap) renderAdminFromSnaps(adminUsersSnap, adminReqSnap || { forEach: () => {} });
  }, 150);
}

function updateParticipantCountUI(snap) {
  let confirmedCount = 0, participatingCount = 0;
  snap.forEach(doc => {
    const u = doc.data();
    if (u.isAdmin || !u.nickname) return;
    if (u.isParticipating !== false) {
      participatingCount++;
      if (u.isProfileConfirmed) confirmedCount++;
    }
  });
  const statusEl = document.getElementById('profile-check-confirm-status');
  if (statusEl) statusEl.innerHTML = `참여 예정자 ${participatingCount}명 중 <b>${confirmedCount}명</b> 점검 완료`;
}

function startAdminRealtimeListeners() {
  if (adminListenersActive) return;
  adminListenersActive = true;
  db.collection('users').onSnapshot(
    snap => { adminUsersSnap = snap; updateParticipantCountUI(snap); scheduleAdminRender(); },
    err => { console.error('users 리스너 오류:', err); }
  );
  db.collection('requests').onSnapshot(
    snap => { adminReqSnap = snap; scheduleAdminRender(); },
    err => { console.error('requests 리스너 오류:', err); if (!adminReqSnap) { adminReqSnap = { forEach: () => {} }; scheduleAdminRender(); } }
  );
}

function getRank(req, targetId) {
  if (!req) return null;
  if (req.pref1 === targetId) return '1지망';
  if (req.pref2 === targetId) return '2지망';
  if (req.pref3 === targetId) return '3지망';
  return null;
}
function getRankScore(req, targetId) {
  if (!req) return 0;
  if (req.pref1 === targetId) return 3;
  if (req.pref2 === targetId) return 2;
  if (req.pref3 === targetId) return 1;
  return 0;
}

function loadAdminData() {
  if (adminUsersSnap) {
    renderAdminFromSnaps(adminUsersSnap, adminReqSnap || { forEach: () => {} });
  } else {
    db.collection('users').get().then(snap => {
      const render = req => renderAdminFromSnaps(snap, req || { forEach: () => {} });
      if (adminReqSnap) { render(adminReqSnap); return; }
      db.collection('requests').get().then(render).catch(() => render(null));
    }).catch(err => console.error('users 로드 오류:', err));
  }
}

function renderAdminFromSnaps(snap, reqSnap) {
  let heldCount = 0; let waitingCount = 0;
  userMap = {}; adminUsersData = {}; requestsData = {};

  const allParticipantsDiv = document.getElementById('admin-participants-all');
  const unconfirmedManageDiv = document.getElementById('admin-unconfirmed-manage');
  if (allParticipantsDiv) allParticipantsDiv.innerHTML = '';
  if (unconfirmedManageDiv) unconfirmedManageDiv.innerHTML = '';
  let participatingCount = 0; let confirmedCount = 0;

  const emergencySel1 = document.getElementById('emergency-add-user-1');
  const emergencySel2 = document.getElementById('emergency-add-user-2');
  if (emergencySel1) emergencySel1.innerHTML = '<option value="">불참 회원 선택</option>';
  if (emergencySel2) emergencySel2.innerHTML = '<option value="">불참 회원 선택</option>';

  const waitingListDiv = document.getElementById('admin-waiting-list');
  const submittedListDiv = document.getElementById('admin-submitted-list');
  const logListDiv = document.getElementById('admin-requests-list');
  if (waitingListDiv) waitingListDiv.innerHTML = '';
  if (submittedListDiv) submittedListDiv.innerHTML = '';
  if (logListDiv) logListDiv.innerHTML = '';
  let logsArray = [];

  reqSnap.forEach(rDoc => { requestsData[rDoc.id] = rDoc.data(); });

  snap.forEach(doc => {
    const u = doc.data();
    userMap[doc.id] = u.nickname;
    adminUsersData[doc.id] = { id: doc.id, ...u };
    if (u.isAdmin || !u.nickname) return;
    if (u.status === 'held') heldCount++;

    // Step 0: 참여예정자 목록 (check status)
    if (u.isParticipating !== false) {
      participatingCount++;
      const checkColor = u.isProfileConfirmed ? '#27ae60' : '#e74c3c';
      const checkLabel = u.isProfileConfirmed ? '✅ 점검완료' : '❌ 미점검';
      if (allParticipantsDiv) allParticipantsDiv.innerHTML += `<div style="padding:7px 0; border-bottom:1px dashed #eee; display:flex; justify-content:space-between; align-items:center;"><span>${u.emoji||'👤'} ${u.nickname}</span><span style="color:${checkColor}; font-weight:700; font-size:0.85rem;">${checkLabel}</span></div>`;
      if (u.isProfileConfirmed) confirmedCount++;
      else if (unconfirmedManageDiv) unconfirmedManageDiv.innerHTML += `<div style="padding:7px 0; border-bottom:1px dashed #eee; display:flex; justify-content:space-between; align-items:center;"><span>${u.emoji||'👤'} ${u.nickname}</span><button onclick="setUserNotParticipating('${doc.id}','${u.nickname}')" style="background:#e74c3c; color:white; font-size:0.78rem; padding:5px 10px; border-radius:8px; width:auto; cursor:pointer; border:none;">참여 X</button></div>`;
    } else {
      // 불참 회원 → 긴급 추가 셀렉트에 추가
      const opt = `<option value="${doc.id}">${u.emoji||'👤'} ${u.nickname}</option>`;
      if (emergencySel1) emergencySel1.innerHTML += opt;
      if (emergencySel2) emergencySel2.innerHTML += opt;
    }

    // Step 1: 미제출자 미리보기
    if (u.isParticipating && u.status === 'waiting' && !u.emergencyAdded) {
      waitingCount++;
      const req = requestsData[doc.id] || {};
      const p1 = userMap[req.pref1] || '-'; const p2 = userMap[req.pref2] || '-'; const dp = userMap[req.dispref1] || '-';
      if (waitingListDiv) waitingListDiv.innerHTML += `<div style="padding:8px 0; border-bottom:1px solid #eee;">
        ⏳ ${u.emoji||'👤'} <b>${u.nickname}</b> <span style="font-size:0.8rem; color:#888; float:right;">(${p1} / ${p2} // ${dp})</span></div>`;
    }

    if (u.isParticipating && u.status === 'submitted' && requestsData[doc.id] && !requestsData[doc.id].isDraft) {
      const req = requestsData[doc.id] || {};
      const p1 = userMap[req.pref1] || '-';
      const emerTag = u.emergencyAdded ? ' <span style="font-size:0.7rem;color:#e67e22;background:#fff3e0;border-radius:5px;padding:1px 5px;">긴급</span>' : '';
      if (submittedListDiv) submittedListDiv.innerHTML += `<div style="padding:8px 0; border-bottom:1px solid #eee;">✅ ${u.emoji||'👤'} <b>${u.nickname}</b>${emerTag} <span style="font-size:0.8rem;color:#888;float:right;">1지망: ${p1}</span></div>`;
      logsArray.push({ id: doc.id, req: requestsData[doc.id] });
    }
  });

  const heldCountEl = document.getElementById('held-count');
  if (heldCountEl) heldCountEl.innerText = heldCount;
  if (waitingListDiv && waitingCount === 0) waitingListDiv.innerHTML = "<p style='color:#777;'>모든 참가자가 제출을 완료했습니다.</p>";
  if (submittedListDiv && submittedListDiv.innerHTML === '') submittedListDiv.innerHTML = "<p style='color:#777;'>아직 제출한 참여자가 없습니다.</p>";

  logsArray.sort((a, b) => (b.req.timestamp?.seconds || 0) - (a.req.timestamp?.seconds || 0));
  logsArray.slice(0, 4).forEach(log => {
    if (logListDiv) logListDiv.innerHTML += `<div style="padding:8px; border-bottom:1px solid #eee;">${adminUsersData[log.id]?.emoji||'👩'} <b>${userMap[log.id]}</b> ➜ 1지망: <span style="color:#FD79A8">${userMap[log.req.pref1] || '-'}</span></div>`;
  });
  if (logListDiv && logsArray.length === 0) logListDiv.innerHTML = "<p style='color:#777;'>제출된 지망이 없습니다.</p>";

  if (allParticipantsDiv && allParticipantsDiv.innerHTML === '') allParticipantsDiv.innerHTML = "<p style='color:#777; font-size:0.9rem;'>참여 예정자가 없습니다.</p>";
  if (unconfirmedManageDiv && unconfirmedManageDiv.innerHTML === '') unconfirmedManageDiv.innerHTML = "<p style='color:#27ae60; font-weight:700; font-size:0.9rem;'>✅ 미점검 참여자가 없습니다.</p>";

  const profileCheckStatus = document.getElementById('profile-check-confirm-status');
  if (profileCheckStatus) profileCheckStatus.innerHTML = `참여 예정자 ${participatingCount}명 중 <b>${confirmedCount}명</b> 점검 완료`;

  // Toggle sync from settings
  if (globalSettings.showPref2 !== undefined) { const el = document.getElementById('toggle-pref2'); if (el) el.checked = globalSettings.showPref2; }
  if (globalSettings.showPref3 !== undefined) { const el = document.getElementById('toggle-pref3'); if (el) el.checked = globalSettings.showPref3; }
  if (globalSettings.showDispref !== undefined) { const el = document.getElementById('toggle-dispref'); if (el) el.checked = globalSettings.showDispref; }

      // 4-2단계: 확정된 팀 목록
      const matchedListDiv = document.getElementById('admin-matched-list');
      if (!matchedListDiv) return;
      matchedListDiv.innerHTML = '';
      const teamGroups = {};
      snap.forEach(doc => {
        const u = doc.data();
        if (u.status !== 'matched' || !u.teamId) return;
        if (!teamGroups[u.teamId]) teamGroups[u.teamId] = [];
        teamGroups[u.teamId].push({ id: doc.id, ...u });
      });
      let totalMatched = 0;
      Object.entries(teamGroups).forEach(([tid, members]) => {
        totalMatched += members.length;
        const leader = members.find(m => m.isTeamLeader);
        const memberStr = members.map(m =>
          `${m.emoji||'👤'} <b>${m.nickname}</b>${m.id === leader?.id ? ' 👑' : ''}${!m.kakaoLink ? ' <span style="color:#e74c3c;font-size:0.75rem;">⚠️</span>' : ''}`
        ).join(' · ');
        matchedListDiv.innerHTML += `<div style="padding:8px; border-bottom:1px solid #ffd1e5;">${memberStr}</div>`;
      });
      if (matchedListDiv.innerHTML === '') matchedListDiv.innerHTML = "<p style='color:#777;'>아직 확정된 팀이 없습니다.</p>";

      // Step 3: 최종 팀 목록 및 요약 동기화
      const matchedListFinal = document.getElementById('admin-matched-list-final');
      const finalSummary = document.getElementById('final-match-summary');
      if (matchedListFinal) matchedListFinal.innerHTML = matchedListDiv.innerHTML;
      if (finalSummary) finalSummary.innerText = `확정된 팀: ${Object.keys(teamGroups).length}팀 / 총 ${totalMatched}명`;

      // 4-3: 수동 팀 구성 셀렉트 박스 채우기
      const manualTeamSelect = document.getElementById('manual-team-users');
      if (manualTeamSelect) {
        manualTeamSelect.innerHTML = '';
        snap.forEach(doc => {
          const u = doc.data();
          if (u.isAdmin || !u.isParticipating || !['waiting','submitted','held'].includes(u.status)) return;
          const opt = document.createElement('option');
          opt.value = doc.id;
          opt.innerText = `${u.emoji||'👤'} ${u.nickname} (${u.status})`;
          manualTeamSelect.appendChild(opt);
        });
      }

      // 전광판/매칭명 인풋에 현재 설정값 반영
      if (globalSettings.tickerMessage !== undefined) document.getElementById('ticker-input').value = globalSettings.tickerMessage || '';
      if (globalSettings.matchTitle !== undefined) document.getElementById('match-title-input').value = globalSettings.matchTitle || '';
      const adminKakaoInput = document.getElementById('admin-kakao-link-input');
      if (adminKakaoInput && globalSettings.adminKakaoLink !== undefined) adminKakaoInput.value = globalSettings.adminKakaoLink || '';

  renderAllMembersPanel();
}


function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function runMatchAlgorithm(unassigned, usersData, reqData, targetSize) {
  const n = unassigned.length;
  if (n < 2) return null;

  const lvMap = { '입문': 0, '보통': 1, '고수': 2 };

  function pairRaw(aId, bId) {
    const aHist = usersData[aId]?.matchHistory || [];
    const bHist = usersData[bId]?.matchHistory || [];
    if (aHist.includes(bId) || bHist.includes(aId)) return -2;
    return getRankScore(reqData[aId], bId) + getRankScore(reqData[bId], aId);
  }

  function getSpectrumSimilarity(aId, bId) {
    const gsKeys = ['relaxVsCompetitive', 'peacefulVsInteraction', 'luckVsSkill'];
    const gsA = usersData[aId]?.gameSpectrums || {};
    const gsB = usersData[bId]?.gameSpectrums || {};
    let totalDiff = 0;
    gsKeys.forEach(k => { totalDiff += Math.abs((gsA[k] ?? 50) - (gsB[k] ?? 50)); });
    return Math.round((1 - totalDiff / 300) * 100);
  }

  function addScore(team, candidateId) {
    let score = 0;
    const cUser = usersData[candidateId];
    const cLv = lvMap[cUser?.checklist?.skillLevel ?? '보통'];
    const cTags = (cUser?.genreTags || []).filter(t => t !== '모르겠다');
    const teamHasExpert = team.some(m => usersData[m.id]?.checklist?.skillLevel === '고수');

    for (const member of team) {
      score += pairRaw(member.id, candidateId);
      if (reqData[member.id]?.dispref1 === candidateId) score -= 8;
      if (reqData[candidateId]?.dispref1 === member.id) score -= 8;

      // 게임 성향 등급화 (기존 단순 +0.5 → 연속 스케일)
      const sim = getSpectrumSimilarity(member.id, candidateId);
      score += sim >= 70 ? 1.5 : sim >= 50 ? 0.5 : -0.5;

      // 장르 겹침 보너스
      const mTags = (usersData[member.id]?.genreTags || []).filter(t => t !== '모르겠다');
      if (mTags.length && cTags.length && mTags.some(t => cTags.includes(t))) score += 0.5;

      // 숙련도: 팀에 고수 없으면 고수 우대, 고수 중복 약한 페널티
      if (!teamHasExpert && cLv === 2) score += 1.0;
      else if (teamHasExpert && cLv === 2) score -= 0.5;
    }
    return score;
  }

  function totalScore(teams) {
    let s = 0;
    for (const team of teams)
      for (let i = 0; i < team.length; i++)
        for (let j = i + 1; j < team.length; j++)
          s += pairRaw(team[i].id, team[j].id);
    return s;
  }

  const kFloor = Math.floor(n / targetSize);
  const remainder = n % targetSize;
  let teamSizes;
  if (remainder === 0) {
    // 딱 나눠떨어짐
    teamSizes = kFloor > 0 ? Array(kFloor).fill(targetSize) : [n];
  } else if (kFloor === 0) {
    // n < targetSize: 전원 한 팀
    teamSizes = [n];
  } else if (kFloor >= remainder) {
    // 나머지를 T+1 팀에 흡수 (T 또는 T+1만 사용)
    teamSizes = [...Array(kFloor - remainder).fill(targetSize), ...Array(remainder).fill(targetSize + 1)];
  } else {
    // remainder > kFloor: T+1 분산 불가 → (kFloor+1)팀으로 균등 분배
    const numT = kFloor + 1;
    const small = Math.floor(n / numT);
    const big = n % numT;
    teamSizes = [...Array(numT - big).fill(small), ...Array(big).fill(small + 1)];
  }
  const numTeams = teamSizes.length;

  function sortByLeastPopular(pool) {
    return [...pool].sort((a, b) => {
      const inA = unassigned.reduce((s, u) => u.id !== a.id ? s + getRankScore(reqData[u.id], a.id) : s, 0);
      const inB = unassigned.reduce((s, u) => u.id !== b.id ? s + getRankScore(reqData[u.id], b.id) : s, 0);
      return inA - inB;
    });
  }

  function runOnce(poolInput) {
    const pool = [...poolInput];
    const teams = Array.from({ length: numTeams }, () => []);

    // 룰마 선배치: 비인기순 정렬 후 팀 수만큼 각 팀 앵커로
    const rmCandidates = sortByLeastPopular(pool.filter(u => !!(u.checklist?.canRuleMaster)));
    rmCandidates.forEach((rm, i) => {
      if (i < numTeams) {
        teams[i].push(rm);
        const idx = pool.findIndex(p => p.id === rm.id);
        if (idx !== -1) pool.splice(idx, 1);
      }
    });

    for (let ti = 0; ti < numTeams; ti++) {
      const tsz = teamSizes[ti];
      while (teams[ti].length < tsz && pool.length > 0) {
        const candidates = pool.map(u => ({
          u,
          score: addScore(teams[ti], u.id),
          dispref: teams[ti].some(m => reqData[m.id]?.dispref1 === u.id || reqData[u.id]?.dispref1 === m.id),
          extraRM: !!(u.checklist?.canRuleMaster) && teams[ti].some(m => !!(m.checklist?.canRuleMaster)),
        }));
        candidates.sort((a, b) => {
          if (a.dispref !== b.dispref) return a.dispref ? 1 : -1;
          if (a.extraRM !== b.extraRM) return a.extraRM ? 1 : -1;
          return b.score - a.score;
        });
        const best = candidates[0];
        teams[ti].push(best.u);
        pool.splice(pool.findIndex(p => p.id === best.u.id), 1);
      }
    }
    if (pool.length > 0) teams[teams.length - 1].push(...pool);
    return teams;
  }

  const sortedPool = sortByLeastPopular(unassigned);
  let bestTeams = runOnce(sortedPool);
  let bestScore = totalScore(bestTeams);

  for (let i = 0; i < 19; i++) {
    const candidate = runOnce(shuffle(unassigned));
    const score = totalScore(candidate);
    if (score > bestScore) { bestScore = score; bestTeams = candidate; }
  }

  return bestTeams;
}

document.getElementById('start-auto-match-btn').addEventListener('click', () => {
  const targetSize = globalSettings.targetTeamSize || 4;
  const unassigned = Object.values(adminUsersData).filter(
    u => u.status === 'submitted' && u.isParticipating !== false && !u.isAdmin && !u.emergencyAdded && !(requestsData[u.id]?.isDraft)
  );
  if (unassigned.length < 2) return alert("매칭 가능한 인원이 부족합니다.");
  const bestTeams = runMatchAlgorithm(unassigned, adminUsersData, requestsData, targetSize);
  if (!bestTeams) return alert("매칭 가능한 인원이 부족합니다.");
  proposedQueue = bestTeams;
  if (proposedQueue.length === 0) return alert("구성 가능한 팀이 없습니다.");
  showNextProposal();
});

let currentProposal = null;
function showNextProposal() {
  if (proposedQueue.length === 0) {
    document.getElementById('sim-result-box').style.display = 'none';
    return alert("제안된 모든 팀 검토가 끝났습니다.");
  }
  currentProposal = proposedQueue.shift();
  const team = currentProposal;

  document.getElementById('sim-result-box').style.display = 'block';
  document.getElementById('sim-team-members').innerHTML = team.map(u =>
    `<div style="background:white; padding:8px 12px; border-radius:10px; box-shadow:0 2px 6px rgba(0,0,0,0.06); text-align:center; min-width:60px;">
      <div style="font-size:1.8rem;">${u.emoji||'👤'}</div>
      <div style="font-weight:800; font-size:0.82rem;">${u.nickname}</div>
      <div style="font-size:0.7rem; color:#888;">${u.checklist?.skillLevel||'보통'}</div>
      ${u.checklist?.canRuleMaster ? '<div style="font-size:0.65rem; color:#8e44ad; font-weight:700;">룰마✅</div>' : ''}
    </div>`
  ).join('');

  const infoLines = [`<b>팀원 ${team.length}명</b>`];

  // 📤 팀 내 보낸 선택
  infoLines.push('<br><span style="font-size:0.82rem; color:#888; font-weight:700;">📤 팀 내 지망 현황</span>');
  let hasAnyPick = false;
  team.forEach(A => {
    team.forEach(B => {
      if (A.id === B.id) return;
      const rank = getRank(requestsData[A.id], B.id);
      if (rank) { infoLines.push(`${A.emoji||'👤'} ${A.nickname} → ${B.nickname}: <b>${rank}</b>`); hasAnyPick = true; }
    });
  });
  if (!hasAnyPick) infoLines.push('<span style="color:#bbb; font-size:0.82rem;">팀 내 지망 없음</span>');

  // 📥 팀원별 받은 선택 (관리자 전용)
  infoLines.push('<br><span style="font-size:0.82rem; color:#888; font-weight:700;">📥 팀원별 받은 선택</span>');
  team.forEach(A => {
    const inTeam = [];
    team.forEach(B => {
      if (A.id === B.id) return;
      const rank = getRank(requestsData[B.id], A.id);
      if (rank) inTeam.push(`${B.emoji||'👤'}${B.nickname}(${rank})`);
    });
    let externalCount = 0;
    Object.entries(requestsData).forEach(([uid, req]) => {
      if (team.some(m => m.id === uid)) return;
      if ([req.pref1, req.pref2, req.pref3].includes(A.id)) externalCount++;
    });
    const extStr = externalCount > 0 ? ` <span style="color:#bbb; font-size:0.72rem;">(+팀외 ${externalCount}명)</span>` : '';
    infoLines.push(`${A.emoji||'👤'} <b>${A.nickname}</b>: ${inTeam.length ? inTeam.join(', ') : '<span style="color:#bbb">없음</span>'}${extStr}`);
  });

  const warnings = [];
  const interactions = team.map(u => u.gameSpectrums?.peacefulVsInteraction ?? 50);
  const competitiveness = team.map(u => u.gameSpectrums?.relaxVsCompetitive ?? 50);
  if (competitiveness.length > 1 && Math.max(...competitiveness) - Math.min(...competitiveness) > 40)
    warnings.push('⚡ 경쟁 성향 차이 큰 팀 (즐겜러 ↔ 빡겜러 혼재)');
  if (interactions.filter(v => v > 65).length >= 2)
    warnings.push('⚠️ 인터랙션 성향 강한 팀원 다수 — 치열한 신경전 예상');

  team.forEach(A => {
    team.forEach(B => {
      if (A.id >= B.id) return;
      if ((A.matchHistory||[]).includes(B.id)) warnings.push(`🔁 ${A.nickname} ↔ ${B.nickname}: 이전 매칭 이력`);
      if (requestsData[A.id]?.dispref1 === B.id || requestsData[B.id]?.dispref1 === A.id)
        warnings.push(`🚨 ${A.nickname} ↔ ${B.nickname}: 비선호 포함`);
    });
  });

  if (warnings.length) { infoLines.push(''); warnings.forEach(w => infoLines.push(w)); }
  document.getElementById('sim-match-info').innerHTML = infoLines.join('<br>');
  document.getElementById('sim-warning-msg').innerHTML = warnings.length
    ? `<span style="color:#e74c3c;">${warnings[0]}</span>`
    : '<span style="color:#27ae60;">✅ 이슈 없음</span>';
}

document.getElementById('confirm-match-btn').addEventListener('click', () => {
  const team = currentProposal;
  const teamId = `team-${Date.now()}`;
  const leaderId = team[Math.floor(Math.random() * team.length)].id;
  const batch = db.batch();
  team.forEach(u => {
    batch.update(db.collection('users').doc(u.id), { status: 'matched', teamId, isTeamLeader: u.id === leaderId });
  });
  batch.commit().then(() => { loadAdminData(); showNextProposal(); });
});
document.getElementById('hold-match-btn').addEventListener('click', () => {
  const batch = db.batch();
  currentProposal.forEach(u => batch.update(db.collection('users').doc(u.id), { status: 'held' }));
  batch.commit().then(() => showNextProposal());
});
document.getElementById('reset-held-btn').addEventListener('click', () => {
  db.collection('users').where('status', '==', 'held').get().then(snap => {
    if (snap.empty) return alert("보류 중인 유저가 없습니다.");
    const names = [];
    snap.forEach(doc => {
      db.collection('users').doc(doc.id).update({ status: 'submitted' });
      names.push(doc.data().nickname);
    });
    alert(`${names.join(', ')}님이 자동 제안 대상으로 복구되었습니다.\n"매칭 제안 받기 시작"을 다시 눌러주세요.`);
    loadAdminData();
  });
});
document.getElementById('reset-all-btn').addEventListener('click', () => {
  if (confirm("정말 모든 유저를 초기화합니까?\n이 작업은 되돌릴 수 없습니다.")) {
    db.collection('users').get().then(snap => {
      // teamId별 멤버 ID 그룹핑
      const teamGroups = {};
      snap.forEach(doc => {
        const u = doc.data();
        if (u.teamId) {
          if (!teamGroups[u.teamId]) teamGroups[u.teamId] = [];
          teamGroups[u.teamId].push(doc.id);
        }
      });

      snap.forEach(doc => {
        const u = doc.data();
        const updates = { status: 'waiting', partnerId: null, teamId: null, isTeamLeader: false, isProfileConfirmed: false };
        if (u.teamId && teamGroups[u.teamId]) {
          const teammates = teamGroups[u.teamId].filter(id => id !== doc.id);
          if (teammates.length > 0)
            updates.matchHistory = firebase.firestore.FieldValue.arrayUnion(...teammates);
        }
        db.collection('users').doc(doc.id).update(updates);
      });
      db.collection('settings').doc('global').update({ isMatchingActive: false, resultsPublished: false, isProfileCheckActive: false, adminStep: 0 });
      adminStepInitialized = false;
    });
  }
});
document.getElementById('publish-results-btn').addEventListener('click', () => {
  const missingKakao = Object.values(adminUsersData).filter(u => u.status === 'matched' && !u.kakaoLink);
  let warn = '';
  if (missingKakao.length > 0) warn = `⚠️ 카카오링크 미입력: ${missingKakao.map(u => u.nickname).join(', ')}\n\n`;
  if (confirm(`${warn}전체 팀 구성 결과를 발표합니다!`)) db.collection('settings').doc('global').update({ resultsPublished: true })
    .then(() => goToAdminStep(3, true));
});

document.getElementById('apply-settings-btn').addEventListener('click', () => {
  const tickerMessage = document.getElementById('ticker-input').value.trim();
  const matchTitle = document.getElementById('match-title-input').value.trim();
  const adminKakaoLink = document.getElementById('admin-kakao-link-input').value.trim();
  db.collection('settings').doc('global').set({ tickerMessage, matchTitle, adminKakaoLink }, { merge: true })
    .then(() => alert("설정이 적용되었습니다."));
});

document.getElementById('apply-team-size-btn').addEventListener('click', () => {
  const size = parseInt(document.getElementById('target-team-size').value);
  db.collection('settings').doc('global').set({ targetTeamSize: size }, { merge: true })
    .then(() => alert(`팀 크기가 ${size}인으로 설정되었습니다.`));
});

document.getElementById('manual-team-users').addEventListener('change', function() {
  const panel = document.getElementById('manual-analysis-panel');
  const selected = Array.from(this.selectedOptions).map(o => o.value);
  if (selected.length !== 2) { panel.style.display = 'none'; return; }

  const [aId, bId] = selected;
  const A = adminUsersData[aId] || {};
  const B = adminUsersData[bId] || {};
  const aReq = requestsData[aId] || {};
  const bReq = requestsData[bId] || {};

  // Visual cards
  const cardAEmoji = document.getElementById('manual-card-a-emoji');
  const cardAName = document.getElementById('manual-card-a-name');
  const cardAInfo = document.getElementById('manual-card-a-info');
  const cardASpec = document.getElementById('manual-card-a-spec');
  const cardBEmoji = document.getElementById('manual-card-b-emoji');
  const cardBName = document.getElementById('manual-card-b-name');
  const cardBInfo = document.getElementById('manual-card-b-info');
  const cardBSpec = document.getElementById('manual-card-b-spec');
  if (cardAEmoji) cardAEmoji.innerText = A.emoji || '👤';
  if (cardAName) cardAName.innerText = A.nickname || '-';
  if (cardAInfo) cardAInfo.innerText = A.birthYear ? `${formatBirthYear(A.birthYear)}년생 · ${A.city||''}` : (A.city || '-');
  if (cardASpec) cardASpec.innerText = A.checklist?.skillLevel || '';
  if (cardBEmoji) cardBEmoji.innerText = B.emoji || '👤';
  if (cardBName) cardBName.innerText = B.nickname || '-';
  if (cardBInfo) cardBInfo.innerText = B.birthYear ? `${formatBirthYear(B.birthYear)}년생 · ${B.city||''}` : (B.city || '-');
  if (cardBSpec) cardBSpec.innerText = B.checklist?.skillLevel || '';

  const rankA = getRank(aReq, bId);
  const rankB = getRank(bReq, aId);
  const scoreA = getRankScore(aReq, bId);
  const scoreB = getRankScore(bReq, aId);
  const totalScore = scoreA + scoreB;
  const disA = aReq.dispref1 === bId;
  const disB = bReq.dispref1 === aId;
  const hasHistory = (A.matchHistory || []).includes(bId) || (B.matchHistory || []).includes(aId);

  const gsKeys = ['relaxVsCompetitive', 'peacefulVsInteraction', 'luckVsSkill'];
  const gsA = A.gameSpectrums || {}; const gsB = B.gameSpectrums || {};
  let totalDiff = 0;
  gsKeys.forEach(k => { totalDiff += Math.abs((gsA[k] ?? 50) - (gsB[k] ?? 50)); });
  const similarity = Math.round((1 - totalDiff / 300) * 100);
  const simColor = similarity >= 70 ? '#27ae60' : similarity >= 40 ? '#f39c12' : '#e74c3c';

  const lines = [
    `${A.nickname||'A'} → ${B.nickname||'B'}: <b style="color:var(--soft-rose)">${rankA || '미선택'}</b>`,
    `${B.nickname||'B'} → ${A.nickname||'A'}: <b style="color:var(--soft-rose)">${rankB || '미선택'}</b>`,
    `매칭 점수: <b>${totalScore}점 / 6점</b>`,
    `게임 성향 유사도: <b style="color:${simColor}">${similarity}%</b>`,
  ];
  if (rankA && rankB) lines.push(`💑 <b>서로 지목한 사이입니다!</b>`);
  if (disA) lines.push(`🚨 <b style="color:#e74c3c">${A.nickname}이 ${B.nickname}을 비선호로 선택</b>`);
  if (disB) lines.push(`🚨 <b style="color:#e74c3c">${B.nickname}이 ${A.nickname}을 비선호로 선택</b>`);
  if (hasHistory) lines.push(`🔁 <b style="color:#e67e22">이전 회차 매칭 이력 있음</b>`);
  const infoEl = document.getElementById('manual-match-info');
  if (infoEl) infoEl.innerHTML = lines.join('<br>');

  let verdict = ''; let verdictBg = '';
  if (disA || disB) { verdict = '⛔ 비선호 의사가 있어 매칭 시 주의가 필요합니다.'; verdictBg = '#fdf0f0'; }
  else if (hasHistory) { verdict = '🔁 이전 회차 매칭 이력이 있어 신중한 판단이 필요합니다.'; verdictBg = '#fff8e1'; }
  else if (totalScore >= 5 && rankA && rankB) { verdict = '🌟 최고의 매칭! 서로 높은 지망으로 선택한 강력 추천입니다.'; verdictBg = '#e8f8f0'; }
  else if (totalScore >= 4) { verdict = '💚 좋은 매칭. 서로 긍정적인 인상을 갖고 있습니다.'; verdictBg = '#e8f8f0'; }
  else if (rankA && rankB) { verdict = '💑 서로 선택한 사이입니다. 매칭을 고려해보세요.'; verdictBg = '#fff0f5'; }
  else if (totalScore === 0) { verdict = '❓ 서로 선택하지 않은 사이입니다. 진행자 판단이 필요합니다.'; verdictBg = '#f5f5f5'; }
  else { verdict = `⚠️ 한쪽만 선택한 사이입니다. (점수 ${totalScore}/6점)`; verdictBg = '#fff8e1'; }

  const verdictEl = document.getElementById('manual-match-verdict');
  if (verdictEl) { verdictEl.innerText = verdict; verdictEl.style.background = verdictBg; }

  panel.style.display = 'block';
});

// ==========================================
// 👥 전체 회원 관리 (탭 방식)
// ==========================================

window.switchAdminView = function(view) {
  document.getElementById('admin-match-view').style.display = view === 'match' ? 'block' : 'none';
  document.getElementById('admin-members-panel').style.display = view === 'members' ? 'block' : 'none';
  document.getElementById('admin-banned-panel').style.display = view === 'banned' ? 'block' : 'none';
  document.getElementById('admin-test-panel').style.display = view === 'test' ? 'block' : 'none';
  document.getElementById('admin-tab-match').classList.toggle('active', view === 'match');
  document.getElementById('admin-tab-members').classList.toggle('active', view === 'members');
  document.getElementById('admin-tab-banned').classList.toggle('active', view === 'banned');
  document.getElementById('admin-tab-test').classList.toggle('active', view === 'test');
  if (view === 'members') renderAllMembersPanel();
  if (view === 'banned') renderBannedPanel();
};

function renderBannedPanel() {
  const listEl = document.getElementById('banned-members-list');
  listEl.innerHTML = '<p style="color:#aaa; font-size:0.85rem;">불러오는 중...</p>';
  db.collection('bannedUsers').orderBy('bannedAt', 'desc').get().then(snap => {
    if (snap.empty) { listEl.innerHTML = '<p style="color:#aaa; font-size:0.85rem;">차단된 회원이 없습니다.</p>'; return; }
    listEl.innerHTML = snap.docs.map(doc => {
      const d = doc.data();
      const date = d.bannedAt?.toDate ? d.bannedAt.toDate().toLocaleDateString('ko-KR') : '-';
      const escNick = (d.nickname || doc.id).replace(/'/g, "\\'");
      return `<div class="member-row" style="display:flex; align-items:center; justify-content:space-between;">
        <div>
          <div style="font-weight:700; font-size:0.9rem;">${d.nickname || doc.id}</div>
          <div style="font-size:0.75rem; color:#aaa;">차단일: ${date}</div>
        </div>
        <button onclick="adminUnbanUser('${doc.id}', '${escNick}')" style="background:#e8f5e9; color:#27ae60; border:1px solid #a5d6a7; font-size:0.75rem; padding:5px 10px; width:auto; border-radius:8px;">차단 해제</button>
      </div>`;
    }).join('');
  }).catch(() => { listEl.innerHTML = '<p style="color:#e74c3c; font-size:0.85rem;">불러오기 실패</p>'; });
}

window.adminUnbanUser = function(uid, nickname) {
  if (!confirm(`${nickname}님의 차단을 해제하시겠습니까?\n해제 후 다시 로그인할 수 있습니다.`)) return;
  db.collection('bannedUsers').doc(uid).delete().then(() => {
    alert(`${nickname}님 차단이 해제되었습니다.`);
    renderBannedPanel();
  });
};

function renderAllMembersPanel() {
  if (document.getElementById('admin-members-panel')?.style.display === 'none') return;
  const searchVal = (document.getElementById('member-search')?.value || '').toLowerCase();
  const statusFilter = document.getElementById('member-filter-status')?.value || '';
  const partFilter = document.getElementById('member-filter-part')?.value || '';

  const listEl = document.getElementById('all-members-list');
  const countEl = document.getElementById('all-members-count');
  if (!listEl) return;

  const allMembers = Object.values(adminUsersData).filter(u => u.nickname);
  const members = allMembers.filter(u => {
    if (searchVal && !u.nickname.toLowerCase().includes(searchVal)) return false;
    if (statusFilter && u.status !== statusFilter) return false;
    if (partFilter === 'yes' && u.isParticipating === false) return false;
    if (partFilter === 'no' && u.isParticipating !== false) return false;
    return true;
  });

  if (countEl) countEl.innerText = `전체 ${allMembers.length}명 중 ${members.length}명 표시`;

  if (members.length === 0) {
    listEl.innerHTML = '<p style="color:#777; text-align:center; padding:20px;">검색 결과가 없습니다.</p>';
    return;
  }

  const statusInfo = {
    waiting:   { label: '대기',   color: '#95a5a6' },
    submitted: { label: '제출',   color: '#3498db' },
    matched:   { label: '매칭',   color: '#27ae60' },
    held:      { label: '보류',   color: '#f39c12' }
  };

  members.sort((a, b) => {
    if (a.isAdmin !== b.isAdmin) return a.isAdmin ? -1 : 1;
    return (a.nickname || '').localeCompare(b.nickname || '', 'ko');
  });

  listEl.innerHTML = members.map(u => {
    const si = statusInfo[u.status] || { label: u.status || '-', color: '#999' };
    const partColor = u.isParticipating !== false ? '#27ae60' : '#e74c3c';
    const partLabel = u.isParticipating !== false ? '참여O' : '불참';
    const confColor = u.isProfileConfirmed ? '#27ae60' : '#ccc';
    const confLabel = u.isProfileConfirmed ? '점검O' : '점검X';
    const escNick = u.nickname.replace(/'/g, "\\'");

    return `<div class="member-row">
      <div class="member-main">
        <span class="member-emoji">${u.emoji || '👤'}</span>
        <div class="member-info">
          <div class="member-name">${u.nickname}${u.isAdmin ? ' <span style="font-size:0.68rem;color:#e67e22;font-weight:700;background:#fff3e0;padding:1px 5px;border-radius:6px;">관리자</span>' : ''}${!u.isAdmin ? ` <button onclick="adminDeleteUser('${u.id}', '${escNick}')" style="background:none; color:#ccc; border:none; font-size:0.85rem; padding:0 2px; width:auto; cursor:pointer; line-height:1; vertical-align:middle;">✕</button>` : ''}</div>
          <div class="member-sub">${u.birthYear ? formatBirthYear(u.birthYear) + '년생' : '-'} · ${u.city || '-'}</div>
          <div style="display:flex; flex-wrap:wrap; gap:3px; margin-top:4px;">
            <span style="background:${si.color}22; color:${si.color}; border:1px solid ${si.color}55; padding:1px 7px; border-radius:10px; font-size:0.68rem; font-weight:700;">${si.label}</span>
            <span style="background:${partColor}22; color:${partColor}; border:1px solid ${partColor}55; padding:1px 7px; border-radius:10px; font-size:0.68rem; font-weight:700;">${partLabel}</span>
            <span style="background:${confColor}22; color:${confColor}; border:1px solid ${confColor}55; padding:1px 7px; border-radius:10px; font-size:0.68rem; font-weight:700;">${confLabel}</span>
          </div>
        </div>
      </div>
      <div class="member-actions">
        <button onclick="adminTogglePart('${u.id}', '${escNick}', ${u.isParticipating !== false})" style="background:${partColor}; color:white; font-size:0.7rem; padding:5px 8px; width:auto; border-radius:8px; margin-top:2px;">${u.isParticipating !== false ? '불참전환' : '참여전환'}</button>
        <button onclick="adminResetUser('${u.id}')" style="background:#fdf0f0; color:#e74c3c; border:1px solid #f5c6c6; font-size:0.7rem; padding:5px 8px; width:auto; border-radius:8px; margin-top:2px;">초기화</button>
      </div>
    </div>`;
  }).join('');
}


window.adminDeleteUser = function(uid, nickname) {
  if (!confirm(`⚠️ ${nickname}님을 정말 삭제하시겠습니까?\n\n프로필·지망 데이터가 모두 삭제됩니다.\n(로그인 계정은 유지됩니다)\n\n이 작업은 되돌릴 수 없습니다.`)) return;
  if (!confirm(`마지막 확인: "${nickname}" 회원을 삭제합니다.`)) return;

  const u = adminUsersData[uid];
  const batch = db.batch();

  if (u?.teamId) {
    Object.values(adminUsersData).forEach(m => {
      if (m.id !== uid && m.teamId === u.teamId) {
        batch.update(db.collection('users').doc(m.id), { status: 'waiting', teamId: null, isTeamLeader: false });
      }
    });
  }

  batch.delete(db.collection('users').doc(uid));
  batch.delete(db.collection('requests').doc(uid));
  batch.set(db.collection('bannedUsers').doc(uid), { nickname, bannedAt: firebase.firestore.FieldValue.serverTimestamp() });
  batch.commit().then(() => {
    delete adminUsersData[uid];
    renderAllMembersPanel();
    alert(`${nickname}님 데이터가 삭제되었습니다. (접속 차단됨)`);
  });
};

window.adminTogglePart = function(uid, nickname, currentlyParticipating) {
  const newPart = !currentlyParticipating;
  const msg = newPart ? `${nickname}님을 참여O로 변경하시겠습니까?` : `${nickname}님을 불참으로 변경하시겠습니까?`;
  if (!confirm(msg)) return;
  db.collection('users').doc(uid).update({ isParticipating: newPart }).then(() => {
    adminUsersData[uid].isParticipating = newPart;
    renderAllMembersPanel();
  });
};

window.adminResetUser = function(uid) {
  const u = adminUsersData[uid];
  if (!u) return;
  const { nickname, status, teamId } = u;
  const msg = status === 'matched' && teamId
    ? `${nickname}님을 초기화합니까?\n⚠️ 매칭된 팀원들도 함께 대기 상태로 초기화됩니다.`
    : `${nickname}님의 매칭 상태를 초기화합니까?\n(대기 상태로 복구, 제출 내역 삭제)`;
  if (!confirm(msg)) return;

  const batch = db.batch();
  const resetFields = { status: 'waiting', teamId: null, isTeamLeader: false, isProfileConfirmed: false };
  batch.update(db.collection('users').doc(uid), resetFields);
  batch.delete(db.collection('requests').doc(uid));

  if (status === 'matched' && teamId) {
    Object.values(adminUsersData).forEach(m => {
      if (m.id !== uid && m.teamId === teamId) {
        batch.update(db.collection('users').doc(m.id), resetFields);
      }
    });
  }

  batch.commit().then(() => {
    Object.assign(adminUsersData[uid], resetFields);
    if (status === 'matched' && teamId) {
      Object.values(adminUsersData).forEach(m => {
        if (m.teamId === teamId) Object.assign(adminUsersData[m.id], resetFields);
      });
    }
    renderAllMembersPanel();
    alert(`${nickname}님 초기화 완료`);
  });
};

document.getElementById('manual-match-btn').addEventListener('click', () => {
  const select = document.getElementById('manual-team-users');
  const selectedIds = [...select.selectedOptions].map(o => o.value);
  if (selectedIds.length < 2) return alert("2명 이상 선택하세요. (Ctrl/Cmd 클릭으로 다중 선택)");
  const names = selectedIds.map(id => adminUsersData[id]?.nickname).join(', ');
  if (!confirm(`${names}\n위 ${selectedIds.length}명을 수동 팀으로 확정하시겠습니까?`)) return;
  const teamId = `team-${Date.now()}`;
  const leaderId = selectedIds[Math.floor(Math.random() * selectedIds.length)];
  const batch = db.batch();
  selectedIds.forEach(id => {
    batch.update(db.collection('users').doc(id), { status: 'matched', teamId, isTeamLeader: id === leaderId });
  });
  batch.commit().then(() => { alert("수동 팀 구성 완료!"); loadAdminData(); });
});

// ==========================================
// 🧪 매칭 테스트 시뮬레이션
// ==========================================

let testParticipants = [];
const TEST_PRESET_NAMES = ['진수', '미래', '현우', '소연', '동현', '지은', '민준', '서연', '태양', '나리', '준혁', '수빈'];
const TEST_EMOJIS = ['😀','😎','🤔','😄','🥳','😊','🤩','😇','🤗','😏','🧐','🙂'];
const TEST_SKILLS = ['입문', '보통', '고수'];
const TEST_GENRES = ['파티형', '전략/유로형', '블러핑/추리형', '테마/협력형'];

window.testLoadPreset = function(count, teamSize) {
  testParticipants = [];
  const tsEl = document.getElementById('test-team-size');
  if (tsEl) tsEl.value = teamSize;

  const numTeams = Math.ceil(count / teamSize);
  const rmCount = Math.max(numTeams, Math.ceil(count * 0.25));
  const rmIndices = new Set();
  while (rmIndices.size < Math.min(rmCount, count)) {
    rmIndices.add(Math.floor(Math.random() * count));
  }

  for (let i = 0; i < count; i++) {
    testParticipants.push({
      id: `t${i}`,
      nickname: TEST_PRESET_NAMES[i % TEST_PRESET_NAMES.length],
      emoji: TEST_EMOJIS[i % TEST_EMOJIS.length],
      status: 'submitted',
      isParticipating: true,
      isAdmin: false,
      emergencyAdded: false,
      checklist: {
        canRuleMaster: rmIndices.has(i),
        skillLevel: TEST_SKILLS[Math.floor(Math.random() * 3)],
      },
      gameSpectrums: {
        relaxVsCompetitive: Math.floor(Math.random() * 100),
        peacefulVsInteraction: Math.floor(Math.random() * 100),
        luckVsSkill: Math.floor(Math.random() * 100),
      },
      genreTags: shuffle([...TEST_GENRES]).slice(0, 1 + Math.floor(Math.random() * 2)),
      matchHistory: [],
      picks: { pref1: null, pref2: null, pref3: null, dispref1: null, isDraft: false },
    });
  }

  testParticipants.forEach(p => {
    const others = shuffle(testParticipants.filter(o => o.id !== p.id));
    p.picks.pref1 = others[0]?.id || null;
    if (Math.random() > 0.3) p.picks.pref2 = others[1]?.id || null;
    if (Math.random() > 0.5) p.picks.pref3 = others[2]?.id || null;
    if (Math.random() < 0.25 && others[3]) p.picks.dispref1 = others[3].id;
  });

  renderTestParticipants();
  const rp = document.getElementById('test-result-panel');
  if (rp) rp.style.display = 'none';
};

window.testReset = function() {
  testParticipants = [];
  renderTestParticipants();
  const rp = document.getElementById('test-result-panel');
  if (rp) rp.style.display = 'none';
};

function renderTestParticipants() {
  const area = document.getElementById('test-participants-area');
  if (!area) return;
  if (testParticipants.length === 0) {
    area.innerHTML = '<p style="color:#aaa; text-align:center; padding:16px 0;">위 버튼으로 가상 참여자를 추가하세요.</p>';
    return;
  }
  const nameMap = Object.fromEntries(testParticipants.map(p => [p.id, p.nickname]));
  const rmCount = testParticipants.filter(p => p.checklist.canRuleMaster).length;
  area.innerHTML = `
    <p style="font-size:0.82rem; color:#888; margin-bottom:10px;">총 ${testParticipants.length}명 · 룰마 ${rmCount}명</p>
    <div style="overflow-x:auto;">
      <table style="width:100%; border-collapse:collapse; font-size:0.8rem;">
        <thead>
          <tr style="background:#f8f8f8;">
            <th style="padding:7px 8px; border-bottom:2px solid #eee; text-align:left;">참여자</th>
            <th style="padding:7px 8px; border-bottom:2px solid #eee; text-align:center;">룰마</th>
            <th style="padding:7px 8px; border-bottom:2px solid #eee; text-align:left;">숙련도</th>
            <th style="padding:7px 8px; border-bottom:2px solid #eee; text-align:left; color:var(--soft-rose);">1지망</th>
            <th style="padding:7px 8px; border-bottom:2px solid #eee; text-align:left; color:#f39c12;">2지망</th>
            <th style="padding:7px 8px; border-bottom:2px solid #eee; text-align:left; color:#aaa;">3지망</th>
            <th style="padding:7px 8px; border-bottom:2px solid #eee; text-align:left; color:#95a5a6;">비선호</th>
          </tr>
        </thead>
        <tbody>
          ${testParticipants.map(p => `
            <tr style="border-bottom:1px solid #f5f5f5;">
              <td style="padding:7px 8px; font-weight:700;">${p.emoji} ${p.nickname}</td>
              <td style="padding:7px 8px; text-align:center;">${p.checklist.canRuleMaster ? '✅' : '❌'}</td>
              <td style="padding:7px 8px;">${p.checklist.skillLevel}</td>
              <td style="padding:7px 8px; color:var(--soft-rose); font-weight:700;">${nameMap[p.picks.pref1] || '-'}</td>
              <td style="padding:7px 8px; color:#f39c12;">${nameMap[p.picks.pref2] || '-'}</td>
              <td style="padding:7px 8px; color:#aaa;">${nameMap[p.picks.pref3] || '-'}</td>
              <td style="padding:7px 8px; color:#95a5a6;">${nameMap[p.picks.dispref1] || '-'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

window.runTestSimulation = function() {
  if (testParticipants.length < 2) return alert("프리셋을 먼저 추가해주세요.");
  const targetSize = parseInt(document.getElementById('test-team-size').value) || 4;
  const testUsersData = Object.fromEntries(testParticipants.map(p => [p.id, p]));
  const testReqData = Object.fromEntries(testParticipants.map(p => [p.id, p.picks]));
  const teams = runMatchAlgorithm(testParticipants, testUsersData, testReqData, targetSize);
  if (!teams) return alert("매칭 가능한 인원이 부족합니다.");
  renderTestResult(teams, testUsersData, testReqData);
};

function renderTestResult(teams, usersData, reqData) {
  const panel = document.getElementById('test-result-panel');
  const area = document.getElementById('test-result-area');
  if (!panel || !area) return;

  const totalPeople = teams.reduce((s, t) => s + t.length, 0);
  const rmTeams = teams.filter(t => t.some(u => u.checklist?.canRuleMaster)).length;

  area.innerHTML = `<p style="font-size:0.85rem; color:#555; margin-bottom:14px; font-weight:700;">총 ${teams.length}팀 · ${totalPeople}명 · 룰마 보유팀 ${rmTeams}/${teams.length}</p>` +
    teams.map((team, ti) => {
      const hasRM = team.some(u => u.checklist?.canRuleMaster);

      const memberCards = team.map(u =>
        `<div style="background:white; padding:10px; border-radius:12px; box-shadow:0 2px 8px rgba(0,0,0,0.07); text-align:center; flex:1; min-width:64px; max-width:90px;">
          <div style="font-size:1.5rem;">${u.emoji||'👤'}</div>
          <div style="font-weight:800; font-size:0.8rem; margin:3px 0;">${u.nickname}</div>
          <div style="font-size:0.65rem; color:#aaa;">${u.checklist?.skillLevel||'보통'}</div>
          ${u.checklist?.canRuleMaster ? '<div style="font-size:0.62rem; color:#8e44ad; font-weight:700; margin-top:2px;">룰마✅</div>' : ''}
        </div>`
      ).join('');

      const pickLines = [];
      team.forEach(A => {
        team.forEach(B => {
          if (A.id === B.id) return;
          const req = reqData[A.id] || {};
          let rank = null;
          if (req.pref1 === B.id) rank = '1지망';
          else if (req.pref2 === B.id) rank = '2지망';
          else if (req.pref3 === B.id) rank = '3지망';
          if (!rank) return;
          const mutual = [reqData[B.id]?.pref1, reqData[B.id]?.pref2, reqData[B.id]?.pref3].includes(A.id);
          const color = mutual ? '#27ae60' : '#f39c12';
          const icon = mutual ? '💑' : '→';
          const disBack = reqData[B.id]?.dispref1 === A.id ? ' <span style="color:#e74c3c; font-size:0.72rem;">⚠️상대비선호</span>' : '';
          pickLines.push(`<div style="font-size:0.8rem; padding:2px 0; color:${color};">${icon} <b>${A.nickname}</b> → <b>${B.nickname}</b>: ${rank}${disBack}</div>`);
        });
      });

      const receivedLines = team.map(A => {
        const inTeam = [];
        team.forEach(B => {
          if (A.id === B.id) return;
          const req = reqData[B.id] || {};
          if (req.pref1 === A.id) inTeam.push(`${B.nickname}(1지)`);
          else if (req.pref2 === A.id) inTeam.push(`${B.nickname}(2지)`);
          else if (req.pref3 === A.id) inTeam.push(`${B.nickname}(3지)`);
        });
        const outTeam = [];
        Object.entries(reqData).forEach(([uid, req]) => {
          if (team.some(m => m.id === uid)) return;
          if ([req.pref1, req.pref2, req.pref3].includes(A.id)) outTeam.push(usersData[uid]?.nickname || '?');
        });
        const inStr = inTeam.length ? inTeam.join(', ') : '<span style="color:#ccc">없음</span>';
        const outStr = outTeam.length ? ` <span style="color:#bbb; font-size:0.7rem;">(팀외: ${outTeam.join(', ')})</span>` : '';
        return `<div style="font-size:0.79rem; padding:2px 0;">📥 <b>${A.nickname}</b> ← ${inStr}${outStr}</div>`;
      }).join('');

      const warns = [];
      if (!hasRM) warns.push('⚠️ 룰마 없음');
      const compet = team.map(u => u.gameSpectrums?.relaxVsCompetitive ?? 50);
      if (compet.length > 1 && Math.max(...compet) - Math.min(...compet) > 40) warns.push('⚡ 경쟁성향 차이 큼');
      team.forEach(A => {
        team.forEach(B => {
          if (A.id >= B.id) return;
          if (reqData[A.id]?.dispref1 === B.id || reqData[B.id]?.dispref1 === A.id)
            warns.push(`🚨 ${A.nickname}↔${B.nickname} 비선호`);
        });
      });
      const warnHtml = warns.length
        ? warns.map(w => `<div style="color:#e74c3c; font-size:0.78rem; padding:2px 0;">${w}</div>`).join('')
        : '<div style="color:#27ae60; font-size:0.78rem; padding:2px 0;">✅ 이슈 없음</div>';

      return `
        <div style="background:#fafafa; border:1.5px solid ${hasRM ? '#eee' : '#f5c6c6'}; border-radius:14px; padding:16px; margin-bottom:12px;">
          <div style="font-weight:800; font-size:0.9rem; color:var(--deep-navy); margin-bottom:12px;">
            팀 ${ti+1} <span style="font-size:0.78rem; font-weight:400; color:#aaa;">${team.length}명</span>
            ${!hasRM ? ' <span style="font-size:0.72rem; color:#e74c3c; background:#fdf0f0; padding:1px 6px; border-radius:6px;">룰마없음</span>' : ''}
          </div>
          <div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:12px;">${memberCards}</div>
          ${pickLines.length ? `<div style="border-top:1px dashed #eee; padding-top:10px; margin-bottom:8px;">${pickLines.join('')}</div>` : ''}
          <div style="border-top:1px dashed #eee; padding-top:10px; margin-bottom:8px;">${receivedLines}</div>
          <div style="border-top:1px dashed #eee; padding-top:10px;">${warnHtml}</div>
        </div>`;
    }).join('');

  panel.style.display = 'block';
  panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
}