import pandas as pd
import numpy as np
import tensorflow as tf
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import MinMaxScaler
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, LSTM
from tensorflow.keras.optimizers import Adam
import joblib

# Preprocess the data
def preprocess_data(file_path, timesteps):
    data = pd.read_csv(file_path)

    # Select relevant numeric columns
    numeric_cols = ["year", "reclat", "reclong"]
    data = data[numeric_cols]

    # Handle missing values by filling with column means
    data.fillna(data.mean(), inplace=True)

    # Normalize data
    scaler = MinMaxScaler()
    data_scaled = scaler.fit_transform(data)
    
    # Save the scaler for use in app.py
    joblib.dump(scaler, "scaler.pkl")

    # Convert data into sequences
    X, y = [], []
    for i in range(len(data_scaled) - timesteps):
        X.append(data_scaled[i:i + timesteps])
        y.append(data_scaled[i + timesteps, 0])  # Predicting "year" as an example

    return np.array(X), np.array(y)

# Load and preprocess the dataset
file_path = "meteor_data.csv"
timesteps = 10  # Define sequence length
X, y = preprocess_data(file_path, timesteps)

# Split the data into training and testing sets
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Define the RNN model
model = Sequential([
    LSTM(64, input_shape=(timesteps, X.shape[2]), activation='relu', return_sequences=True),
    LSTM(32, activation='relu'),
    Dense(1)
])

# Compile the model
model.compile(optimizer=Adam(learning_rate=0.001), loss='mse', metrics=['mse'])

# Train the model
model.fit(X_train, y_train, validation_data=(X_test, y_test), epochs=20, batch_size=32)

# Save the model
model.save('meteor_rnn_model.keras')
print("Model training complete and saved!")
