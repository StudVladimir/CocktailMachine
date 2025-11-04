# Backend (Node.js + Express)

## How to Start

1. Install dependencies:
    ```sh
    npm install
    ```

2. Start the server:
    ```sh
    node index.js
    ```
    > By default, the server runs on **port 3000** (can be changed in `index.js`).

## Entry Point

- Main server file: **index.js**

## Notes

- If you use a database or environment variables, add a `.env` file and describe its structure.
- For automatic server restart on changes, you can use [nodemon](https://www.npmjs.com/package/nodemon):
    ```sh
    npm install -g nodemon
    nodemon index.js
    ```