// Configura la cámara para capturar video en tiempo real
async function configurarCamara() {
    const video = document.getElementById('video');
    const flujo = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = flujo;

    return new Promise((resolver) => {
        video.onloadedmetadata = () => {
            resolver(video);
        };
    });
}

async function cargarPosenet() {
    return await posenet.load();
}

function obtenerPuntosClaveSeleccionados() {
    const checkboxes = document.querySelectorAll('.keypoint');
    return Array.from(checkboxes).filter(checkbox => checkbox.checked).map(checkbox => checkbox.value);
}

// Dibuja los puntos clave en el canvas
function dibujarPuntosClave(puntosClave, confianzaMinima, ctx, puntosClaveSeleccionados) {
    puntosClave.forEach(puntoClave => {
        if (puntoClave.score > confianzaMinima && puntosClaveSeleccionados.includes(puntoClave.part)) {
            const { y, x } = puntoClave.position;
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, 2 * Math.PI); // Dibuja un círculo en el punto clave
            ctx.fillStyle = 'aqua';
            ctx.fill();
        }
    });
}

// Dibuja el esqueleto en el canvas
function dibujarEsqueleto(puntosClave, confianzaMinima, ctx, puntosClaveSeleccionados) {
    const puntosClaveAdyacentes = posenet.getAdjacentKeyPoints(puntosClave, confianzaMinima);
    puntosClaveAdyacentes.forEach(([puntoClave1, puntoClave2]) => {
        // Comprueba si ambos puntos clave están seleccionados
        if (puntosClaveSeleccionados.includes(puntoClave1.part) && puntosClaveSeleccionados.includes(puntoClave2.part)) {
            dibujarSegmento(puntoClave1.position, puntoClave2.position, 'aqua', 2, ctx); 
        }
    });
}

// Dibuja un segmento en el canvas
function dibujarSegmento({ y: ay, x: ax }, { y: by, x: bx }, color, escala, ctx) {
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by); // Dibuja una línea entre dos puntos
    ctx.lineWidth = escala;
    ctx.strokeStyle = color;
    ctx.stroke();
}

// Detecta la pose en el video y Actualiza el canvas en cada frame
async function detectarPose(video, red) {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    async function marcoDeteccionPose() {
        const pose = await red.estimateSinglePose(video, {
            flipHorizontal: false
        });

        const puntosClaveSeleccionados = obtenerPuntosClaveSeleccionados();

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height); // Dibuja el frame del video en el canvas

        dibujarPuntosClave(pose.keypoints, 0.6, ctx, puntosClaveSeleccionados); // Dibuja los puntos clave en el canvas
        dibujarEsqueleto(pose.keypoints, 0.6, ctx, puntosClaveSeleccionados); // Dibuja el esqueleto en el canvas

        requestAnimationFrame(marcoDeteccionPose);
    }

    marcoDeteccionPose();
}

async function principal() {
    const video = await configurarCamara();
    video.play(); // Reproduce el video

    const red = await cargarPosenet();
    detectarPose(video, red);
}

// Botones para seleccionar todo y deseleccionar
document.getElementById("select-all")
        .addEventListener("click", function () {
          document
            .querySelectorAll(".keypoint")
            .forEach(function (checkbox) {
              checkbox.checked = true;
            });
        });

      document.getElementById("deselect-all")
        .addEventListener("click", function () {
          document
            .querySelectorAll(".keypoint")
            .forEach(function (checkbox) {
              checkbox.checked = false;
            });
        });

principal(); // Llama a la función principal para iniciar la aplicación
