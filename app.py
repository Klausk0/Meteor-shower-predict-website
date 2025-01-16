import pandas as pd
import tensorflow as tf

# Load the model
model = tf.keras.models.load_model('meteor_rnn_model.keras')

# Load the dataset
file_path = "meteor_data.csv"
data = pd.read_csv(file_path)

# Display the first few rows of the dataset
print(data.head())

# Display dataset columns
print(data.columns)

# Process the dataset for prediction (example)
X = data.drop(columns=data.columns[-1])  # Drop last column
X = X.select_dtypes(include=['float64', 'int64']).values  # Ensure numeric only
X = X.reshape((X.shape[0], X.shape[1], 1))  # Reshape for LSTM input

# Make predictions
predictions = model.predict(X)

# Show some predictions
print("Predictions:")
print(predictions[:5])

@app.route('/get-meteors', methods=['GET'])
def get_meteors():
    try:
        # Retrieve month parameter
        month = int(request.args.get('month', -1))
        if month < 1 or month > 12:
            return jsonify({'error': 'Invalid month'}), 400

        # Filter data for the selected month
        filtered_data = data[data['month'] == month]

        # Prepare data for prediction
        X = filtered_data.drop(columns=['month', 'other_columns_to_exclude'], errors='ignore')
        X = X.values.reshape((X.shape[0], X.shape[1], 1))

        # Predict meteors
        predictions = model.predict(X)
        filtered_data['predictions'] = predictions

        # Format response
        response = [{'x': row['x'], 'y': row['y'], 'z': row['z']} for _, row in filtered_data.iterrows()]
        return jsonify(response)
    except Exception as e:
        print(f"Error in /get-meteors: {e}")
        return jsonify({'error': 'Internal server error'}), 500


