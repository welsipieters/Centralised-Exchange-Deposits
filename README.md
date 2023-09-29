# Knaken Deposits Service

This service enables the generation and management of deposit addresses on the Sepolia testnet, providing functionality to generate deposit addresses and retrieve unused ones.

## 🌐 Deployment Details

- **Contract Address:** [0xa2722d5053f25df4006ffd56647273ac24d0af15](https://sepolia.etherscan.io/address/0xa2722d5053f25df4006ffd56647273ac24d0af15) on Sepolia testnet.
- **Deployment Transaction:** [View on Etherscan](https://sepolia.etherscan.io/tx/0x820202a80558adc5988d6bb25ee5dda818fd3570f836eb08ec57e32f0839b11d)

## 🚀 Setup and Installation

### 1. Clone the Repository

```sh
git clone git@github.com:welsipieters/knaken-deposits.git
```

### 2. Navigate to the Project Directory

```sh
cd knaken-deposits
```

### 3. Install Dependencies

```sh
yarn install
```

### 4. Configure Environment Variables

Duplicate the `.env.example` file and rename it to `.env`, then configure the required environment variables.

```sh
cp .env.example .env
```

### 5. Run the Service

```sh
yarn run serve
```

The service will be accessible at `http://localhost:[PORT]`, replacing `[PORT]` with the configured port in your `.env` file or the application’s default port.

## 🛠 Available Routes

### 1. Generate Deposit Addresses

- **Endpoint:** `/deposit-addresses/generate/:count`
- **Method:** `POST`
- **Description:** Generates the specified number of deposit addresses.
- **Parameters:** `count` (path) – The number of deposit addresses to generate. Must be a positive integer.

**Responses:**
- `200 OK`
   ```json
   {
     "success": true,
     "txHash": "0x1234abcd..."
   }
   ```
- `400 Bad Request`
   ```json
   {
     "success": false,
     "message": "Invalid count parameter"
   }
   ```
- `500 Internal Server Error`
   ```json
   {
     "success": false,
     "message": "Internal Server Error"
   }
   ```

### 2. Fetch and Mark Unused Deposit Address

- **Endpoint:** `/deposit-addresses/unused`
- **Method:** `GET`
- **Description:** Retrieves and marks an unused deposit address as used.

**Responses:**
- `200 OK`
   ```json
   {
     "success": true,
     "address": "0x1234abcd..."
   }
   ```
- `404 Not Found`
   ```json
   {
     "success": false,
     "message": "No unused address found"
   }
   ```
- `500 Internal Server Error`
   ```json
   {
     "success": false,
     "message": "Internal Server Error"
   }
   ```

