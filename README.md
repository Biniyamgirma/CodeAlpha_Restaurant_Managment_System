# Restaurant Management System

A robust backend system for managing restaurant operations, built with Node.js, Express, and PostgreSQL. This system provides essential functionalities for tracking sales, managing staff, and more.

## ✨ Features

*   **Sales Reporting**: Generate daily sales summaries with filtering by date range.
*   **Staff Management**: Functionality to manage restaurant staff.
*   **Scalable Architecture**: Clean, modular structure to easily add new features.

## 🛠️ Technology Stack

*   **Backend**: Node.js, Express.js
*   **Database**: PostgreSQL
*   **Dependency Management**: npm

## 📋 Prerequisites

Before you begin, ensure you have the following installed on your system:
*   [Node.js](https://nodejs.org/en/) (v14 or newer recommended)
*   [npm](https://www.npmjs.com/) (comes with Node.js)
*   [PostgreSQL](https://www.postgresql.org/download/)

## 🚀 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### 1. Clone the Repository

```bash
git clone https://github.com/Biniyamgirma/CodeAlpha_Restaurant_Managment_System.git
cd RestaurantManagmentSystem
```

### 2. Install Dependencies

Install the required npm packages.

```bash
npm install
```

### 3. Environment Configuration

Create a `.env` file in the root of the project by copying the example file:

```bash
cp .env.example .env
```

Now, open the `.env` file and update the variables with your local PostgreSQL database credentials.

### 4. Database Setup

1.  Make sure your PostgreSQL server is running.
2.  Connect to your PostgreSQL instance and create a new database if it doesn't exist.

    ```sql
    CREATE DATABASE your_database_name;
    ```
3.  Run the database migration/schema scripts to create the necessary tables. (It is recommended to have these scripts in a `db/` directory).

    *Example `daily_sales_summary` table schema:*
    ```sql
    CREATE TABLE daily_sales_summary (
        id SERIAL PRIMARY KEY,
        restaurant_id INT NOT NULL,
        sale_date DATE NOT NULL,
        total_sales NUMERIC(10, 2) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    ```

### 5. Run the Application

Start the development server.

```bash
npm start
```

The server should now be running on the `PORT` specified in your `.env` file (e.g., `http://localhost:3000`).

## API Endpoints

Here are some of the available API endpoints.

### Reports

*   **Get Daily Sales Summary**
    *   **URL**: `/api/reports/daily-sales-summary`
    *   **Method**: `GET`
    *   **Query Parameters**:
        *   `restaurant_id` (required): The ID of the restaurant.
        *   `start_date` (optional): The start date for the report (e.g., `YYYY-MM-DD`).
        *   `end_date` (optional): The end date for the report (e.g., `YYYY-MM-DD`).
    *   **Success Response**:
        *   **Code**: `200 OK`
        *   **Content**: `[ { "id": 1, "restaurant_id": 1, "sale_date": "2023-10-27T00:00:00.000Z", "total_sales": "1500.75" } ]`
    *   **Error Response**:
        *   **Code**: `400 Bad Request` (if `restaurant_id` is missing)
        *   **Code**: `404 Not Found` (if no data is found)
        *   **Code**: `500 Internal Server Error`

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License

Distributed under the MIT License. It is recommended to add a `LICENSE` file to the project.
