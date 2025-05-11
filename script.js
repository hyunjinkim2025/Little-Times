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
    margin: 0.2,
    filename: '리틀타임즈_성장앨범.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale: 2,
      scrollY: 0, // 스크롤로 인한 위치 왜곡 방지
      useCORS: true
    },
    jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
  }).from(element).save();
}



function copyShareLink() {
  const link = window.location.href;
  navigator.clipboard.writeText(link)
    .then(() => alert("공유 링크가 복사되었습니다! 친구에게 붙여넣어 전달해 보세요."))
    .catch(() => alert("복사에 실패했습니다. 직접 복사해 주세요."));
}


