let lossData = [];
let isTrained = false;


/* -----------------------------
   DATASET
----------------------------- */

const defaultDataset = [
    [0, 0, 0],
    [0, 1, 1],
    [1, 0, 1],
    [1, 1, 0]
];


document.addEventListener("DOMContentLoaded", () => {

    renderDataset(defaultDataset);

});


function renderDataset(dataset) {

    const body = document.getElementById("datasetBody");

    body.innerHTML = "";

    dataset.forEach((row, index) => {

        addDatasetRow(
            row[0],
            row[1],
            row[2]
        );

    });

    updateRowNumbers();
}


function addDatasetRow(
    x1 = 0,
    x2 = 0,
    target = 0
) {

    const body = document.getElementById("datasetBody");

    const row = document.createElement("tr");

    row.innerHTML = `

        <td class="dataset-row-number">
            01
        </td>

        <td>
            <input
                type="number"
                step="any"
                class="data-input x1"
                value="${x1}"
            >
        </td>

        <td>
            <input
                type="number"
                step="any"
                class="data-input x2"
                value="${x2}"
            >
        </td>

        <td>
            <input
                type="number"
                min="0"
                max="1"
                step="1"
                class="data-input target"
                value="${target}"
            >
        </td>

        <td>
            <button
                class="delete-row"
                onclick="removeRow(this)"
                title="Remove row"
            >
                ×
            </button>
        </td>

    `;

    body.appendChild(row);

    updateRowNumbers();
}


function addRow() {

    addDatasetRow(0, 0, 0);

}


function removeRow(button) {

    const body = document.getElementById("datasetBody");

    if (body.children.length <= 2) {

        alert("At least 2 training examples are required.");

        return;
    }

    button.closest("tr").remove();

    updateRowNumbers();

}


function updateRowNumbers() {

    const rows =
        document.querySelectorAll("#datasetBody tr");

    rows.forEach((row, index) => {

        row.querySelector(
            ".dataset-row-number"
        ).textContent =
            String(index + 1).padStart(2, "0");

    });

}


function getDataset() {

    const rows =
        document.querySelectorAll("#datasetBody tr");

    const dataset = [];

    rows.forEach(row => {

        const x1 =
            parseFloat(
                row.querySelector(".x1").value
            );

        const x2 =
            parseFloat(
                row.querySelector(".x2").value
            );

        const target =
            parseFloat(
                row.querySelector(".target").value
            );

        if (
            !Number.isNaN(x1) &&
            !Number.isNaN(x2) &&
            !Number.isNaN(target)
        ) {

            dataset.push([
                x1,
                x2,
                target
            ]);

        }

    });

    return dataset;
}


function loadXOR() {

    renderDataset(defaultDataset);

    clearResults();

}


/* -----------------------------
   TRAINING
----------------------------- */

async function trainModel() {

    const button =
        document.getElementById("trainButton");

    const status =
        document.getElementById("trainingStatus");

    const modelStatus =
        document.getElementById("modelStatus");

    const dataset = getDataset();

    const epochs =
        parseInt(
            document.getElementById("epochs").value
        );

    const learningRate =
        parseFloat(
            document.getElementById("learningRate").value
        );


    if (dataset.length < 2) {

        alert(
            "Please add at least 2 training examples."
        );

        return;
    }


    if (
        !epochs ||
        epochs < 100
    ) {

        alert(
            "Epochs must be at least 100."
        );

        return;
    }


    if (
        !learningRate ||
        learningRate <= 0
    ) {

        alert(
            "Learning rate must be greater than 0."
        );

        return;
    }


    button.disabled = true;

    button.innerHTML =
        '<span class="button-icon">◌</span> Training...';


    status.textContent = "TRAINING";

    status.style.color = "#a78bfa";

    modelStatus.textContent = "Training model";


    try {

        const response = await fetch(
            "/train",
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({
                    dataset,
                    epochs,
                    learning_rate:
                        learningRate
                })
            }
        );


        const result =
            await response.json();


        if (!result.success) {

            throw new Error(
                result.error
            );

        }


        isTrained = true;

        lossData =
            result.loss_history;


        document.getElementById(
            "accuracy"
        ).textContent =
            result.accuracy + "%";


        document.getElementById(
            "finalLoss"
        ).textContent =
            formatLoss(result.final_loss);


        document.getElementById(
            "epochDisplay"
        ).textContent =
            epochs.toLocaleString();


        document.getElementById(
            "modelDisplay"
        ).textContent =
            "TRAINED";


        status.textContent =
            "TRAINED";


        status.style.color =
            "#4ade80";


        modelStatus.textContent =
            "Model trained";


        drawLossChart(lossData);

        renderPredictions(
            result.predictions
        );

        animateNetwork();


        button.innerHTML =
            '<span class="button-icon">✓</span> Train again';


    } catch (error) {

        alert(
            "Training error: " +
            error.message
        );

        status.textContent =
            "ERROR";

        status.style.color =
            "#fb7185";


    } finally {

        button.disabled = false;

    }

}


