const uploadInput = document.getElementById('uploadInput');
const album = document.getElementById('album');
const title = document.getElementById('albumTitle');
const childNameInput = document.getElementById('childName');

// 앨범 제목 실시간 반영
childNameInput.addEventListener('input', () => {
  const name = childNameInput.value.trim();
  title.textContent = name ? `리틀타임즈, ${name}의 성장앨범` : '리틀타임즈, 아이의 성장앨범';
});

// 얼굴 인식 모델 로딩
async function loadModels() {
  await faceapi.nets.tinyFaceDetector.loadFromUri('./models');
  await faceapi.nets.ageGenderNet.loadFromUri('./models');
}

// 이미지 업로드 처리
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
    .forEach(({ file }) => {
      const reader = new FileReader();
      reader.onload = function(e) {
        const card = document.createElement('div');
        card.className = 'card';

        const img = document.createElement('img');
        img.src = e.target.result;

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

// PDF 다운로드
function downloadPDF() {
  const printArea = document.createElement("div");
  printArea.style.width = "210mm";
  printArea.style.minHeight = "297mm";
  printArea.style.padding = "10mm";
  printArea.style.boxSizing = "border-box";
  printArea.style.backgroundImage = "url('./images/bg.png')";
  printArea.style.backgroundRepeat = "repeat";
  printArea.style.backgroundSize = "cover";
  printArea.style.display = "flex";
  printArea.style.flexDirection = "column";
  printArea.style.alignItems = "center";

  const albumTitle = document.getElementById("albumTitle").textContent;
  const titleElement = document.createElement("h2");
  titleElement.textContent = albumTitle;
  titleElement.style.textAlign = "center";
  titleElement.style.marginBottom = "1.5rem";
  printArea.appendChild(titleElement);

  const cardContainer = document.createElement("div");
  cardContainer.style.display = "flex";
  cardContainer.style.flexWrap = "wrap";
  cardContainer.style.justifyContent = "center";
  cardContainer.style.gap = "1rem";
  cardContainer.style.width = "100%";

  const cards = document.querySelectorAll(".card");
  cards.forEach(card => {
    const cloned = card.cloneNode(true);
    cloned.style.pageBreakInside = "avoid";
    cloned.style.width = "180px";
    const img = cloned.querySelector("img");
    if (img) {
      img.style.maxWidth = "100%";
      img.style.height = "auto";
    }
    cardContainer.appendChild(cloned);
  });

  printArea.appendChild(cardContainer);
  document.body.appendChild(printArea);

  html2pdf().set({
    margin: 0,
    filename: '리틀타임즈_성장앨범.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      scrollY: 0
    },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
  }).from(printArea).save().then(() => {
    document.body.removeChild(printArea);
  });
}

// 공유 링크 복사
function copyShareLink() {
  const link = window.location.href;
  navigator.clipboard.writeText(link)
    .then(() => alert("공유 링크가 복사되었습니다! 친구에게 붙여넣어 전달해 보세요."))
    .catch(() => alert("복사에 실패했습니다. 직접 복사해 주세요."));
}
