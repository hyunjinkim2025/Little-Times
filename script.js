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

uploadInput.addEventListener('change', async (event) => {
  await loadModels();
  const files = Array.from(event.target.files);
  if (files.length > 30) {
    alert("사진은 최대 30장까지 업로드할 수 있어요.");
    return;
  }

  album.innerHTML = '';

  const imageAges = await Promise.all(files.map(async (file) => {
    if (file.size > 5 * 1024 * 1024) {
      alert(`${file.name}은(는) 5MB를 초과하여 업로드할 수 없어요.`);
      return null;
    }
    const img = await loadImage(file);
    const result = await faceapi.detectSingleFace(img, new faceapi.TinyFaceDetectorOptions()).withAgeAndGender();
    return result ? { file, age: result.age } : null;
  }));

  imageAges
    .filter(Boolean)
    .sort((a, b) => a.age - b.age)
    .forEach(({ file }) => {
      const reader = new FileReader();
      reader.onload = function(e) {
        const card = document.createElement('div');
        card.className = 'card';

        const img = document.createElement('img');
        img.src = e.target.result;
        img.style.maxHeight = "320px";
        img.style.width = "100%";
        img.style.objectFit = "contain";

        const caption = document.createElement('div');
        caption.className = 'caption';
        caption.contentEditable = true;
        caption.innerText = "사진의 추억을 자유롭게 기록해보세요.";

        caption.addEventListener('focus', () => {
          if (caption.innerText === "사진의 추억을 자유롭게 기록해보세요.") {
            caption.innerText = "";
          }
        });
        caption.addEventListener('blur', () => {
          if (caption.innerText.trim() === "") {
            caption.innerText = "사진의 추억을 자유롭게 기록해보세요.";
          }
        });

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
  const albumContent = album.cloneNode(true);
  albumContent.style.display = "block";
  albumContent.style.width = "800px";
  albumContent.style.padding = "1rem";

  albumContent.querySelectorAll("img").forEach(img => {
    img.style.width = "100%";
    img.style.height = "auto";
    img.style.objectFit = "contain";
  });

  albumContent.querySelectorAll(".caption").forEach(caption => {
    caption.style.whiteSpace = "normal";
  });

  const wrapper = document.createElement("div");
  wrapper.appendChild(albumContent);
  document.body.appendChild(wrapper);

  html2pdf().set({
    margin: 0.3,
    filename: '리틀타임즈_성장앨범.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      scrollY: 0,
      allowTaint: true
    },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  }).from(wrapper).save().then(() => {
    document.body.removeChild(wrapper);
  });
}