function formatLoss(value) {

    if (value === 0) {
        return "0.000000";
    }

    if (value < 0.000001) {
        return value.toExponential(2);
    }

    return value.toFixed(6);
}


/* -----------------------------
   PREDICTIONS TABLE
----------------------------- */

function renderPredictions(predictions) {

    const body =
        document.getElementById(
            "resultsBody"
        );


    body.innerHTML = "";


    predictions.forEach(item => {

        const row =
            document.createElement("tr");


        const resultHTML =
            item.correct

                ? `
                    <span class="result-correct">
                        ● Correct
                    </span>
                `

                : `
                    <span class="result-wrong">
                        ● Incorrect
                    </span>
                `;


        row.innerHTML = `

            <td>
                ${formatNumber(item.x1)}
            </td>

            <td>
                ${formatNumber(item.x2)}
            </td>

            <td>
                <strong>
                    ${item.actual}
                </strong>
            </td>

            <td>
                <strong>
                    ${item.predicted}
                </strong>
            </td>

            <td>

                <span class="confidence-bar">

                    <span
                        class="confidence-fill"
                        style="
                            width:${item.probability}%
                        "
                    ></span>

                </span>

                ${item.probability}%

            </td>

            <td>
                ${resultHTML}
            </td>

        `;


        body.appendChild(row);

    });

}


function formatNumber(value) {

    if (
        Number.isInteger(value)
    ) {

        return value;

    }

    return Number(value).toFixed(3);

}


/* -----------------------------
   LOSS GRAPH
----------------------------- */

function drawLossChart(data) {

    const canvas =
        document.getElementById(
            "lossChart"
        );

    const empty =
        document.getElementById(
            "emptyChart"
        );


    empty.classList.add("hidden");


    const container =
        canvas.parentElement;


    const dpr =
        window.devicePixelRatio || 1;


    const width =
        container.clientWidth;


    const height =
        container.clientHeight;


    canvas.width =
        width * dpr;


    canvas.height =
        height * dpr;


    canvas.style.width =
        width + "px";


    canvas.style.height =
        height + "px";


    const ctx =
        canvas.getContext("2d");


    ctx.scale(dpr, dpr);


    const padding = {

        left: 55,

        right: 25,

        top: 25,

        bottom: 45

    };


    const chartWidth =
        width -
        padding.left -
        padding.right;


    const chartHeight =
        height -
        padding.top -
        padding.bottom;


    let maxLoss =
        Math.max(...data);


    if (
        maxLoss <= 0
    ) {

        maxLoss = 1;

    }


    const minLoss = 0;


    // Background grid

    ctx.lineWidth = 1;

    ctx.strokeStyle =
        "rgba(255,255,255,0.055)";


    const gridLines = 5;


    for (
        let i = 0;
        i <= gridLines;
        i++
    ) {

        const y =
            padding.top +
            (chartHeight / gridLines) *
            i;


        ctx.beginPath();

        ctx.moveTo(
            padding.left,
            y
        );

        ctx.lineTo(
            width - padding.right,
            y
        );

        ctx.stroke();


        const value =
            maxLoss -
            (maxLoss / gridLines) *
            i;


        ctx.fillStyle =
            "#555c73";


        ctx.font =
            "9px Inter";


        ctx.textAlign =
            "right";


        ctx.fillText(
            value.toFixed(2),
            padding.left - 10,
            y + 3
        );

    }


    // X axis labels

    ctx.fillStyle =
        "#555c73";

    ctx.font =
        "9px Inter";


    ctx.textAlign =
        "center";


    const labels = 5;


    for (
        let i = 0;
        i <= labels;
        i++
    ) {

        const x =
            padding.left +
            (chartWidth / labels) *
            i;


        const epoch =
            Math.round(
                (i / labels) *
                100
            );


        ctx.fillText(
            epoch + "%",
            x,
            height - 16
        );

    }


    // Draw line

    const points = data.map(
        (loss, index) => {

            const x =
                padding.left +
                (index /
                    (data.length - 1)) *
                chartWidth;


            const y =
                padding.top +
                chartHeight -
                ((loss - minLoss) /
                    (maxLoss - minLoss)) *
                chartHeight;


            return {
                x,
                y
            };

        }
    );


    // Gradient

    const gradient =
        ctx.createLinearGradient(
            0,
            0,
            width,
            0
        );


    gradient.addColorStop(
        0,
        "#8b5cf6"
    );


    gradient.addColorStop(
        1,
        "#4f8cff"
    );


    ctx.strokeStyle =
        gradient;


    ctx.lineWidth = 2.5;

    ctx.lineJoin = "round";

    ctx.lineCap = "round";


    ctx.beginPath();


    points.forEach(
        (point, index) => {

            if (index === 0) {

                ctx.moveTo(
                    point.x,
                    point.y
                );

            } else {

                ctx.lineTo(
                    point.x,
                    point.y
                );

            }

        }
    );


    ctx.stroke();


    // Area below graph

    const areaGradient =
        ctx.createLinearGradient(
            0,
            padding.top,
            0,
            height
        );


    areaGradient.addColorStop(
        0,
        "rgba(139,92,246,0.18)"
    );


    areaGradient.addColorStop(
        1,
        "rgba(139,92,246,0)"
    );


    ctx.fillStyle =
        areaGradient;


    ctx.beginPath();


    points.forEach(
        (point, index) => {

            if (index === 0) {

                ctx.moveTo(
                    point.x,
                    point.y
                );

            } else {

                ctx.lineTo(
                    point.x,
                    point.y
                );

            }

        }
    );


    ctx.lineTo(
        points[points.length - 1].x,
        padding.top + chartHeight
    );


    ctx.lineTo(
        points[0].x,
        padding.top + chartHeight
    );


    ctx.closePath();

    ctx.fill();

}


