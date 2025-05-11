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
  const albumOriginal = document.getElementById("album");
  const clone = albumOriginal.cloneNode(true);
  clone.style.width = "800px";
  clone.style.padding = "20px";
  clone.style.background = "#ffffff";

  // 스타일 일괄 적용
  clone.querySelectorAll("img").forEach(img => {
    img.style.width = "100%";
    img.style.height = "auto";
    img.style.maxHeight = "auto";
    img.style.objectFit = "contain";
  });

  clone.querySelectorAll(".card").forEach(card => {
    card.style.pageBreakInside = "avoid";
    card.style.marginBottom = "20px";
  });

  const container = document.createElement("div");
  container.appendChild(clone);
  document.body.appendChild(container);

  html2pdf()
    .set({
      margin: 0,
      filename: "리틀타임즈_성장앨범.pdf",
      image: { type: "jpeg", quality: 1 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        scrollY: 0
      },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
    })
    .from(clone)
    .save()
    .then(() => {
      document.body.removeChild(container);
    });
}

