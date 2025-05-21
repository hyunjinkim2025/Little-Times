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

  const imageAges = await Promise.all(
    files.map(async (file) => {
      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name}은(는) 5MB를 초과하여 업로드할 수 없어요.`);
        return null;
      }

      const img = await loadImage(file);
      const results = await faceapi.detectAllFaces(img, new faceapi.TinyFaceDetectorOptions()).withAgeAndGender();
      if (!results.length) return null;
      const youngest = results.reduce((min, r) => r.age < min.age ? r : min, results[0]);
      return { file, age: youngest.age };
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

function downloadPDF() {
  const printArea = document.createElement("div");
  printArea.style.width = "100%";
  printArea.style.minHeight = "297mm";
  printArea.style.boxSizing = "border-box";
  printArea.style.backgroundImage = "url('./images/bg.png')";
  printArea.style.backgroundRepeat = "repeat";
  printArea.style.backgroundSize = "auto";
  printArea.style.display = "flex";
  printArea.style.flexDirection = "column";
  printArea.style.alignItems = "center";

  const albumTitle = document.getElementById("albumTitle").textContent;
  const titleElement = document.createElement("h2");
  titleElement.textContent = albumTitle;
  titleElement.style.textAlign = "center";
  titleElement.style.margin = "20px";
  printArea.appendChild(titleElement);

  const cardContainer = document.createElement("div");
  cardContainer.style.display = "flex";
  cardContainer.style.flexWrap = "wrap";
  cardContainer.style.justifyContent = "space-around";
  cardContainer.style.alignItems = "flex-start";
  cardContainer.style.gap = "1rem";
  cardContainer.style.padding = "10mm";
  cardContainer.style.width = "100%";
  cardContainer.style.boxSizing = "border-box";

  const cards = document.querySelectorAll(".card");
  cards.forEach(card => {
    const cloned = card.cloneNode(true);
    cloned.style.pageBreakInside = "avoid";
    cloned.style.breakInside = "avoid";
    cloned.style.overflow = "hidden";
    cloned.style.width = "260px";
    cloned.style.margin = "1rem";
    cloned.style.backgroundImage = "none";
    cloned.style.backgroundColor = "rgba(255,255,255,0)";

    const img = cloned.querySelector("img");
    if (img) {
      img.style.maxWidth = "100%";
      img.style.height = "auto";
    }

    const caption = cloned.querySelector(".caption");
    if (caption) {
      caption.removeAttribute("contenteditable");
      caption.style.background = "#f9f5f2";
      caption.style.border = "1px dashed #ccc";
      caption.style.borderRadius = "6px";
      caption.style.padding = "5px";
      caption.style.color = "#444";
      caption.style.fontSize = "0.9rem";
      caption.style.marginTop = "0.5rem";
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
      allowTaint: false,
      scrollY: 0
    },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak: {
      mode: ['avoid-all', 'css', 'legacy'],
      before: ['.card']
    }
  }).from(printArea).save().then(() => {
    document.body.removeChild(printArea);
  });
}


function copyShareLink() {
  const link = window.location.href;
  navigator.clipboard.writeText(link)
    .then(() => alert("공유 링크가 복사되었습니다! 친구에게 붙여넣어 전달해 보세요."))
    .catch(() => alert("복사에 실패했습니다. 직접 복사해 주세요."));
}