/* -----------------------------
   PREDICT
----------------------------- */

async function predictValue() {

    if (!isTrained) {

        alert(
            "Please train the model first."
        );

        return;
    }


    const x1 =
        parseFloat(
            document.getElementById(
                "testX1"
            ).value
        );


    const x2 =
        parseFloat(
            document.getElementById(
                "testX2"
            ).value
        );


    if (
        Number.isNaN(x1) ||
        Number.isNaN(x2)
    ) {

        alert(
            "Please enter valid values."
        );

        return;
    }


    try {

        const response =
            await fetch(
                "/predict",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        x1,
                        x2
                    })
                }
            );


        const result =
            await response.json();


        if (!result.success) {

            throw new Error(
                result.error
            );

        }


        renderPrediction(
            result
        );


    } catch (error) {

        alert(
            "Prediction error: " +
            error.message
        );

    }

}


function renderPrediction(result) {

    const container =
        document.getElementById(
            "predictionResult"
        );


    const prediction =
        result.prediction;


    container.innerHTML = `

        <div class="prediction-output">

            <div class="prediction-main">

                <div class="prediction-circle">
                    ${prediction}
                </div>

                <div>

                    <div class="prediction-label">
                        PREDICTION
                    </div>

                    <div class="prediction-value">
                        ${prediction}
                    </div>

                </div>

            </div>


            <div class="prediction-metric">

                <span>
                    OUTPUT PROBABILITY
                </span>

                <strong>
                    ${result.probability}%
                </strong>

            </div>


            <div class="prediction-metric">

                <span>
                    CONFIDENCE
                </span>

                <strong>
                    ${result.confidence}%
                </strong>

            </div>


            <div class="prediction-metric">

                <span>
                    INPUT
                </span>

                <strong>
                    (${formatNumber(
                        parseFloat(
                            document.getElementById(
                                "testX1"
                            ).value
                        )
                    )},
                    ${formatNumber(
                        parseFloat(
                            document.getElementById(
                                "testX2"
                            ).value
                        )
                    )})
                </strong>

            </div>

        </div>

    `;

}


/* -----------------------------
   NETWORK ANIMATION
----------------------------- */

function animateNetwork() {

    const lines =
        document.querySelectorAll(
            ".connections line"
        );


    lines.forEach(
        line => {

            line.classList.remove(
                "active"
            );

        }
    );


    lines.forEach(
        (line, index) => {

            setTimeout(
                () => {

                    line.classList.add(
                        "active"
                    );

                },
                index * 100
            );

        }
    );


    setTimeout(
        () => {

            lines.forEach(
                line => {

                    line.classList.remove(
                        "active"
                    );

                }
            );

        },
        1800
    );

}


/* -----------------------------
   CLEAR RESULTS
----------------------------- */

function clearResults() {

    isTrained = false;

    lossData = [];


    document.getElementById(
        "accuracy"
    ).textContent = "—";


    document.getElementById(
        "finalLoss"
    ).textContent = "—";


    document.getElementById(
        "epochDisplay"
    ).textContent = "—";


    document.getElementById(
        "modelDisplay"
    ).textContent = "READY";


    document.getElementById(
        "modelStatus"
    ).textContent =
        "Model ready";


    document.getElementById(
        "trainingStatus"
    ).textContent =
        "READY";


    document.getElementById(
        "trainingStatus"
    ).style.color =
        "#4ade80";


    document.getElementById(
        "resultsBody"
    ).innerHTML = `

        <tr>

            <td
                colspan="6"
                class="empty-table"
            >
                Train the model to view predictions.

            </td>

        </tr>

    `;


    const empty =
        document.getElementById(
            "emptyChart"
        );


    empty.classList.remove(
        "hidden"
    );


    const canvas =
        document.getElementById(
            "lossChart"
        );


    const ctx =
        canvas.getContext("2d");


    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    document.getElementById(
        "predictionResult"
    ).innerHTML = `

        <div class="prediction-placeholder">

            <span class="prediction-dot"></span>

            Train your model, then enter values above.

        </div>

    `;

}


/* -----------------------------
   SCROLL
----------------------------- */

function scrollToTraining() {

    document
        .getElementById("training")
        .scrollIntoView({
            behavior: "smooth",
            block: "center"
        });

}