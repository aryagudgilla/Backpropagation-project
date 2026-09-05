import numpy as np


class NeuralNetwork:

    def __init__(
        self,
        input_size=2,
        hidden_size=4,
        output_size=1,
        learning_rate=0.1
    ):

        self.learning_rate = learning_rate

        # Weight initialization
        self.W1 = np.random.randn(input_size, hidden_size) * 0.5
        self.b1 = np.zeros((1, hidden_size))

        self.W2 = np.random.randn(hidden_size, output_size) * 0.5
        self.b2 = np.zeros((1, output_size))

    # Sigmoid activation
    def sigmoid(self, x):
        x = np.clip(x, -500, 500)
        return 1 / (1 + np.exp(-x))

    # Derivative of sigmoid
    def sigmoid_derivative(self, x):
        return x * (1 - x)

    # Forward propagation
    def forward(self, X):

        self.hidden_input = np.dot(X, self.W1) + self.b1
        self.hidden_output = self.sigmoid(self.hidden_input)

        self.output_input = np.dot(
            self.hidden_output,
            self.W2
        ) + self.b2

        self.output = self.sigmoid(self.output_input)

        return self.output

    # Mean Squared Error
    def calculate_loss(self, y_true, y_pred):

        return np.mean(
            np.square(y_true - y_pred)
        )

    # Backpropagation
    def backward(self, X, y):

        samples = X.shape[0]

        # Output layer error
        output_error = self.output - y

        # Output gradient
        output_delta = (
            output_error *
            self.sigmoid_derivative(self.output)
        )

        # Hidden layer error
        hidden_error = np.dot(
            output_delta,
            self.W2.T
        )

        # Hidden gradient
        hidden_delta = (
            hidden_error *
            self.sigmoid_derivative(self.hidden_output)
        )

        # Gradients
        dW2 = np.dot(
            self.hidden_output.T,
            output_delta
        ) / samples

        db2 = np.sum(
            output_delta,
            axis=0,
            keepdims=True
        ) / samples

        dW1 = np.dot(
            X.T,
            hidden_delta
        ) / samples

        db1 = np.sum(
            hidden_delta,
            axis=0,
            keepdims=True
        ) / samples

        # Gradient descent
        self.W2 -= self.learning_rate * dW2
        self.b2 -= self.learning_rate * db2

        self.W1 -= self.learning_rate * dW1
        self.b1 -= self.learning_rate * db1

    # Training
    def train(self, X, y, epochs):

        X = np.array(X, dtype=float)
        y = np.array(y, dtype=float)

        loss_history = []

        for epoch in range(epochs):

            prediction = self.forward(X)

            loss = self.calculate_loss(
                y,
                prediction
            )

            self.backward(X, y)

            # Store enough points for smooth graph
            if (
                epoch < 100
                or epoch % max(1, epochs // 200) == 0
                or epoch == epochs - 1
            ):
                loss_history.append(
                    round(float(loss), 8)
                )

        return loss_history

    # Prediction
    def predict(self, X):

        X = np.array(X, dtype=float).reshape(1, -1)

        output = self.forward(X)

        return float(output[0][0])