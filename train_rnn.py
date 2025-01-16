import pandas as pd
import tensorflow as tf
from sklearn.model_selection import train_test_split
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, LSTM
from tensorflow.keras.optimizers import Adam

# Preprocess the data
def preprocess_data(file_path):
    data = pd.read_csv(file_path)
    # Use only numeric columns for simplicity
    data = data.select_dtypes(include=['float64', 'int64'])
    return data

# Load and preprocess the dataset
file_path = "meteor_data.csv"
data = preprocess_data(file_path)

# Separate features and target
X = data.drop(columns=data.columns[-1])  # Drop last column as target
y = data[data.columns[-1]]  # Use last column as target

# Split the data into training and testing sets
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Define the RNN model
model = Sequential([
    LSTM(64, input_shape=(X_train.shape[1], 1), activation='relu', return_sequences=True),
    LSTM(32, activation='relu'),
    Dense(1)
])

# Compile the model
model.compile(optimizer=Adam(learning_rate=0.001), loss='mse', metrics=['mse'])

# Reshape data for LSTM input
X_train = X_train.values.reshape((X_train.shape[0], X_train.shape[1], 1))
X_test = X_test.values.reshape((X_test.shape[0], X_test.shape[1], 1))

# Train the model
model.fit(X_train, y_train, validation_data=(X_test, y_test), epochs=10, batch_size=32)

# Save the model in the new Keras format
model.save('meteor_rnn_model.keras')
print("Model training complete and saved!")
