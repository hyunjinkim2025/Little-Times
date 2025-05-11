const uploadInput = document.getElementById('uploadInput');
const album = document.getElementById('album');
const title = document.getElementById('albumTitle');
const childNameInput = document.getElementById('childName');

childNameInput.addEventListener('input', () => {
  const name = childNameInput.value.trim();
  title.textContent = name ? `리틀타임즈, ${name}의 성장앨범` : '리틀타임즈, 아이의 성장앨범';
});

async function loadModels() {
  await faceapi.nets.tinyFaceDetector.loadFromUri('./models');
  await faceapi.nets.ageGenderNet.loadFromUri('./models');
}

function generateCaption(age) {
  const rounded = Math.round(age);
  const templates = [
    `[#단계] 오늘도 웃음이 가득한 날`,
    `[#단계] 작은 기적이 피어난 하루`,
    `[#단계] 맑은 눈망울, 깊은 감성`,
    `[#단계] 환한 웃음 속 따스한 기억`,
    `[#단계] 매일 자라는 너의 하루`
  ];
  const text = templates[Math.floor(Math.random() * templates.length)];
  return text.replace('#단계', `${rounded}세 추정`);
}

uploadInput.addEventListener('change', async (event) => {
  await loadModels();
  const files = Array.from(event.target.files);

  if (files.length > 30) {
    alert("사진은 최대 30장까지 업로드할 수 있어요.");
    return;
  }

  album.innerHTML = '';

  const imageAges = await Promise.all(
    files.map(async (file) => {
      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name}은(는) 5MB를 초과하여 업로드할 수 없어요.`);
        return null;
      }
      const img = await loadImage(file);
      const result = await faceapi.detectSingleFace(img, new faceapi.TinyFaceDetectorOptions()).withAgeAndGender();
      return result ? { file, age: result.age } : null;
    })
  );

  imageAges
    .filter(Boolean)
    .sort((a, b) => a.age - b.age)
    .forEach(({ file, age }) => {
      const reader = new FileReader();
      reader.onload = function(e) {
        const card = document.createElement('div');
        card.className = 'card';

        const img = document.createElement('img');
        img.src = e.target.result;

        const caption = document.createElement('div');
        caption.className = 'caption';
        caption.innerText = generateCaption(age);
        caption.setAttribute("contenteditable", "true");

        card.appendChild(img);
        card.appendChild(caption);
        album.appendChild(card);
      };
      reader.readAsDataURL(file);
    });
});

function loadImage(file) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.src = URL.createObjectURL(file);
  });
}

function downloadPDF() {
  const element = document.body;
  html2pdf().set({
    margin: 0.5,
    filename: '리틀타임즈_성장앨범.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
  }).from(element).save();
}


function shareAlbum() {
  const url = window.location.href;
  const text = encodeURIComponent("리틀타임즈 앨범을 구경해보세요!");
  const encodedURL = encodeURIComponent(url);

  const options = {
    "1": `https://www.facebook.com/sharer/sharer.php?u=${encodedURL}`,
    "2": `https://twitter.com/intent/tweet?url=${encodedURL}&text=${text}`,
    "3": `https://story.kakao.com/share?url=${encodedURL}`,
    "페이스북": `https://www.facebook.com/sharer/sharer.php?u=${encodedURL}`,
    "트위터": `https://twitter.com/intent/tweet?url=${encodedURL}&text=${text}`,
    "카카오": `https://story.kakao.com/share?url=${encodedURL}`
  };

  const choice = prompt("공유할 플랫폼을 선택하세요:\\n1. 페이스북\\n2. 트위터\\n3. 카카오스토리");
  const link = options[choice.trim()];
  if (link) {
    window.open(link, "_blank");
  } else {
    alert("선택이 잘못되었습니다. 1~3 또는 이름을 정확히 입력해 주세요.");
  }
}

