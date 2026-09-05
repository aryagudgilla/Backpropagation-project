from flask import Flask, render_template, request, jsonify
from neural_network import NeuralNetwork
import webbrowser
import threading

app = Flask(__name__)

trained_model = None


DEFAULT_DATASET = [
    [0, 0, 0],
    [0, 1, 1],
    [1, 0, 1],
    [1, 1, 0]
]


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/train", methods=["POST"])
def train():
    global trained_model

    try:
        data = request.get_json()

        dataset = data.get("dataset", [])
        epochs = int(data.get("epochs", 10000))
        learning_rate = float(data.get("learning_rate", 0.1))

        if len(dataset) < 2:
            return jsonify({
                "success": False,
                "error": "Please provide at least 2 training examples."
            })

        X = []
        y = []

        for row in dataset:
            if len(row) != 3:
                continue

            x1 = float(row[0])
            x2 = float(row[1])
            target = float(row[2])

            if target not in [0, 1]:
                return jsonify({
                    "success": False,
                    "error": "Target values must be either 0 or 1."
                })

            X.append([x1, x2])
            y.append([target])

        if len(X) < 2:
            return jsonify({
                "success": False,
                "error": "Invalid dataset."
            })

        trained_model = NeuralNetwork(
            input_size=2,
            hidden_size=4,
            output_size=1,
            learning_rate=learning_rate
        )

        loss_history = trained_model.train(
            X,
            y,
            epochs
        )

        predictions = []

        for i in range(len(X)):
            output = trained_model.predict(X[i])
            predicted_value = 1 if output >= 0.5 else 0

            predictions.append({
                "x1": X[i][0],
                "x2": X[i][1],
                "actual": int(y[i][0]),
                "predicted": predicted_value,
                "probability": round(float(output) * 100, 2),
                "correct": predicted_value == int(y[i][0])
            })

        accuracy = (
            sum(1 for item in predictions if item["correct"])
            / len(predictions)
        ) * 100

        return jsonify({
            "success": True,
            "accuracy": round(accuracy, 2),
            "final_loss": round(float(loss_history[-1]), 8),
            "loss_history": loss_history,
            "predictions": predictions,
            "weights": {
                "input_hidden": trained_model.W1.tolist(),
                "hidden_output": trained_model.W2.tolist()
            }
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        })


@app.route("/predict", methods=["POST"])
def predict():
    global trained_model

    try:
        if trained_model is None:
            return jsonify({
                "success": False,
                "error": "Please train the model first."
            })

        data = request.get_json()

        x1 = float(data.get("x1"))
        x2 = float(data.get("x2"))

        probability = trained_model.predict([x1, x2])

        prediction = 1 if probability >= 0.5 else 0

        confidence = probability if prediction == 1 else 1 - probability

        return jsonify({
            "success": True,
            "prediction": prediction,
            "probability": round(probability * 100, 2),
            "confidence": round(confidence * 100, 2)
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        })


def open_browser():
    webbrowser.open_new("http://127.0.0.1:5000/")


if __name__ == "__main__":
    threading.Timer(1.2, open_browser).start()

    app.run(
        host="127.0.0.1",
        port=5000,
        debug=False
    )