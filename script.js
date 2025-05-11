const uploadInput = document.getElementById('uploadInput');
const album = document.getElementById('album');
const title = document.getElementById('albumTitle');
const childNameInput = document.getElementById('childName');

// 제목에 이름 반영
childNameInput.addEventListener('input', () => {
  const name = childNameInput.value.trim();
  title.textContent = name ? `리틀타임즈, ${name}의 성장앨범` : '리틀타임즈, 아이의 성장앨범';
});

// face-api 모델 로드
async function loadModels() {
  await faceapi.nets.tinyFaceDetector.loadFromUri('./models');
  await faceapi.nets.ageGenderNet.loadFromUri('./models');
}

// 이미지 업로드 핸들링
uploadInput.addEventListener('change', async (event) => {
  if (!window.faceapi) {
    alert("face-api.js가 아직 로드되지 않았어요. 잠시 후 다시 시도해 주세요.");
    return;
  }

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
      const result = await faceapi
        .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
        .withAgeAndGender();
      return result ? { file, age: result.age } : null;
    })
  );

  imageAges
    .filter(Boolean)
    .sort((a, b) => a.age - b.age)
    .forEach(({ file }) => {
      const reader = new FileReader();
      reader.onload = function (e) {
        const card = document.createElement('div');
        card.className = 'card';

        const img = document.createElement('img');
        img.src = e.target.result;
        img.style.width = "100%";
        img.style.objectFit = "contain";
        img.style.maxHeight = "320px";

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

// 이미지 객체 생성
function loadImage(file) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.src = URL.createObjectURL(file);
  });
}

// PDF 다운로드
function downloadPDF() {
  const album = document.getElementById('album');
  html2canvas(album, {
    scale: 2,
    useCORS: true,
    scrollY: -window.scrollY
  }).then(canvas => {
    const imgData = canvas.toDataURL('image/jpeg', 1.0);
    const pdf = new jspdf.jsPDF('p', 'mm', 'a4');

    const pageWidth = 210;
    const pageHeight = 297;

    const imgProps = pdf.getImageProperties(imgData);
    const imgRatio = imgProps.width / imgProps.height;

    const pdfWidth = pageWidth;
    const pdfHeight = pdfWidth / imgRatio;

    let position = 0;
    let heightLeft = pdfHeight;

    pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position -= pageHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;
    }

    pdf.save('리틀타임즈_성장앨범.pdf');
  });
}



// 공유 링크 복사
function copyShareLink() {
  const link = window.location.href;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(link)
      .then(() => alert("공유 링크가 복사되었습니다! 친구에게 전달해 보세요."))
      .catch(() => alert("복사에 실패했습니다. 직접 복사해 주세요."));
  } else {
    alert("브라우저가 클립보드 복사를 지원하지 않아요.");
  }
}
