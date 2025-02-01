import pandas as pd
import numpy as np
import tensorflow as tf
from flask import Flask, request, jsonify
from flask_cors import CORS
from sklearn.preprocessing import MinMaxScaler
import joblib

app = Flask(__name__)
CORS(app)  # Allow frontend requests

# Load the trained model and scaler
model = tf.keras.models.load_model("meteor_rnn_model.keras")
scaler = joblib.load("scaler.pkl")

@app.route("/get-meteors", methods=["GET"])
def get_meteor_predictions():
    try:
        month = request.args.get("month", type=int)
        if not month or month < 1 or month > 12:
            return jsonify({"error": "Invalid month. Please select a month between 1 and 12."}), 400

        # Load dataset
        try:
            data = pd.read_csv("meteor_data.csv")
        except FileNotFoundError:
            return jsonify({"error": "Meteor data file not found."}), 500

        # Ensure "date" column exists and convert to datetime
        if "date" not in data.columns:
            return jsonify({"error": "Dataset is missing the 'date' column."}), 500
        data["date"] = pd.to_datetime(data["date"], errors='coerce')

        # Filter data for the selected month
        month_data = data[data["date"].dt.month == month].copy()
        if month_data.empty:
            return jsonify({"error": f"No meteor data available for month {month}."}), 404

        # Check required columns
        numeric_columns = ["year", "reclat", "reclong"]
        for col in numeric_columns:
            if col not in month_data.columns:
                return jsonify({"error": f"Missing required column: {col}"}), 500

        # Prepare features for prediction
        month_data_numeric = month_data[numeric_columns].copy()
        month_data_numeric.fillna(month_data_numeric.mean(), inplace=True)

        # Scale data
        X_scaled = scaler.transform(month_data_numeric)

        # Create sequences
        timesteps = 10
        X_sequences = []
        geo_date_info = []

        for i in range(len(X_scaled) - timesteps):
            X_sequences.append(X_scaled[i : i + timesteps])
            geo_date_info.append({
                "location": str(month_data["GeoLocation"].iloc[i + timesteps]),  
                "date": month_data["date"].iloc[i + timesteps].strftime('%Y-%m-%d')
            })

        if not X_sequences:
            return jsonify({"error": f"Not enough data to generate predictions for month {month}."}), 404

        X_sequences = np.array(X_sequences)

        # Make predictions
        predictions = model.predict(X_sequences).flatten()
        predictions = predictions.reshape(-1, 1)
        predictions = scaler.inverse_transform(
            np.hstack([predictions, np.zeros((predictions.shape[0], X_sequences.shape[2] - 1))])
        )[:, 0]

        results = [
            {"mass": round(pred, 2), "location": info["location"], "date": info["date"]}
            for pred, info in zip(predictions[:10], geo_date_info)
        ]

        return jsonify({"month": month, "predictions": results}), 200

    except Exception as e:
        print("Server Error:", str(e))  # Print error in terminal
        return jsonify({"error": "Internal Server Error", "message": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)

