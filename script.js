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
    `[#단계] 해맑은 웃음이 피어난 날`,
    `[#단계] 소중한 하루, 따뜻한 기억`,
    `[#단계] 작은 모험의 시작`,
    `[#단계] 그날의 웃음, 오늘도 반짝`,
    `[#단계] 아이의 성장, 그 한 장면`
  ];
  const text = templates[Math.floor(Math.random() * templates.length)];
  return text.replace('#단계', `${rounded}세 추정`);
}

uploadInput.addEventListener('change', async (event) => {
  await loadModels();
  const files = Array.from(event.target.files);
  album.innerHTML = '';

  const imageAges = await Promise.all(
    files.map(async (file) => {
      const img = await loadImage(file);
      const result = await faceapi.detectSingleFace(img, new faceapi.TinyFaceDetectorOptions()).withAgeAndGender();
      return { file, age: result?.age || 5 }; // fallback age
    })
  );

  imageAges.sort((a, b) => a.age - b.age);

  imageAges.forEach(({ file, age }) => {
    const reader = new FileReader();
    reader.onload = function(e) {
      const card = document.createElement('div');
      card.className = 'card';

      const img = document.createElement('img');
      img.src = e.target.result;

      const caption = document.createElement('div');
      caption.className = 'caption';
      caption.innerText = generateCaption(age);

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
